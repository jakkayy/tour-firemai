from datetime import date

from base_scraper import TourItem, drop_departed

TODAY = date(2026, 11, 6)


def _tour(url: str, departure: date | None) -> TourItem:
    return TourItem(title=url, tour_url=url, source_id=1, departure_date=departure)


class TestDropDeparted:
    def test_drops_past_departures(self):
        tours = [_tour("past", date(2026, 9, 13)), _tour("yesterday", date(2026, 11, 5))]
        assert drop_departed(tours, today=TODAY) == []

    def test_keeps_today_and_future(self):
        tours = [_tour("today", TODAY), _tour("future", date(2026, 12, 1))]
        assert [t.tour_url for t in drop_departed(tours, today=TODAY)] == ["today", "future"]

    def test_keeps_tours_without_departure_date(self):
        tours = [_tour("unknown", None)]
        assert drop_departed(tours, today=TODAY) == tours

    def test_empty_list(self):
        assert drop_departed([], today=TODAY) == []

    def test_defaults_to_current_bangkok_date(self):
        far_past = _tour("old", date(2000, 1, 1))
        far_future = _tour("new", date(2999, 1, 1))
        assert drop_departed([far_past, far_future]) == [far_future]
