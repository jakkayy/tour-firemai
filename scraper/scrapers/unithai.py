import re
from datetime import date, datetime
from playwright.async_api import async_playwright
from base_scraper import BaseScraper, TourItem

BASE_URL = "https://www.unithaitravel.com/th"
LIST_URL = f"{BASE_URL}/trip-tourfiremai.php"

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
    # Two formats:
    #   "28 มิ.ย – 03 ก.ค"  — month after first day
    #   "04 – 07 ก.ค"       — month only after last day, applies to whole range
    days = re.findall(r"\d+", date_text)
    months_found = re.findall(r"[฀-๿]+\.[฀-๿]+\.?", date_text)
    if not days or not months_found:
        return None
    day = int(days[0])
    # First month abbreviation (with or without trailing period)
    abbr = months_found[0]
    month = THAI_MONTHS.get(abbr) or THAI_MONTHS.get(abbr + ".")
    if not month:
        return None
    today = datetime.now()
    year = today.year
    try:
        d = date(year, month, day)
        if d < today.date():
            d = date(year + 1, month, day)
        return d
    except ValueError:
        return None


class UniThaiScraper(BaseScraper):
    async def scrape(self) -> list[TourItem]:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(LIST_URL, wait_until="networkidle", timeout=60000)
            await page.wait_for_timeout(2000)

            raw_cards = await page.evaluate("""() => {
                const results = []
                document.querySelectorAll('div.row.ptll.pbll').forEach(row => {
                    const linkEl = row.querySelector('a[href*="route_id"]')
                    const strikeEl = row.querySelector('s')
                    const redEl = row.querySelector('font[color="red"]')
                    // Departure date is in the 3rd col-sm-* div (index 2)
                    const cols = row.querySelectorAll('[class*="col-sm-2"]')
                    const dateEl = cols.length >= 2 ? cols[1] : null

                    if (!linkEl) return
                    results.push({
                        href: linkEl.getAttribute('href'),
                        title: linkEl.textContent.trim(),
                        origPrice: strikeEl ? strikeEl.textContent.trim() : '',
                        discPrice: redEl ? redEl.textContent.trim() : '',
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
            tour_url = href if href.startswith("http") else f"{BASE_URL}/{href.lstrip('/')}"
            if tour_url in seen:
                continue
            seen.add(tour_url)

            original_price = _parse_price(c["origPrice"]) if c.get("origPrice") else None
            discounted_price = _parse_price(c["discPrice"]) if c.get("discPrice") else None
            # When no discount, both prices are the same — treat as discounted only
            if original_price and discounted_price and original_price == discounted_price:
                original_price = None
            discount_percent = (
                self._calc_discount(original_price, discounted_price)
                if original_price and discounted_price
                else None
            )

            departure_date = (
                _parse_departure(c["dateText"]) if c.get("dateText") else None
            )

            tours.append(
                TourItem(
                    source_id=self.source_id,
                    title=c["title"],
                    tour_url=tour_url,
                    original_price=original_price,
                    discounted_price=discounted_price,
                    discount_percent=discount_percent,
                    departure_date=departure_date,
                )
            )

        return tours
