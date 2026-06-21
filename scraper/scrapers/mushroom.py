import re
from datetime import date
from playwright.async_api import async_playwright
from base_scraper import BaseScraper, TourItem

BASE_URL = "https://www.mushroomtravel.com"
PROMO_URL = f"{BASE_URL}/tour/promotion"

THAI_MONTHS = {
    "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4,
    "พ.ค.": 5, "มิ.ย.": 6, "ก.ค.": 7, "ส.ค.": 8,
    "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12,
}


def _parse_price(text: str) -> float | None:
    cleaned = re.sub(r"[^\d]", "", text.replace(",", ""))
    try:
        return float(cleaned) if cleaned else None
    except ValueError:
        return None


def _parse_departure(date_text: str) -> date | None:
    # Format: "3 ก.ค. 69 - 24 ต.ค. 69" — take the first date
    match = re.match(r"(\d+)\s+(\S+)\s+(\d+)", date_text.strip())
    if not match:
        return None
    day, month_abbr, year_be_short = match.group(1), match.group(2), match.group(3)
    month = THAI_MONTHS.get(month_abbr)
    if not month:
        return None
    year_be = int(year_be_short) + 2500
    year_ce = year_be - 543
    try:
        return date(year_ce, month, int(day))
    except ValueError:
        return None


class MushroomScraper(BaseScraper):
    async def scrape(self) -> list[TourItem]:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(PROMO_URL, wait_until="networkidle", timeout=60000)

            scroll_height = await page.evaluate("document.body.scrollHeight")
            step = 600
            pos = 0
            while pos < scroll_height:
                pos += step
                await page.evaluate(f"window.scrollTo(0, {pos})")
                await page.wait_for_timeout(200)
                scroll_height = await page.evaluate("document.body.scrollHeight")
            await page.wait_for_timeout(2000)

            raw_cards = await page.evaluate("""() => {
                const results = []
                document.querySelectorAll('.hot-promotion-item').forEach(card => {
                    const linkEl = card.querySelector('a[href]')
                    const titleEl = card.querySelector('.section-title a, h3 a')
                    const imgEl = card.querySelector('img')
                    const priceEl = card.querySelector('.price')
                    const priceOrigEl = card.querySelector('.price-original')
                    const dateEl = card.querySelector('.date')
                    results.push({
                        href: linkEl ? linkEl.getAttribute('href') : null,
                        title: titleEl ? (titleEl.getAttribute('title') || titleEl.textContent.trim()) : '',
                        image: imgEl ? imgEl.getAttribute('src') : null,
                        discPrice: priceEl ? priceEl.textContent.trim() : '',
                        origPrice: priceOrigEl ? priceOrigEl.textContent.trim() : '',
                        dateText: dateEl ? dateEl.textContent.trim() : '',
                    })
                })
                return results
            }""")

            await browser.close()

        tours: list[TourItem] = []
        seen: set[str] = set()

        for c in raw_cards:
            if not c.get("href") or not c.get("title"):
                continue
            href = c["href"]
            tour_url = href if href.startswith("http") else BASE_URL + href
            if tour_url in seen:
                continue
            seen.add(tour_url)

            discounted_price = _parse_price(c["discPrice"])
            original_price = _parse_price(c["origPrice"]) if c.get("origPrice") else None
            discount_percent = (
                self._calc_discount(original_price, discounted_price)
                if original_price and discounted_price
                else None
            )

            departure_date = (
                _parse_departure(c["dateText"]) if c.get("dateText") else None
            )

            image_url = c.get("image")
            if image_url and image_url.startswith("/"):
                image_url = BASE_URL + image_url

            tours.append(
                TourItem(
                    source_id=self.source_id,
                    title=c["title"],
                    tour_url=tour_url,
                    original_price=original_price,
                    discounted_price=discounted_price,
                    discount_percent=discount_percent,
                    departure_date=departure_date,
                    image_url=image_url,
                )
            )

        return tours
