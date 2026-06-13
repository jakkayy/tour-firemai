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
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(LIST_URL, wait_until="networkidle", timeout=60000)

            scroll_height = await page.evaluate("document.body.scrollHeight")
            pos, step = 0, 600
            while pos < scroll_height:
                pos += step
                await page.evaluate(f"window.scrollTo(0, {pos})")
                await page.wait_for_timeout(300)
                scroll_height = await page.evaluate("document.body.scrollHeight")
            await page.wait_for_timeout(2000)

            raw = await page.evaluate("""() => {
                const seen = new Set()
                const results = []
                document.querySelectorAll('a[href*="/tour/"]').forEach(linkEl => {
                    const href = linkEl.getAttribute('href')
                    if (!href || seen.has(href)) return
                    seen.add(href)
                    const container = linkEl.closest('article') || linkEl.closest('li') || linkEl.parentElement
                    const titleEl = container ? container.querySelector('h2, h3, h4') : null
                    const imgEl = container ? container.querySelector('img') : null
                    const origEl = container ? container.querySelector('del, s, .price-old') : null
                    const text = container ? container.textContent : ''
                    results.push({
                        href,
                        title: titleEl ? titleEl.textContent.trim() : linkEl.textContent.trim(),
                        image: imgEl ? imgEl.getAttribute('src') : null,
                        origPrice: origEl ? origEl.textContent.trim() : '',
                        text: text.slice(0, 400),
                    })
                })
                return results
            }""")

            await browser.close()

        tours: list[TourItem] = []
        seen: set[str] = set()

        for c in raw:
            if not c.get("href") or not c.get("title") or len(c["title"]) < 5:
                continue
            href = c["href"]
            tour_url = href if href.startswith("http") else BASE_URL + href
            if tour_url in seen:
                continue
            seen.add(tour_url)

            original_price = _parse_price(c["origPrice"])
            price_match = re.search(r"(?:ราคา|เริ่ม|เพียง)\s*฿?\s*([\d,]+)", c["text"])
            discounted_price = _parse_price(price_match.group(1)) if price_match else None
            discount_percent = (
                self._calc_discount(original_price, discounted_price)
                if original_price and discounted_price
                else None
            )
            departure_date = _parse_thai_date(c["text"])

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
