from datetime import date

import httpx

import notify
from base_scraper import TourItem


def _tour(title: str, pct: float | None = None, price: float | None = None, dep: date | None = None) -> TourItem:
    return TourItem(
        title=title, tour_url=f"https://example.com/{title}", source_id=1,
        discount_percent=pct, discounted_price=price, departure_date=dep,
    )


class TestFormatMessage:
    def test_orders_by_discount_and_shows_details(self):
        msg = notify.format_message([_tour("low", 10), _tour("high", 55, 8900, date(2026, 12, 1))])
        assert msg.index("high") < msg.index("low")
        assert "ลด 55%" in msg and "฿8,900" in msg and "01/12/2026" in msg
        assert msg.startswith("🔥 ทัวร์ไฟไหม้ใหม่ 2 รายการ")

    def test_handles_missing_fields(self):
        msg = notify.format_message([_tour("bare")])
        assert "bare" in msg and "ลด" not in msg

    def test_truncates_long_lists(self):
        tours = [_tour(f"t{i}", i) for i in range(25)]
        msg = notify.format_message(tours, max_listed=10)
        assert "และอีก 15 รายการ" in msg
        assert "t24" in msg and "t0\n" not in msg

    def test_never_exceeds_line_limit(self):
        tours = [_tour("x" * 600, 50) for _ in range(40)]
        assert len(notify.format_message(tours, max_listed=40)) <= notify.MAX_TEXT


class TestNotifyNewTours:
    def test_skips_without_credentials(self, monkeypatch):
        monkeypatch.delenv("LINE_CHANNEL_ACCESS_TOKEN", raising=False)
        monkeypatch.delenv("LINE_TO", raising=False)
        monkeypatch.setattr(httpx, "post", lambda *a, **k: (_ for _ in ()).throw(AssertionError("must not call")))
        assert notify.notify_new_tours([_tour("a")]) is False

    def test_skips_when_nothing_new(self, monkeypatch):
        monkeypatch.setenv("LINE_CHANNEL_ACCESS_TOKEN", "t")
        monkeypatch.setenv("LINE_TO", "U1")
        monkeypatch.setattr(httpx, "post", lambda *a, **k: (_ for _ in ()).throw(AssertionError("must not call")))
        assert notify.notify_new_tours([]) is False

    def test_sends_push_payload(self, monkeypatch):
        monkeypatch.setenv("LINE_CHANNEL_ACCESS_TOKEN", "tok")
        monkeypatch.setenv("LINE_TO", "U123")
        seen = {}

        def fake_post(url, headers, json, timeout):
            seen.update(url=url, headers=headers, json=json)
            return httpx.Response(200, request=httpx.Request("POST", url))

        monkeypatch.setattr(httpx, "post", fake_post)
        assert notify.notify_new_tours([_tour("a", 30)]) is True
        assert seen["url"] == notify.LINE_PUSH_URL
        assert seen["headers"]["Authorization"] == "Bearer tok"
        assert seen["json"]["to"] == "U123"
        assert seen["json"]["messages"][0]["type"] == "text"

    def test_http_error_does_not_raise(self, monkeypatch):
        monkeypatch.setenv("LINE_CHANNEL_ACCESS_TOKEN", "bad")
        monkeypatch.setenv("LINE_TO", "U1")
        monkeypatch.setattr(
            httpx, "post",
            lambda url, **k: httpx.Response(401, request=httpx.Request("POST", url)),
        )
        assert notify.notify_new_tours([_tour("a")]) is False
