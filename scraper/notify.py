import os
import sys
from datetime import datetime, timezone
from typing import Optional

import httpx

from base_scraper import TourItem

LINE_API = "https://api.line.me/v2/bot/message"
SITE_URL = "https://tour-firemai.vercel.app"

# A carousel holds at most 12 bubbles: up to 11 tours plus the closing "see all" card.
MAX_TOURS = 11
# Hours that must pass after one alert before the next. Broadcasts are billed per
# follower, so this keeps the monthly quota from draining at one alert per scrape.
DEFAULT_MIN_INTERVAL_HOURS = 20

# Same palette as the website (teal-500, red-500, slate-800, zinc).
BRAND = "#14b8a6"
RED = "#ef4444"
SLATE = "#1e293b"
INK = "#27272a"
MUTED = "#9ca3af"

SOURCE_NAMES = {
    4: "TravelZeed Fire",
    5: "Uni Thai Travel",
    6: "Mushroom Travel",
    7: "Thai Fly",
    8: "Quality Express",
    9: "Navarich Travel",
}

THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]


def _thai_date(d) -> str:
    return f"{d.day} {THAI_MONTHS[d.month - 1]} {(d.year + 543) % 100:02d}"


def _baht(value: float) -> str:
    return f"฿{value:,.0f}"


def _text(text: str, **kw) -> dict:
    return {"type": "text", "text": text, **kw}


def _hero(t: TourItem) -> Optional[dict]:
    # LINE only renders https images.
    if not (t.image_url and t.image_url.startswith("https://")):
        return None
    contents: list[dict] = [
        {"type": "image", "url": t.image_url, "size": "full", "aspectRatio": "4:3", "aspectMode": "cover"}
    ]
    if t.discount_percent and round(t.discount_percent) > 0:
        contents.append(
            {
                "type": "box",
                "layout": "vertical",
                "position": "absolute",
                "offsetTop": "10px",
                "offsetStart": "10px",
                "backgroundColor": RED,
                "cornerRadius": "20px",
                "paddingTop": "4px",
                "paddingBottom": "4px",
                "paddingStart": "10px",
                "paddingEnd": "10px",
                "contents": [_text(f"ลด {round(t.discount_percent)}%", color="#ffffff", size="xs", weight="bold")],
            }
        )
    return {"type": "box", "layout": "vertical", "paddingAll": "0px", "contents": contents}


def _tour_bubble(t: TourItem) -> dict:
    body: list[dict] = [
        _text(SOURCE_NAMES.get(t.source_id, "ทัวร์"), size="xs", color=BRAND, weight="bold"),
        _text(t.title, size="sm", weight="bold", color=INK, wrap=True, maxLines=2),
    ]

    price = t.discounted_price or t.original_price
    if price:
        if t.original_price and t.discounted_price and t.original_price > t.discounted_price:
            body.append(_text(_baht(t.original_price), size="xs", color=MUTED, decoration="line-through", margin="md"))
        body.append(
            {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "contents": [
                    _text(_baht(price), size="xl", weight="bold", color=RED, flex=0),
                    _text("/ ท่าน", size="xs", color=MUTED),
                ],
            }
        )
        if t.original_price and t.discounted_price and t.original_price > t.discounted_price:
            saving = f"ประหยัด {_baht(t.original_price - t.discounted_price)}"
            if t.discount_percent:
                saving += f" · ลด {round(t.discount_percent)}%"
            body.append(_text(saving, size="xs", color=BRAND, weight="bold"))
    else:
        body.append(_text("ติดต่อสอบถามราคา", size="sm", color=MUTED, margin="md"))

    if t.departure_date:
        body.append(_text(f"เดินทาง {_thai_date(t.departure_date)}", size="xs", color="#71717a", margin="md"))

    bubble: dict = {
        "type": "bubble",
        "size": "kilo",
        "body": {"type": "box", "layout": "vertical", "spacing": "xs", "paddingAll": "14px", "contents": body},
        "footer": {
            "type": "box",
            "layout": "vertical",
            "paddingAll": "12px",
            "contents": [
                {
                    "type": "button",
                    "style": "primary",
                    "color": BRAND,
                    "height": "sm",
                    "action": {"type": "uri", "label": "ดูทัวร์", "uri": t.tour_url},
                }
            ],
        },
    }
    hero = _hero(t)
    if hero:
        bubble["hero"] = hero
    return bubble


