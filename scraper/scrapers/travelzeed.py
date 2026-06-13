import re
from datetime import date, datetime
from playwright.async_api import async_playwright
from base_scraper import BaseScraper, TourItem

BASE_URL = "https://www.travelzeed.com"
FIRE_URL = f"{BASE_URL}/fire"

# Thai month abbreviations -> month number
THAI_MONTHS = {
    "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4,
    "พ.ค.": 5, "มิ.ย.": 6, "ก.ค.": 7, "ส.ค.": 8,
    "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12,
}


def _parse_price(text: str) -> float | None:
    cleaned = re.sub(r"[^\d.]", "", text.replace(",", ""))
    try:
        return float(cleaned)
    except ValueError:
        return None


def _parse_thai_date(text: str) -> date | None:
    # format: "มิ.ย. 69 15-20" or "มิ.ย. 69 15"
    match = re.search(r"(\S+\.) (\d{2}) (\d{1,2})", text)
    if not match:
        return None
    month_str, year_be, day = match.group(1), match.group(2), match.group(3)
    month = THAI_MONTHS.get(month_str)
    if not month:
        return None
    year_ce = int(year_be) + 2500 - 543  # Buddhist Era -> CE
    try:
        return date(year_ce, month, int(day))
    except ValueError:
        return None


class TravelzeedScraper(BaseScraper):
    async def scrape(self) -> list[TourItem]:
        tours: list[TourItem] = []

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(FIRE_URL, wait_until="networkidle", timeout=60000)

            # Scroll to trigger lazy loading
            for _ in range(5):
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await page.wait_for_timeout(1500)

            # Find all tour card links
            cards = await page.query_selector_all("a[href*='/tour/detail/']")

            seen_urls: set[str] = set()
            for card in cards:
                href = await card.get_attribute("href")
                if not href:
                    continue
                tour_url = BASE_URL + href if href.startswith("/") else href
                if tour_url in seen_urls:
                    continue
                seen_urls.add(tour_url)

                # Navigate up to find the card container
                container = await card.evaluate_handle(
                    "el => el.closest('div') || el.parentElement"
                )

                title_el = await container.query_selector("h3, h2, h4")
                title = (await title_el.inner_text()).strip() if title_el else ""
                if not title:
                    title = (await card.inner_text()).strip()
                if not title:
                    continue

                # Extract prices from all text in container
                container_text = await container.inner_text()

                original_price: float | None = None
                discounted_price: float | None = None

                # "เริ่มต้น X,XXX ฿" pattern = original (before discount)
                orig_match = re.search(r"เริ่มต้น\s*([\d,]+)\s*฿", container_text)
                if orig_match:
                    original_price = _parse_price(orig_match.group(1))

                # Standalone price "X,XXX ฿" that is NOT preceded by เริ่มต้น
                prices = re.findall(r"(?<!เริ่มต้น\s)([\d,]+)\s*฿", container_text)
                if prices:
                    discounted_price = _parse_price(prices[-1])

                if original_price and discounted_price:
                    discount_percent = self._calc_discount(original_price, discounted_price)
                else:
                    discount_percent = None

                # Departure date
                departure_date = _parse_thai_date(container_text)

                # Image
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
