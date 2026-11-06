import json
from datetime import date, datetime, timedelta, timezone

import httpx

import db
import notify
from base_scraper import TourItem

NOW = datetime(2026, 11, 6, 12, 0, tzinfo=timezone.utc)


def _tour(title="ทัวร์ทดสอบ", pct=None, price=None, orig=None, dep=None, img="https://img.test/a.jpg", source=8) -> TourItem:
    return TourItem(
        title=title, tour_url=f"https://example.com/{title}", source_id=source,
        discount_percent=pct, discounted_price=price, original_price=orig,
        departure_date=dep, image_url=img,
    )


def _bubbles(message):
    return message["contents"]["contents"]


class TestBuildFlexMessage:
    def test_is_a_carousel_with_a_closing_card(self):
        msg = notify.build_flex_message([_tour("a", 10), _tour("b", 50)])
        assert msg["type"] == "flex" and msg["contents"]["type"] == "carousel"
        assert len(_bubbles(msg)) == 3  # two tours + "see all"
        assert _bubbles(msg)[-1]["footer"]["contents"][0]["action"]["uri"].endswith("/tours")

    def test_best_discounts_come_first(self):
        msg = notify.build_flex_message([_tour("low", 10), _tour("high", 55)])
        first = json.dumps(_bubbles(msg)[0], ensure_ascii=False)
        assert "high" in first and "ลด 55%" in first

    def test_never_exceeds_the_carousel_limit_of_12(self):
        msg = notify.build_flex_message([_tour(f"t{i}", i) for i in range(40)], total=40)
        assert len(_bubbles(msg)) <= 12
        assert "และอีก 29 รายการ" in json.dumps(_bubbles(msg)[-1], ensure_ascii=False)

    def test_alt_text_summarises_for_notifications(self):
        msg = notify.build_flex_message([_tour("a", 30), _tour("b", 53)], total=2)
        assert msg["altText"] == "🔥 ทัวร์ไฟไหม้ใหม่ 2 รายการ ลดสูงสุด 53%"
        assert len(msg["altText"]) <= 400

    def test_price_details(self):
        msg = notify.build_flex_message([_tour(pct=25, price=7500, orig=10000, dep=date(2026, 12, 1))])
        text = json.dumps(_bubbles(msg)[0], ensure_ascii=False)
        assert "฿7,500" in text and "฿10,000" in text and "ประหยัด ฿2,500 · ลด 25%" in text
        assert "เดินทาง 1 ธ.ค. 69" in text
        assert "line-through" in text

    def test_tour_button_opens_the_source_page(self):
        t = _tour("x", 20, 100)
        action = _bubbles(notify.build_flex_message([t]))[0]["footer"]["contents"][0]["action"]
        assert action == {"type": "uri", "label": "ดูทัวร์", "uri": t.tour_url}

    def test_known_source_name_shown(self):
        text = json.dumps(_bubbles(notify.build_flex_message([_tour(source=9)]))[0], ensure_ascii=False)
        assert "Navarich Travel" in text

    def test_missing_fields_do_not_break_the_card(self):
        bubble = _bubbles(notify.build_flex_message([_tour(img=None)]))[0]
        assert "hero" not in bubble
        assert "ติดต่อสอบถามราคา" in json.dumps(bubble, ensure_ascii=False)

    def test_http_images_are_dropped_because_line_needs_https(self):
        assert "hero" not in _bubbles(notify.build_flex_message([_tour(img="http://img.test/a.jpg")]))[0]

    def test_discount_badge_sits_on_the_image(self):
        hero = _bubbles(notify.build_flex_message([_tour(pct=40, img="https://i.test/a.jpg")]))[0]["hero"]
        assert hero["contents"][1]["position"] == "absolute"


class TestSendMessage:
    MSG = {"type": "text", "text": "hi"}

    def _capture(self, monkeypatch):
        seen = {}

        def fake_post(url, headers, json, timeout):
            seen.update(url=url, headers=headers, json=json)
            return httpx.Response(200, request=httpx.Request("POST", url))

        monkeypatch.setattr(httpx, "post", fake_post)
        return seen

    def test_skips_without_credentials(self, monkeypatch):
        for k in ("LINE_CHANNEL_ACCESS_TOKEN", "LINE_TO", "LINE_BROADCAST"):
            monkeypatch.delenv(k, raising=False)
        monkeypatch.setattr(httpx, "post", lambda *a, **k: (_ for _ in ()).throw(AssertionError("must not call")))
        assert notify.send_message(self.MSG) is False

    def test_needs_a_destination_not_just_a_token(self, monkeypatch):
        monkeypatch.setenv("LINE_CHANNEL_ACCESS_TOKEN", "t")
        monkeypatch.delenv("LINE_TO", raising=False)
        monkeypatch.delenv("LINE_BROADCAST", raising=False)
        monkeypatch.setattr(httpx, "post", lambda *a, **k: (_ for _ in ()).throw(AssertionError("must not call")))
        assert notify.send_message(self.MSG) is False

    def test_broadcast_goes_to_all_followers(self, monkeypatch):
        monkeypatch.setenv("LINE_CHANNEL_ACCESS_TOKEN", "tok")
        monkeypatch.setenv("LINE_BROADCAST", "true")
        monkeypatch.delenv("LINE_TO", raising=False)
        seen = self._capture(monkeypatch)
        assert notify.send_message(self.MSG) is True
        assert seen["url"].endswith("/message/broadcast")
        assert "to" not in seen["json"] and seen["json"]["messages"] == [self.MSG]
        assert seen["headers"]["Authorization"] == "Bearer tok"

    def test_push_goes_to_one_user(self, monkeypatch):
        monkeypatch.setenv("LINE_CHANNEL_ACCESS_TOKEN", "tok")
        monkeypatch.setenv("LINE_TO", "U123")
        monkeypatch.delenv("LINE_BROADCAST", raising=False)
        seen = self._capture(monkeypatch)
        assert notify.send_message(self.MSG) is True
        assert seen["url"].endswith("/message/push") and seen["json"]["to"] == "U123"

    def test_http_error_does_not_raise(self, monkeypatch):
        monkeypatch.setenv("LINE_CHANNEL_ACCESS_TOKEN", "bad")
        monkeypatch.setenv("LINE_BROADCAST", "true")
        monkeypatch.setattr(httpx, "post", lambda url, **k: httpx.Response(401, request=httpx.Request("POST", url)))
        assert notify.send_message(self.MSG) is False


