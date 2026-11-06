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
