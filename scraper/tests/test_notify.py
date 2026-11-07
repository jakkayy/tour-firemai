import json
from datetime import date, datetime, timedelta, timezone

import httpx

import db
import notify
from base_scraper import TourItem

# 07:30 in Bangkok, inside the default 7-9 send window
NOW = datetime(2026, 11, 6, 0, 30, tzinfo=timezone.utc)


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

    def test_shows_only_five_cards_then_summarises_the_rest(self):
        msg = notify.build_flex_message([_tour(f"t{i}", 30 + i) for i in range(40)], total=40)
        assert len(_bubbles(msg)) == notify.MAX_TOURS + 1 == 6
        assert "และอีก 35 ดีล" in json.dumps(_bubbles(msg)[-1], ensure_ascii=False)
        # the five shown are the five biggest discounts
        shown = json.dumps(_bubbles(msg)[:-1], ensure_ascii=False)
        assert "ลด 69%" in shown and "ลด 30%" not in shown

    def test_alt_text_leads_with_the_best_discount(self):
        msg = notify.build_flex_message([_tour("a", 30), _tour("b", 53.4)], total=2)
        assert msg["altText"] == "🔥 ลดสูงสุด 53% · 2 ดีลใหม่วันนี้"
        assert len(msg["altText"]) <= 400

    def test_alt_text_without_any_discount_figure(self):
        assert notify.build_flex_message([_tour("a")])["altText"] == "🔥 1 ดีลใหม่วันนี้"

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
        self.last, self.pending, self.marked, self.asked_min_discount = last, list(pending), None, None

    def install(self, monkeypatch):
        def fetch(min_discount=0):
            self.asked_min_discount = min_discount
            return [(i, t) for i, t in self.pending if (t.discount_percent or 0) >= min_discount]

        monkeypatch.setattr(db, "last_notified_at", lambda: self.last)
        monkeypatch.setattr(db, "fetch_unnotified", fetch)
        monkeypatch.setattr(db, "mark_notified", lambda ids: setattr(self, "marked", ids))


def _configure(monkeypatch, sent):
    monkeypatch.setenv("LINE_CHANNEL_ACCESS_TOKEN", "tok")
    monkeypatch.setenv("LINE_BROADCAST", "true")
    for k in ("LINE_MIN_INTERVAL_HOURS", "LINE_MIN_DISCOUNT", "LINE_MIN_DEALS", "LINE_SEND_HOURS"):
        monkeypatch.delenv(k, raising=False)
    monkeypatch.setattr(notify, "send_message", lambda m: sent.append(m) or True)


def _deals(n, pct=40):
    return [(i, _tour(f"t{i}", pct)) for i in range(1, n + 1)]


class TestRunNotifications:
    def test_sends_then_marks_every_qualifying_tour(self, monkeypatch):
        sent = []
        _configure(monkeypatch, sent)
        fake = FakeDb(pending=_deals(30))
        fake.install(monkeypatch)

        assert notify.run_notifications(now=NOW) is True
        assert len(sent) == 1
        # 30 qualify but only 5 fit on cards: all 30 are marked, the closing card summarises the rest.
        assert fake.marked == list(range(1, 31))

    def test_only_asks_for_deals_over_the_discount_bar(self, monkeypatch):
        sent = []
        _configure(monkeypatch, sent)
        fake = FakeDb(pending=_deals(3))
        fake.install(monkeypatch)
        notify.run_notifications(now=NOW)
        assert fake.asked_min_discount == notify.DEFAULT_MIN_DISCOUNT == 30

    def test_weak_deals_do_not_count_and_are_never_marked(self, monkeypatch):
        sent = []
        _configure(monkeypatch, sent)
        fake = FakeDb(pending=[(1, _tour("meh", 12)), (2, _tour("ok", 29.9)), (3, _tour("good", 45))])
        fake.install(monkeypatch)

        # only one clears 30%, below the minimum of two deals
        assert notify.run_notifications(now=NOW) is False
        assert sent == [] and fake.marked is None

    def test_needs_at_least_two_deals(self, monkeypatch):
        sent = []
        _configure(monkeypatch, sent)
        FakeDb(pending=_deals(1)).install(monkeypatch)
        assert notify.run_notifications(now=NOW) is False and sent == []

    def test_two_deals_are_enough(self, monkeypatch):
        sent = []
        _configure(monkeypatch, sent)
        FakeDb(pending=_deals(2)).install(monkeypatch)
        assert notify.run_notifications(now=NOW) is True

    def test_thresholds_are_configurable(self, monkeypatch):
        sent = []
        _configure(monkeypatch, sent)
        monkeypatch.setenv("LINE_MIN_DISCOUNT", "20")
        monkeypatch.setenv("LINE_MIN_DEALS", "1")
        fake = FakeDb(pending=[(1, _tour("a", 25))])
        fake.install(monkeypatch)
        assert notify.run_notifications(now=NOW) is True and fake.asked_min_discount == 20

    def test_empty_env_values_fall_back_to_defaults(self, monkeypatch):
        # GitHub passes secrets that were never created as empty strings
        sent = []
        _configure(monkeypatch, sent)
        for k in ("LINE_MIN_INTERVAL_HOURS", "LINE_MIN_DISCOUNT", "LINE_MIN_DEALS", "LINE_SEND_HOURS"):
            monkeypatch.setenv(k, "")
        FakeDb(pending=_deals(3)).install(monkeypatch)
        assert notify.run_notifications(now=NOW) is True

    def test_holds_back_inside_the_interval(self, monkeypatch):
        sent = []
        _configure(monkeypatch, sent)
        fake = FakeDb(last=NOW - timedelta(hours=6), pending=_deals(3))
        fake.install(monkeypatch)

        assert notify.run_notifications(now=NOW) is False
        assert sent == [] and fake.marked is None  # stays unannounced, goes out in a later run

    def test_sends_again_once_the_interval_has_passed(self, monkeypatch):
        sent = []
        _configure(monkeypatch, sent)
        FakeDb(last=NOW - timedelta(hours=21), pending=_deals(3)).install(monkeypatch)
        assert notify.run_notifications(now=NOW) is True

    def test_interval_is_configurable(self, monkeypatch):
        sent = []
        _configure(monkeypatch, sent)
        monkeypatch.setenv("LINE_MIN_INTERVAL_HOURS", "2")
        FakeDb(last=NOW - timedelta(hours=3), pending=_deals(3)).install(monkeypatch)
        assert notify.run_notifications(now=NOW) is True

    def test_nothing_pending_sends_nothing(self, monkeypatch):
        sent = []
        _configure(monkeypatch, sent)
        FakeDb().install(monkeypatch)
        assert notify.run_notifications(now=NOW) is False and sent == []

    def test_failed_send_leaves_tours_unmarked_for_retry(self, monkeypatch):
        _configure(monkeypatch, [])
        monkeypatch.setattr(notify, "send_message", lambda m: False)
        fake = FakeDb(pending=_deals(3))
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


