from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional
from zoneinfo import ZoneInfo

from countries import detect_countries
from thai_text import normalize_thai


@dataclass
class TourItem:
    title: str
    tour_url: str
    source_id: int
    destination: Optional[str] = None
    original_price: Optional[float] = None
    discounted_price: Optional[float] = None
    discount_percent: Optional[float] = None
    departure_date: Optional[date] = None
    seats_left: Optional[int] = None
    image_url: Optional[str] = None
    countries: list[str] = field(default_factory=list)


class BaseScraper(ABC):
    def __init__(self, source_id: int):
        self.source_id = source_id
        # tour_url -> image_url already stored for this source. A scraper whose list page has no
        # pictures uses it to fetch each tour's image only once. Filled in by main before scraping.
        self.known_images: dict[str, str] = {}

    @abstractmethod
    async def scrape(self) -> list[TourItem]:
        pass

    def _calc_discount(self, original: float, discounted: float) -> float:
        if original <= 0:
            return 0.0
        return round((1 - discounted / original) * 100, 2)


def today_bangkok() -> date:
    return datetime.now(ZoneInfo("Asia/Bangkok")).date()


def drop_departed(tours: list[TourItem], today: Optional[date] = None) -> list[TourItem]:
    """Remove tours whose departure date has already passed.

    Tours without a departure date are kept: some sources don't publish one.
    """
    today = today or today_bangkok()
    return [t for t in tours if t.departure_date is None or t.departure_date >= today]


def prepare_tours(tours: list[TourItem]) -> list[TourItem]:
    """Tidy the title (Thai marks in the usual order) and work out the countries, in place.

    Done once here so every source gets it, whatever its scraper does.
    """
    for tour in tours:
        tour.title = normalize_thai(tour.title)
        tour.countries = detect_countries(tour.title)
    return tours

