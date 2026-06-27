import re
from datetime import date
from playwright.async_api import async_playwright
from base_scraper import BaseScraper, TourItem

BASE_URL = "https://www.navarichtravel.com"
LIST_URL = f"{BASE_URL}/faimai"

THAI_MONTHS = {
    "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4,
    "พ.ค.": 5, "มิ.ย.": 6, "ก.ค.": 7, "ส.ค.": 8,
    "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12,
}


def _parse_price(text: str) -> float | None:
    digits = re.sub(r"[^\d]", "", text)
    try:
        return float(digits) if digits else None
    except ValueError:
        return None


def _parse_departure(text: str) -> date | None:
    # "27 มิ.ย. 69 - 03 ก.ค. 69" — take first date
    m = re.search(r"(\d+)\s+([ก-ฮ.]+)\s+(\d{2})", text)
    if not m:
        return None
    day, month_abbr, year_be_short = m.group(1), m.group(2), m.group(3)
    month = THAI_MONTHS.get(month_abbr) or THAI_MONTHS.get(month_abbr + ".")
    if not month:
        return None
    year_ce = (int(year_be_short) + 2500) - 543
    try:
        return date(year_ce, month, int(day))
    except ValueError:
        return None


class NavarichScraper(BaseScraper):
    async def scrape(self) -> list[TourItem]:
        tours: list[TourItem] = []
        seen: set[str] = set()

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            page = await browser.new_page()

            # Detect total pages from first page
            await page.goto(LIST_URL, wait_until="domcontentloaded", timeout=30000)
            total_pages = await page.evaluate("""() => {
                const links = [...document.querySelectorAll('a[href*="?page="]')];
                const nums = links.map(a => {
                    const u = new URL(a.href);
                    return parseInt(u.searchParams.get('page') || '1');
                });
                return nums.length > 0 ? Math.max(...nums) : 1;
            }""")

            for page_num in range(1, total_pages + 1):
                if page_num > 1:
                    await page.goto(
                        f"{LIST_URL}?page={page_num}",
                        wait_until="domcontentloaded",
                        timeout=30000,
                    )

                raw_cards = await page.evaluate("""() => {
                    return [...document.querySelectorAll('a[href*="/tour/ap"]')].map(c => {
                        const img = c.querySelector('img.size-img');
                        const origEl = c.querySelector('.txt-price-full-box1');
                        const priceEl = c.querySelector('.txt-price');

                        const origText = origEl ? origEl.innerText.trim() : '';
                        const fullText = priceEl ? priceEl.innerText.trim() : '';
                        const discText = fullText.replace(origText, '').trim();

                        const spans = [...c.querySelectorAll('span')];
                        const dateSpan = spans.find(s => /[ก-ฮ]\\.[ก-ฮ]/.test(s.innerText));

                        return {
                            href: c.href,
                            title: (c.querySelector('h3')?.innerText || '').trim(),
                            image: img ? img.src : '',
                            origPrice: origText,
                            discPrice: discText,
                            dateText: dateSpan ? dateSpan.innerText.trim() : '',
                        };
                    });
                }""")

                for c in raw_cards:
                    href = c.get("href", "").strip()
                    title = c.get("title", "").strip()
                    if not href or not title:
                        continue
                    if href in seen:
                        continue
                    seen.add(href)

                    original_price = _parse_price(c.get("origPrice", ""))
                    discounted_price = _parse_price(c.get("discPrice", ""))
                    if not discounted_price:
                        continue

                    discount_percent = (
                        self._calc_discount(original_price, discounted_price)
                        if original_price and discounted_price
                        else None
                    )

                    tours.append(TourItem(
                        source_id=self.source_id,
                        title=title,
                        tour_url=href,
                        original_price=original_price,
                        discounted_price=discounted_price,
                        discount_percent=discount_percent,
                        departure_date=_parse_departure(c.get("dateText", "")),
                        image_url=c.get("image") or None,
                    ))

            await browser.close()

        return tours
