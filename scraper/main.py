import asyncio
import sys
from db import upsert_tours, deactivate_missing
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


async def run_scraper(scraper):
    name = type(scraper).__name__
    print(f"[{name}] scraping...")
    try:
        tours = await scraper.scrape()
        count = upsert_tours(tours)
        deactivate_missing(scraper.source_id, [t.tour_url for t in tours])
        print(f"[{name}] upserted {count} tours")
    except Exception as e:
        print(f"[{name}] ERROR: {e}", file=sys.stderr)


async def main():
    await asyncio.gather(*[run_scraper(s) for s in SCRAPERS])


if __name__ == "__main__":
    asyncio.run(main())
