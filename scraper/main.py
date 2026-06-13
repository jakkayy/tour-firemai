import asyncio
import sys
from db import upsert_tours, deactivate_missing
from scrapers.travelzeed import TravelzeedScraper
from scrapers.nidnoitravel import NidnoiTravelScraper
from scrapers.unithaitravel import UniThaiTravelScraper
from scrapers.mushroomtravel import MushroomTravelScraper
from scrapers.thaifly import ThaiFlyScraper

# source_id ตรงกับ seed ใน 001_initial_schema.sql (ลำดับ insert)
SCRAPERS = [
    NidnoiTravelScraper(source_id=3),
    TravelzeedScraper(source_id=4),
    UniThaiTravelScraper(source_id=5),
    MushroomTravelScraper(source_id=6),
    ThaiFlyScraper(source_id=7),
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
