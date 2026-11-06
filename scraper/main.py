import asyncio
import sys
from base_scraper import TourItem, drop_departed
from db import get_existing_urls, upsert_tours, deactivate_missing, delete_stale_tours
from notify import notify_new_tours
from scrapers.travelzeed import TravelzeedScraper
from scrapers.thaifly import ThaiFlyScraper
from scrapers.mushroom import MushroomScraper
from scrapers.unithai import UniThaiScraper
from scrapers.qualityexpress import QualityExpressScraper
from scrapers.navarich import NavarichScraper

# source_id ตรงกับ seed ใน 001_initial_schema.sql (ลำดับ insert)
# nidnoitravel (3): listing page ไม่มี title ต้องแก้เพิ่ม
SCRAPERS = [
    TravelzeedScraper(source_id=4),
    UniThaiScraper(source_id=5),
    MushroomScraper(source_id=6),
    ThaiFlyScraper(source_id=7),
    QualityExpressScraper(source_id=8),
    NavarichScraper(source_id=9),
]


async def run_scraper(scraper, new_found: list[TourItem], retries: int = 2) -> bool:
    name = type(scraper).__name__
    print(f"[{name}] scraping...")
    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            scraped = await scraper.scrape()
            tours = drop_departed(scraped)
            skipped = len(scraped) - len(tours)
            if skipped:
                print(f"[{name}] skipped {skipped} tours already departed")
            existing = get_existing_urls(scraper.source_id)
            # An empty source is its first run: everything would be "new", which is just noise.
            fresh = [t for t in tours if t.tour_url not in existing] if existing else []
            count = upsert_tours(tours)
            deactivate_missing(scraper.source_id, [t.tour_url for t in tours])
            new_found.extend(fresh)
            print(f"[{name}] upserted {count} tours ({len(fresh)} new)")
            return True
        except Exception as e:
            last_error = e
            if attempt < retries:
                delay = 30 * (attempt + 1)
                print(f"[{name}] attempt {attempt + 1} failed ({e}), retrying in {delay}s...", file=sys.stderr)
                await asyncio.sleep(delay)
    print(f"[{name}] ERROR after {retries + 1} attempts: {last_error}", file=sys.stderr)
    return False


async def main():
    new_found: list[TourItem] = []
    results = await asyncio.gather(*[run_scraper(s, new_found) for s in SCRAPERS])
    deleted = delete_stale_tours(days=3)
    print(f"[cleanup] deleted {deleted} stale tours")
    notify_new_tours(new_found)
    if not all(results):
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
