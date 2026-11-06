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


def _run(monkeypatch, scraped, existing):
    monkeypatch.setattr(main, "get_existing_urls", lambda source_id: existing)
    upserted = []
    monkeypatch.setattr(main, "upsert_tours", lambda tours: upserted.extend(tours) or len(tours))
    monkeypatch.setattr(main, "deactivate_missing", lambda *a: None)
    new_found: list[TourItem] = []
    ok = asyncio.run(main.run_scraper(FakeScraper(scraped), new_found, retries=0))
    return ok, new_found, upserted


def test_only_unseen_urls_are_new(monkeypatch):
    ok, new_found, upserted = _run(monkeypatch, [_tour("a"), _tour("b")], existing={"a"})
    assert ok
    assert [t.tour_url for t in new_found] == ["b"]
    assert len(upserted) == 2  # known tours are still upserted to refresh price


def test_first_run_for_a_source_reports_nothing_new(monkeypatch):
    ok, new_found, upserted = _run(monkeypatch, [_tour("a"), _tour("b")], existing=set())
    assert ok and new_found == [] and len(upserted) == 2


def test_departed_tours_are_neither_stored_nor_new(monkeypatch):
    past = _tour("old", dep=date(2020, 1, 1))
    ok, new_found, upserted = _run(monkeypatch, [past, _tour("a")], existing={"x"})
    assert ok
    assert [t.tour_url for t in upserted] == ["a"]
    assert [t.tour_url for t in new_found] == ["a"]
