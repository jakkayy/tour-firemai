import re
from datetime import date, datetime
from playwright.async_api import async_playwright
from base_scraper import BaseScraper, TourItem

BASE_URL = "https://thaifly.com"
LIST_URL = f"{BASE_URL}/service/hot-deal"

EN_MONTHS = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
    "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
}


def _parse_price(text: str) -> float | None:
    cleaned = re.sub(r"[^\d.]", "", text.replace(",", ""))
    try:
        return float(cleaned) if cleaned else None
    except ValueError:
        return None


def _parse_date(text: str) -> date | None:
    # "15 Jun 26 - 20 Jun 26" -> take first date
    match = re.search(r"(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})", text)
    if not match:
        return None
    month = EN_MONTHS.get(match.group(2))
    if not month:
        return None
    year = int(match.group(3))
    if year < 100:
        year += 2000
    try:
        return date(year, month, int(match.group(1)))
    except ValueError:
        return None


class ThaiFlyScraper(BaseScraper):
    async def scrape(self) -> list[TourItem]:
        tours: list[TourItem] = []

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(LIST_URL, wait_until="networkidle", timeout=60000)

            cards = await page.query_selector_all(".product-layout")
            seen: set[str] = set()

            for card in cards:
                link_el = await card.query_selector("a[href*='/tour/']")
                if not link_el:
                    continue

                href = await link_el.get_attribute("href")
                if not href:
                    continue
                tour_url = BASE_URL + href if href.startswith("/") else href
                if tour_url in seen:
                    continue
                seen.add(tour_url)

                title_el = await card.query_selector(".product-name, h3, h2")
                title = (await title_el.inner_text()).strip() if title_el else ""
                if not title:
                    continue

                orig_el = await card.query_selector(".price-old, del, s")
                original_price = _parse_price(await orig_el.inner_text()) if orig_el else None

                disc_el = await card.query_selector(".price:not(.price-old), h2.price")
                discounted_price = _parse_price(await disc_el.inner_text()) if disc_el else None

                if original_price and discounted_price:
                    discount_percent = self._calc_discount(original_price, discounted_price)
                else:
                    discount_percent = None

                text = await card.inner_text()
                departure_date = _parse_date(text)

                img_el = await card.query_selector("img.product-image, img")
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