class TestSendWindow:
    def _at(self, hour_bkk):
        # Bangkok is UTC+7
        return datetime(2026, 11, 6, 0, 0, tzinfo=timezone.utc) + timedelta(hours=hour_bkk - 7)

    def test_default_is_the_morning_run(self, monkeypatch):
        monkeypatch.delenv("LINE_SEND_HOURS", raising=False)
        assert [h for h in range(24) if notify._in_send_window(self._at(h))] == [7, 8, 9]

    def test_the_other_cron_runs_are_outside_the_window(self, monkeypatch):
        # cron fires at 07:00, 13:00, 19:00 and 01:00 Bangkok time
        monkeypatch.delenv("LINE_SEND_HOURS", raising=False)
        assert [notify._in_send_window(self._at(h)) for h in (7, 13, 19, 1)] == [True, False, False, False]

    def test_a_delayed_morning_run_still_counts(self, monkeypatch):
        monkeypatch.delenv("LINE_SEND_HOURS", raising=False)
        assert notify._in_send_window(self._at(9)) is True

    def test_custom_range_and_single_hour(self, monkeypatch):
        monkeypatch.setenv("LINE_SEND_HOURS", "18-20")
        assert notify._in_send_window(self._at(19)) and not notify._in_send_window(self._at(7))
        monkeypatch.setenv("LINE_SEND_HOURS", "13")
        assert notify._in_send_window(self._at(13)) and not notify._in_send_window(self._at(14))

    def test_any_disables_the_restriction(self, monkeypatch):
        monkeypatch.setenv("LINE_SEND_HOURS", "any")
        assert all(notify._in_send_window(self._at(h)) for h in range(24))

    def test_garbage_falls_back_to_the_default(self, monkeypatch):
        monkeypatch.setenv("LINE_SEND_HOURS", "morning")
        assert notify._in_send_window(self._at(8)) and not notify._in_send_window(self._at(13))

    def test_a_run_outside_the_window_holds_everything(self, monkeypatch):
        sent = []
        _configure(monkeypatch, sent)
        fake = FakeDb(pending=_deals(5))
        fake.install(monkeypatch)
        assert notify.run_notifications(now=self._at(13)) is False
        assert sent == [] and fake.marked is None


def test_closing_card_links_to_the_configured_site(monkeypatch):
    import importlib

    import config

    monkeypatch.setenv("SITE_URL", "https://firemai.example.com")
    try:
        importlib.reload(config)
        reloaded = importlib.reload(notify)
        uri = reloaded.build_flex_message([_tour("a", 40)])["contents"]["contents"][-1]["footer"]["contents"][0]["action"]["uri"]
        assert uri == "https://firemai.example.com/tours"
    finally:
        monkeypatch.delenv("SITE_URL")
        importlib.reload(config)
        importlib.reload(notify)