def _see_all_bubble(remaining: int) -> dict:
    headline = f"และอีก {remaining} รายการ" if remaining > 0 else "ดูดีลทั้งหมด"
    return {
        "type": "bubble",
        "size": "kilo",
        "body": {
            "type": "box",
            "layout": "vertical",
            "justifyContent": "center",
            "alignItems": "center",
            "spacing": "md",
            "paddingAll": "20px",
            "backgroundColor": SLATE,
            "contents": [
                _text("🔥", size="3xl", align="center"),
                _text(headline, size="lg", weight="bold", color="#ffffff", align="center", wrap=True),
                _text("ดูทัวร์ไฟไหม้ทั้งหมดบนเว็บ", size="xs", color="#cbd5e1", align="center"),
            ],
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "paddingAll": "12px",
            "backgroundColor": SLATE,
            "contents": [
                {
                    "type": "button",
                    "style": "primary",
                    "color": BRAND,
                    "height": "sm",
                    "action": {"type": "uri", "label": "ดูทัวร์ทั้งหมด", "uri": f"{SITE_URL}/tours"},
                }
            ],
        },
    }


def build_flex_message(tours: list[TourItem], total: Optional[int] = None) -> dict:
    """One Flex carousel message: best discounts first, then a closing 'see all' card.

    `total` is how many new tours there were in all (>= len(tours)); the difference
    is shown on the last card.
    """
    ranked = sorted(tours, key=lambda t: t.discount_percent or 0, reverse=True)[:MAX_TOURS]
    total = max(total or len(tours), len(ranked))
    best = max((t.discount_percent or 0 for t in ranked), default=0)

    alt = f"🔥 ทัวร์ไฟไหม้ใหม่ {total} รายการ"
    if best:
        alt += f" ลดสูงสุด {round(best)}%"

    return {
        "type": "flex",
        "altText": alt,
        "contents": {
            "type": "carousel",
            "contents": [_tour_bubble(t) for t in ranked] + [_see_all_bubble(total - len(ranked))],
        },
    }


def _credentials() -> tuple[str, str, bool]:
    token = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN", "").strip()
    to = os.environ.get("LINE_TO", "").strip()
    broadcast = os.environ.get("LINE_BROADCAST", "").strip().lower() in {"1", "true", "yes"}
    return token, to, broadcast


def send_message(message: dict) -> bool:
    """Broadcast to every follower (LINE_BROADCAST=true) or push to LINE_TO.
    Never raises: a failed alert must not fail the scrape."""
    token, to, broadcast = _credentials()
    if not token or not (broadcast or to):
        print("[notify] LINE not configured (token and LINE_BROADCAST or LINE_TO), skipping")
        return False
    try:
        if broadcast:
            res = httpx.post(
                f"{LINE_API}/broadcast",
                headers={"Authorization": f"Bearer {token}"},
                json={"messages": [message]},
                timeout=15,
            )
        else:
            res = httpx.post(
                f"{LINE_API}/push",
                headers={"Authorization": f"Bearer {token}"},
                json={"to": to, "messages": [message]},
                timeout=15,
            )
        res.raise_for_status()
    except Exception as e:
        print(f"[notify] LINE send failed: {e}", file=sys.stderr)
        return False
    return True


def _min_interval_hours() -> float:
    try:
        return float(os.environ.get("LINE_MIN_INTERVAL_HOURS", DEFAULT_MIN_INTERVAL_HOURS))
    except ValueError:
        return DEFAULT_MIN_INTERVAL_HOURS


def run_notifications(now: Optional[datetime] = None) -> bool:
    """Announce tours that haven't been announced yet, at most once per interval.

    State lives in tours.notified_at, so a failed send is simply retried next run
    and tours are never announced twice. Returns True only if a message was sent.
    """
    # Imported here so the message builders stay importable without Supabase credentials.
    import db

    token, to, broadcast = _credentials()
    if not token or not (broadcast or to):
        print("[notify] LINE not configured (token and LINE_BROADCAST or LINE_TO), skipping")
        return False
    try:
        now = now or datetime.now(timezone.utc)
        last = db.last_notified_at()
        if last and (now - last).total_seconds() < _min_interval_hours() * 3600:
            print(f"[notify] last alert {last:%Y-%m-%d %H:%M} UTC is within the interval, holding new tours")
            return False

        pending = db.fetch_unnotified()
        if not pending:
            print("[notify] no new tours to announce")
            return False

        message = build_flex_message([t for _, t in pending], total=len(pending))
        if not send_message(message):
            return False
        # Mark everything pending, not only the shown cards: the closing card already
        # told readers about the rest, and re-sending them next time would be noise.
        db.mark_notified([i for i, _ in pending])
        print(f"[notify] announced {len(pending)} new tours on LINE")
        return True
    except Exception as e:
        print(f"[notify] skipped: {e}", file=sys.stderr)
        return False