class FakeDb:
    def __init__(self, last=None, pending=()):
        self.last, self.pending, self.marked = last, list(pending), None

    def install(self, monkeypatch):
        monkeypatch.setattr(db, "last_notified_at", lambda: self.last)
        monkeypatch.setattr(db, "fetch_unnotified", lambda: self.pending)
        monkeypatch.setattr(db, "mark_notified", lambda ids: setattr(self, "marked", ids))


def _configure(monkeypatch, sent):
    monkeypatch.setenv("LINE_CHANNEL_ACCESS_TOKEN", "tok")
    monkeypatch.setenv("LINE_BROADCAST", "true")
    monkeypatch.delenv("LINE_MIN_INTERVAL_HOURS", raising=False)
    monkeypatch.setattr(notify, "send_message", lambda m: sent.append(m) or True)


class TestRunNotifications:
    def test_sends_then_marks_every_pending_tour(self, monkeypatch):
        sent = []
        _configure(monkeypatch, sent)
        fake = FakeDb(pending=[(i, _tour(f"t{i}", i)) for i in range(1, 31)])
        fake.install(monkeypatch)

        assert notify.run_notifications(now=NOW) is True
        assert len(sent) == 1
        # 30 pending but only 11 fit in the carousel: all 30 are marked, the rest are summarised.
        assert fake.marked == list(range(1, 31))

    def test_holds_back_inside_the_interval(self, monkeypatch):
        sent = []
        _configure(monkeypatch, sent)
        fake = FakeDb(last=NOW - timedelta(hours=6), pending=[(1, _tour())])
        fake.install(monkeypatch)

        assert notify.run_notifications(now=NOW) is False
        assert sent == [] and fake.marked is None  # stays unannounced, goes out in a later run

    def test_sends_again_once_the_interval_has_passed(self, monkeypatch):
        sent = []
        _configure(monkeypatch, sent)
        fake = FakeDb(last=NOW - timedelta(hours=21), pending=[(1, _tour())])
        fake.install(monkeypatch)
        assert notify.run_notifications(now=NOW) is True

    def test_interval_is_configurable(self, monkeypatch):
        sent = []
        _configure(monkeypatch, sent)
        monkeypatch.setenv("LINE_MIN_INTERVAL_HOURS", "2")
        fake = FakeDb(last=NOW - timedelta(hours=3), pending=[(1, _tour())])
        fake.install(monkeypatch)
        assert notify.run_notifications(now=NOW) is True

    def test_nothing_pending_sends_nothing(self, monkeypatch):
        sent = []
        _configure(monkeypatch, sent)
        FakeDb().install(monkeypatch)
        assert notify.run_notifications(now=NOW) is False and sent == []

    def test_failed_send_leaves_tours_unmarked_for_retry(self, monkeypatch):
        _configure(monkeypatch, [])
        monkeypatch.setattr(notify, "send_message", lambda m: False)
        fake = FakeDb(pending=[(1, _tour())])
        fake.install(monkeypatch)
        assert notify.run_notifications(now=NOW) is False
        assert fake.marked is None

    def test_database_errors_never_propagate(self, monkeypatch):
        _configure(monkeypatch, [])
        monkeypatch.setattr(db, "last_notified_at", lambda: (_ for _ in ()).throw(RuntimeError("column notified_at does not exist")))
        assert notify.run_notifications(now=NOW) is False

    def test_unconfigured_does_not_touch_the_database(self, monkeypatch):
        for k in ("LINE_CHANNEL_ACCESS_TOKEN", "LINE_TO", "LINE_BROADCAST"):
            monkeypatch.delenv(k, raising=False)
        monkeypatch.setattr(db, "last_notified_at", lambda: (_ for _ in ()).throw(AssertionError("must not query")))
        assert notify.run_notifications(now=NOW) is False
