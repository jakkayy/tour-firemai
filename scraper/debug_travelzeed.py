import asyncio
from playwright.async_api import async_playwright


async def debug():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page = await browser.new_page()

        # จับ network requests เพื่อดูว่ามี API call ราคา
        api_calls = []
        page.on("request", lambda r: api_calls.append(r.url) if "price" in r.url.lower() or "tour" in r.url.lower() else None)

        await page.goto("https://www.travelzeed.com/fire", wait_until="networkidle", timeout=60000)

        # Scroll ช้าๆ
        scroll_height = await page.evaluate("document.body.scrollHeight")
        step = 400
        pos = 0
        while pos < scroll_height:
            pos += step
            await page.evaluate(f"window.scrollTo(0, {pos})")
            await page.wait_for_timeout(400)
            scroll_height = await page.evaluate("document.body.scrollHeight")
        await page.wait_for_timeout(3000)

        # ดู raw data ของ card แรก
        result = await page.evaluate("""() => {
            const card = document.querySelector('.tour-card')
            if (!card) return 'NO CARD'
            const oldEl = card.querySelector('.oldPrice')
            const discEl = card.querySelector('.defaultPrice')
            const monthEl = card.querySelector('.period_month_font')
            const dayEl = card.querySelector('.period_day_font')
            return {
                oldPrice_text: oldEl ? oldEl.innerText : 'NO_EL',
                oldPrice_html: oldEl ? oldEl.innerHTML : 'NO_EL',
                discPrice_text: discEl ? discEl.innerText : 'NO_EL',
                discPrice_html: discEl ? discEl.innerHTML : 'NO_EL',
                month_text: monthEl ? monthEl.innerText : 'NO_EL',
                day_text: dayEl ? dayEl.innerText : 'NO_EL',
                card_html_end: card.innerHTML.slice(-500),
            }
        }""")
        print("Card data:", result)
        print("\nAPI calls with tour/price:", api_calls[:10])

        await browser.close()


asyncio.run(debug())
