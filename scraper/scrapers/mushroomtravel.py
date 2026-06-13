import re
from datetime import date
from playwright.async_api import async_playwright
from base_scraper import BaseScraper, TourItem

BASE_URL = "https://www.mushroomtravel.com"
LIST_URL = f"{BASE_URL}/tour/promotion"

THAI_MONTHS_FULL = {
    "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4,
    "พฤษภาคม": 5, "มิถุนายน": 6, "กรกฎาคม": 7, "สิงหาคม": 8,
    "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12,
}


def _parse_price(text: str) -> float | None:
    cleaned = re.sub(r"[^\d]", "", text.replace(",", ""))
    try:
        return float(cleaned) if cleaned else None
    except ValueError:
        return None


def _parse_thai_date(text: str) -> date | None:
    # "15 มิถุนายน 69" or "15 มิถุนายน 2026"
    match = re.search(r"(\d{1,2})\s+(\S+)\s+(\d{2,4})", text)
    if not match:
        return None
    month = THAI_MONTHS_FULL.get(match.group(2))
    if not month:
        return None
    year = int(match.group(3))
    if year < 100:
        year = year + 2500 - 543  # Buddhist Era short form
    try:
        return date(year, month, int(match.group(1)))
    except ValueError:
        return None


class MushroomTravelScraper(BaseScraper):
    async def scrape(self) -> list[TourItem]:
        tours: list[TourItem] = []

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(LIST_URL, wait_until="networkidle", timeout=60000)

            for _ in range(3):
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await page.wait_for_timeout(1500)

            items = await page.query_selector_all("li")
            seen: set[str] = set()

            for item in items:
                link_el = await item.query_selector("a[href*='/tour/']")
                if not link_el:
                    continue

                href = await link_el.get_attribute("href")
                if not href:
                    continue
                tour_url = BASE_URL + href if href.startswith("/") else href
                if tour_url in seen:
                    continue
                seen.add(tour_url)

                title_el = await item.query_selector("h3, h2, h4")
                title = (await title_el.text_content()).strip() if title_el else ""
                if not title:
                    title = (await link_el.text_content()).strip()
                if not title:
                    continue

                text = await item.text_content()

                # Original price: struck-through number
                orig_el = await item.query_selector("del, s, .price-old, .original-price")
                original_price = _parse_price(await orig_el.text_content()) if orig_el else None

                # Discounted price: "เริ่ม X,XXX" or bold price
                disc_match = re.search(r"เริ่ม\s*([\d,]+)", text)
                discounted_price = _parse_price(disc_match.group(1)) if disc_match else None

                if original_price and discounted_price:
                    discount_percent = self._calc_discount(original_price, discounted_price)
                else:
                    discount_percent = None

                departure_date = _parse_thai_date(text)

                img_el = await item.query_selector("img")
                image_url = await img_el.get_attribute("src") if img_el else None
                if image_url and image_url.startswith("/"):
                    image_url = BASE_URL + image_url

                tours.append(
                    TourItem(
                        source_id=self.source_id,
                        title=title,
                        tour_url=tour_url,
                        original_price=original_price,
                        discounted_price=discounted_price,
                        discount_percent=discount_percent,
                        departure_date=departure_date,
                        image_url=image_url,
                    )
                )

            await browser.close()

        return tours
