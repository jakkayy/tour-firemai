import re
from datetime import date
from playwright.async_api import async_playwright
from base_scraper import BaseScraper, TourItem

BASE_URL = "https://www.unithaitravel.com"
LIST_URL = f"{BASE_URL}/th/trip2.php"

THAI_MONTHS = {
    "ม.ค": 1, "ก.พ": 2, "มี.ค": 3, "เม.ย": 4,
    "พ.ค": 5, "มิ.ย": 6, "ก.ค": 7, "ส.ค": 8,
    "ก.ย": 9, "ต.ค": 10, "พ.ย": 11, "ธ.ค": 12,
}


def _parse_price(text: str) -> float | None:
    cleaned = re.sub(r"[^\d.]", "", text.replace(",", ""))
    try:
        return float(cleaned) if cleaned else None
    except ValueError:
        return None


def _parse_date(text: str) -> date | None:
    match = re.search(r"(\d{1,2})\s+(\S+\.?)\s+(\d{4})", text)
    if match:
        month = THAI_MONTHS.get(match.group(2).rstrip("."))
        if month:
            try:
                return date(int(match.group(3)), month, int(match.group(1)))
            except ValueError:
                pass
    return None


class UniThaiTravelScraper(BaseScraper):
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
                document.querySelectorAll('a[href*="trip_detail"]').forEach(linkEl => {
                    const href = linkEl.getAttribute('href')
                    if (!href || seen.has(href)) return
                    seen.add(href)
                    const container = linkEl.closest('li') || linkEl.parentElement
                    const imgEl = container ? container.querySelector('img') : null
                    const text = container ? container.textContent : ''
                    let title = linkEl.textContent.trim()
                    title = title.replace(/^[\\w-]+\\s*:\\s*/, '').trim()
                    results.push({
                        href,
                        title,
                        image: imgEl ? imgEl.getAttribute('src') : null,
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

            price_match = re.search(r"เริ่ม\s*฿?([\d,]+)", c["text"])
            discounted_price = _parse_price(price_match.group(1)) if price_match else None
            departure_date = _parse_date(c["text"])

            image_url = c.get("image")
            if image_url and image_url.startswith("/"):
                image_url = BASE_URL + image_url

            tours.append(
                TourItem(
                    source_id=self.source_id,
                    title=c["title"],
                    tour_url=tour_url,
                    discounted_price=discounted_price,
                    departure_date=departure_date,
                    image_url=image_url,
                )
            )

        return tours
