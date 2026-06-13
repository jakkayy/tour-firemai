import re
from datetime import date
from playwright.async_api import async_playwright
from base_scraper import BaseScraper, TourItem

BASE_URL = "https://thaifly.com"
LIST_URL = f"{BASE_URL}/service/hot-deal"

THAI_MONTHS = {
    "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4,
    "พ.ค.": 5, "มิ.ย.": 6, "ก.ค.": 7, "ส.ค.": 8,
    "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12,
}


def _parse_price(text: str) -> float | None:
    cleaned = re.sub(r"[^\d.]", "", text.replace(",", ""))
    try:
        return float(cleaned) if cleaned else None
    except ValueError:
        return None


def _parse_thai_date(text: str) -> date | None:
    # "15 มิ.ย. 68" or "15 มิ.ย. 2025"
    match = re.search(r"(\d{1,2})\s+(\S+\.)\s+(\d{2,4})", text)
    if not match:
        return None
    month = THAI_MONTHS.get(match.group(2))
    if not month:
        return None
    year = int(match.group(3))
    if year < 100:
        year = year + 2500 - 543
    try:
        return date(year, month, int(match.group(1)))
    except ValueError:
        return None


class ThaiFlyScraper(BaseScraper):
    async def scrape(self) -> list[TourItem]:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(LIST_URL, wait_until="networkidle", timeout=60000)
            await page.wait_for_timeout(3000)

            raw = await page.evaluate("""() => {
                const results = []
                document.querySelectorAll('.card').forEach(card => {
                    const linkEl = card.querySelector('a[href*="tour/THFY"]')
                    if (!linkEl) return
                    const titleEl = card.querySelector('h3')
                    const imgEl = card.querySelector('img.img-fluid')
                    const tds = card.querySelectorAll('.travel-dates-collapse td')
                    const dateText = tds[0] ? tds[0].textContent.trim() : ''
                    const origEl = tds[1] ? tds[1].querySelector('.price-old') : null
                    const newEl  = tds[1] ? tds[1].querySelector('.price-new')  : null

                    results.push({
                        href: linkEl.getAttribute('href'),
                        title: titleEl ? titleEl.textContent.trim() : '',
                        image: imgEl ? imgEl.getAttribute('src') : null,
                        dateText,
                        origPrice: origEl ? origEl.textContent.trim() : '',
                        newPrice:  newEl  ? newEl.textContent.trim()  : '',
                    })
                })
                return results
            }""")

            await browser.close()

        tours: list[TourItem] = []
        seen: set[str] = set()

        for c in raw:
            if not c.get("href") or not c.get("title"):
                continue
            href = c["href"]
            if href.startswith("/"):
                tour_url = BASE_URL + href
            elif href.startswith("http"):
                tour_url = href
            else:
                tour_url = BASE_URL + "/" + href
            if tour_url in seen:
                continue
            seen.add(tour_url)

            original_price = _parse_price(c.get("origPrice", ""))
            discounted_price = _parse_price(c.get("newPrice", ""))
            discount_percent = (
                self._calc_discount(original_price, discounted_price)
                if original_price and discounted_price
                else None
            )
            departure_date = _parse_thai_date(c["dateText"])

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
