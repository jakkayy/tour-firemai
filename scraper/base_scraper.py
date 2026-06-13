from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date
from typing import Optional


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


class BaseScraper(ABC):
    def __init__(self, source_id: int):
        self.source_id = source_id

    @abstractmethod
    async def scrape(self) -> list[TourItem]:
        pass

    def _calc_discount(self, original: float, discounted: float) -> float:
        if original <= 0:
            return 0.0
        return round((1 - discounted / original) * 100, 2)
