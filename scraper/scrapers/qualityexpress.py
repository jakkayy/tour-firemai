import re
from datetime import date
from playwright.async_api import async_playwright
from base_scraper import BaseScraper, TourItem

BASE_URL = "https://www.qualityexpress.co.th"

# (url, limit) — scrape first N tours per page
SCRAPE_CONFIGS = [
    (f"{BASE_URL}/tour/list/asia?country=asia&view=grid", 30),
    (f"{BASE_URL}/tour/list/europe?country=europe&view=grid", 20),
]

THAI_MONTHS_FULL = {
    "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4,
    "พฤษภาคม": 5, "มิถุนายน": 6, "กรกฎาคม": 7, "สิงหาคม": 8,
    "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12,
}


def _parse_price(text: str) -> float | None:
    digits = re.sub(r"[^\d]", "", text)
    try:
        return float(digits) if digits else None
    except ValueError:
        return None


def _parse_departure(text: str) -> date | None:
    # Format: "สิงหาคม 2569 - กันยายน 2569" → take first month/year
    m = re.search(r"(\S+)\s+(\d{4})", text)
    if not m:
        return None
    month = THAI_MONTHS_FULL.get(m.group(1))
    year_be = int(m.group(2))
    if not month or year_be < 2560:
        return None
    year_ce = year_be - 543
    try:
        return date(year_ce, month, 1)
    except ValueError:
        return None


class QualityExpressScraper(BaseScraper):
    async def scrape(self) -> list[TourItem]:
        tours: list[TourItem] = []
        seen: set[str] = set()

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            page = await browser.new_page()

            for url, limit in SCRAPE_CONFIGS:
                await page.goto(url, wait_until="networkidle", timeout=60000)
                await page.wait_for_selector(".ieh-100", state="attached", timeout=15000)

                raw_cards = await page.evaluate("""() => {
                    return [...document.querySelectorAll('.ieh-100')].map(c => {
                        const link = c.querySelector('a.absolute-link2');
                        const img = c.querySelector('.cover-image');
                        const priceEl = c.querySelector('.price-period');
                        const dateEl = c.querySelector('.panel-group .text-blue');
                        return {
                            href:  link ? link.href : '',
                            title: link ? (link.getAttribute('title') || '').trim() : '',
                            image: img  ? (img.src || img.dataset.src || img.dataset.lazySrc || '') : '',
                            price: priceEl ? priceEl.innerText.trim() : '',
                            dateText: dateEl ? dateEl.innerText.trim() : '',
                        };
                    });
                }""")

                count = 0
                for c in raw_cards:
                    if count >= limit:
                        break
                    href = c.get("href", "").strip()
                    title = c.get("title", "").strip()
                    if not href or not title:
                        continue
                    if href in seen:
                        continue
                    seen.add(href)

                    discounted_price = _parse_price(c.get("price", ""))
                    if not discounted_price:
                        continue

                    image_url = c.get("image") or None
                    departure_date = _parse_departure(c.get("dateText", ""))

                    tours.append(TourItem(
                        source_id=self.source_id,
                        title=title,
                        tour_url=href,
                        discounted_price=discounted_price,
                        original_price=None,
                        discount_percent=None,
                        departure_date=departure_date,
                        image_url=image_url,
                    ))
                    count += 1

            await browser.close()

        return tours
