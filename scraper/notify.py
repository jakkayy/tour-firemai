import os
import sys

import httpx

from base_scraper import TourItem

LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push"
SITE_URL = "https://tour-firemai.vercel.app"
MAX_LISTED = 10
# LINE rejects a text message over 5000 characters.
MAX_TEXT = 5000


def format_message(new_tours: list[TourItem], max_listed: int = MAX_LISTED) -> str:
    """Summarise newly found tours, biggest discounts first."""
    ranked = sorted(new_tours, key=lambda t: t.discount_percent or 0, reverse=True)
    lines = [f"🔥 ทัวร์ไฟไหม้ใหม่ {len(new_tours)} รายการ"]
    for t in ranked[:max_listed]:
        parts = []
        if t.discount_percent:
            parts.append(f"ลด {round(t.discount_percent)}%")
        if t.discounted_price:
            parts.append(f"฿{t.discounted_price:,.0f}")
        if t.departure_date:
            parts.append(f"เดินทาง {t.departure_date.strftime('%d/%m/%Y')}")
        lines.append("")
        lines.append(t.title)
        if parts:
            lines.append(" · ".join(parts))
        lines.append(t.tour_url)
    if len(new_tours) > max_listed:
        lines.append("")
        lines.append(f"และอีก {len(new_tours) - max_listed} รายการ")
    lines.append("")
    lines.append(f"ดูทั้งหมด: {SITE_URL}/tours")
    return "\n".join(lines)[:MAX_TEXT]


def notify_new_tours(new_tours: list[TourItem]) -> bool:
    """Push a LINE message about new tours. Never raises: a failed notification
    must not fail the scrape. Returns True only if a message was sent."""
    token = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN", "").strip()
    to = os.environ.get("LINE_TO", "").strip()
    if not new_tours:
        return False
    if not token or not to:
        print("[notify] LINE_CHANNEL_ACCESS_TOKEN / LINE_TO not set, skipping")
        return False
    try:
        res = httpx.post(
            LINE_PUSH_URL,
            headers={"Authorization": f"Bearer {token}"},
            json={"to": to, "messages": [{"type": "text", "text": format_message(new_tours)}]},
            timeout=15,
        )
        res.raise_for_status()
    except Exception as e:
        print(f"[notify] LINE push failed: {e}", file=sys.stderr)
        return False
    print(f"[notify] sent {len(new_tours)} new tours to LINE")
    return True
