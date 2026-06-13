import re
from datetime import date
from playwright.async_api import async_playwright
from base_scraper import BaseScraper, TourItem

BASE_URL = "https://www.nidnoitravel.com"
LIST_URL = f"{BASE_URL}/promotion-hot/"

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
    match = re.search(r"(\d{1,2})\s+(\S+)\s+(\d{2,4})", text)
    if not match:
        return None
    month = THAI_MONTHS_FULL.get(match.group(2))
    if not month:
        return None
    year = int(match.group(3))
    if year < 100:
        year = year + 2500 - 543
    try:
        return date(year, month, int(match.group(1)))
    except ValueError:
        return None


class NidnoiTravelScraper(BaseScraper):
    async def scrape(self) -> list[TourItem]:
        tours: list[TourItem] = []

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(LIST_URL, wait_until="networkidle", timeout=60000)

            links = await page.query_selector_all("a[href]")
            seen: set[str] = set()

            for link_el in links:
                href = await link_el.get_attribute("href")
                if not href or not re.search(r"/tour|/package|/trip", href):
                    continue
                tour_url = href if href.startswith("http") else BASE_URL + href
                if tour_url in seen:
                    continue
                seen.add(tour_url)

                container = await link_el.evaluate_handle(
                    "el => el.closest('article') || el.closest('li') || el.closest('div.tour') || el.parentElement"
                )

                title_el = await container.query_selector("h2, h3, h4")
                title = (await title_el.inner_text()).strip() if title_el else ""
                if not title:
                    title = (await link_el.inner_text()).strip()
                if not title or len(title) < 5:
                    continue

                text = await container.inner_text()

                orig_el = await container.query_selector("del, s, .price-old")
                original_price = _parse_price(await orig_el.inner_text()) if orig_el else None

                price_match = re.search(r"(?:ราคา|เริ่ม|เพียง)\s*฿?\s*([\d,]+)", text)
                discounted_price = _parse_price(price_match.group(1)) if price_match else None

                if original_price and discounted_price:
                    discount_percent = self._calc_discount(original_price, discounted_price)
                else:
                    discount_percent = None

                departure_date = _parse_thai_date(text)

                img_el = await container.query_selector("img")
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
