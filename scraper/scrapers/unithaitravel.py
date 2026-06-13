import re
from datetime import date
from playwright.async_api import async_playwright
from base_scraper import BaseScraper, TourItem

BASE_URL = "https://www.unithaitravel.com"
LIST_URL = f"{BASE_URL}/th/trip2.php"

THAI_MONTHS = {
    "ม.ค": 1, "ก.พ": 2, "มี.ค": 3, "เม.ย": 4,
    "พ.ค": 5, "มิ.ย": 6, "ก.ค": 7, "ส.ค": 8,
    "ก.ย": 9, "ต.ค": 10, "พ.ย": 11, "ธ.ค": 12,
}


def _parse_price(text: str) -> float | None:
    cleaned = re.sub(r"[^\d.]", "", text.replace(",", ""))
    try:
        return float(cleaned) if cleaned else None
    except ValueError:
        return None


def _parse_date(text: str) -> date | None:
    # "มิ.ย - ส.ค 2026" or "15 มิ.ย 2026"
    match = re.search(r"(\d{1,2})\s+(\S+\.?)\s+(\d{4})", text)
    if match:
        month = THAI_MONTHS.get(match.group(2).rstrip("."))
        if month:
            try:
                return date(int(match.group(3)), month, int(match.group(1)))
            except ValueError:
                pass
    return None


class UniThaiTravelScraper(BaseScraper):
    async def scrape(self) -> list[TourItem]:
        tours: list[TourItem] = []

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(LIST_URL, wait_until="networkidle", timeout=60000)

            items = await page.query_selector_all("li")
            seen: set[str] = set()

            for item in items:
                link_el = await item.query_selector("a[href*='trip_detail']")
                if not link_el:
                    continue

                href = await link_el.get_attribute("href")
                if not href:
                    continue
                tour_url = BASE_URL + href if href.startswith("/") else href
                if tour_url in seen:
                    continue
                seen.add(tour_url)

                title = (await link_el.text_content()).strip()
                # Remove code prefix like "THAI-VAN-052 : "
                title = re.sub(r"^[\w-]+\s*:\s*", "", title).strip()
                if not title:
                    continue

                text = await item.text_content()

                price_match = re.search(r"เริ่ม\s*฿?([\d,]+)", text)
                discounted_price = _parse_price(price_match.group(1)) if price_match else None

                departure_date = _parse_date(text)

                img_el = await item.query_selector("img")
                image_url = await img_el.get_attribute("src") if img_el else None
                if image_url and image_url.startswith("/"):
                    image_url = BASE_URL + image_url

                tours.append(
                    TourItem(
                        source_id=self.source_id,
                        title=title,
                        tour_url=tour_url,
                        discounted_price=discounted_price,
                        departure_date=departure_date,
                        image_url=image_url,
                    )
                )

            await browser.close()

        return tours
