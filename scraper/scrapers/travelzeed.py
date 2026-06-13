import re
from datetime import date
from playwright.async_api import async_playwright
from base_scraper import BaseScraper, TourItem

BASE_URL = "https://www.travelzeed.com"
FIRE_URL = f"{BASE_URL}/fire"

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


def _parse_departure(month_text: str, day_text: str) -> date | None:
    match = re.match(r"(\S+)\s+(\d{2})", month_text.strip())
    if not match:
        return None
    month = THAI_MONTHS.get(match.group(1))
    if not month:
        return None
    year_ce = int(match.group(2)) + 2500 - 543
    day_str = re.split(r"[-–]", day_text.strip())[0]
    try:
        return date(year_ce, month, int(day_str))
    except ValueError:
        return None


class TravelzeedScraper(BaseScraper):
    async def scrape(self) -> list[TourItem]:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(FIRE_URL, wait_until="networkidle", timeout=60000)

            # Scroll ช้าๆ เพื่อให้ lazy-load ทุก card
            scroll_height = await page.evaluate("document.body.scrollHeight")
            step = 600
            pos = 0
            while pos < scroll_height:
                pos += step
                await page.evaluate(f"window.scrollTo(0, {pos})")
                await page.wait_for_timeout(300)
                scroll_height = await page.evaluate("document.body.scrollHeight")

            await page.wait_for_timeout(2000)

            # ดึงข้อมูลทั้งหมดด้วย JS ใน browser (เร็วและแม่นกว่า)
            raw_cards = await page.evaluate("""() => {
                const results = []
                document.querySelectorAll('.tour-card').forEach(card => {
                    const linkEl = card.querySelector('.travel_tour-LoopProduct-link, .tour-title-link')
                    const titleEl = card.querySelector('.tour-title-link')
                    const imgEl = card.querySelector('.tour-image picture img')
                    const oldEl = card.querySelector('.oldPrice')
                    const discEl = card.querySelector('.defaultPrice')
                    const monthEl = card.querySelector('.period_month_font')
                    const dayEl = card.querySelector('.period_day_font')
                    results.push({
                        href: linkEl ? linkEl.getAttribute('href') : null,
                        title: titleEl ? (titleEl.getAttribute('title') || titleEl.textContent.trim()) : '',
                        image: imgEl ? imgEl.getAttribute('src') : null,
                        oldPrice: oldEl ? oldEl.textContent.trim() : '',
                        discPrice: discEl ? discEl.textContent.trim() : '',
                        month: monthEl ? monthEl.textContent.trim() : '',
                        day: dayEl ? dayEl.textContent.trim() : '',
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

            original_price = _parse_price(c["oldPrice"])
            discounted_price = _parse_price(c["discPrice"])
            discount_percent = (
                self._calc_discount(original_price, discounted_price)
                if original_price and discounted_price
                else None
            )

            departure_date = (
                _parse_departure(c["month"], c["day"])
                if c.get("month") and c.get("day")
                else None
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
