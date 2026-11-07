import asyncio
from datetime import date, timedelta

import main
from base_scraper import TourItem

FUTURE = date.today() + timedelta(days=30)


def _tour(url: str, dep: date | None = FUTURE) -> TourItem:
    return TourItem(title=url, tour_url=url, source_id=7, departure_date=dep)


class FakeScraper:
    source_id = 7

    def __init__(self, tours):
        self._tours = tours

    async def scrape(self):
        return self._tours


def _run(monkeypatch, scraped):
    upserted, deactivated = [], []
    monkeypatch.setattr(main, "upsert_tours", lambda tours: upserted.extend(tours) or len(tours))
    monkeypatch.setattr(main, "deactivate_missing", lambda sid, urls: deactivated.extend(urls))
    ok = asyncio.run(main.run_scraper(FakeScraper(scraped), retries=0))
    return ok, upserted, deactivated


def test_departed_tours_are_neither_stored_nor_kept_active(monkeypatch):
    past = _tour("old", dep=date(2020, 1, 1))
    ok, upserted, deactivated = _run(monkeypatch, [past, _tour("a"), _tour("b", dep=None)])
    assert ok
    assert [t.tour_url for t in upserted] == ["a", "b"]
    # deactivate_missing only learns about the survivors, so "old" gets switched off
    assert deactivated == ["a", "b"]


def test_a_failing_source_reports_failure(monkeypatch):
    def boom(tours):
        raise RuntimeError("db down")

    monkeypatch.setattr(main, "upsert_tours", boom)
    assert asyncio.run(main.run_scraper(FakeScraper([_tour("a")]), retries=0)) is False


def test_titles_are_tidied_and_countries_stored_before_saving(monkeypatch):
    scraped_title = "ทัวร์" + "".join(chr(int(c, 16)) for c in "0E0D 0E35 0E48 0E1B 0E48 0E38 0E19".split()) + " โตเกียว"
    ok, upserted, _ = _run(monkeypatch, [TourItem(title=scraped_title, tour_url="a", source_id=7, departure_date=FUTURE)])
    assert ok
    saved = upserted[0]
    assert "ญี่ปุ่น" in saved.title  # the searchable spelling, not the scraped one
    assert saved.countries == ["ญี่ปุ่น"]


def test_scraper_is_given_the_pictures_already_stored(monkeypatch):
    scraper = FakeScraper([_tour("a")])
    monkeypatch.setattr(main, "get_known_images", lambda source_id: {"a": "https://x.test/a.jpg"})
    monkeypatch.setattr(main, "upsert_tours", lambda tours: len(tours))
    monkeypatch.setattr(main, "deactivate_missing", lambda *a: None)
    assert asyncio.run(main.run_scraper(scraper, retries=0)) is True
    assert scraper.known_images == {"a": "https://x.test/a.jpg"}


def test_a_failed_read_of_stored_pictures_does_not_stop_the_scrape(monkeypatch):
    def boom(source_id):
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(main, "get_known_images", boom)
    monkeypatch.setattr(main, "upsert_tours", lambda tours: len(tours))
    monkeypatch.setattr(main, "deactivate_missing", lambda *a: None)
    assert asyncio.run(main.run_scraper(FakeScraper([_tour("a")]), retries=0)) is True

