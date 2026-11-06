"""Preview the LINE alert without sending it.

    python preview_flex.py             # print sample JSON to paste into the Flex Message Simulator
    python preview_flex.py --validate  # ask LINE to validate it (needs LINE_CHANNEL_ACCESS_TOKEN)

Simulator: https://developers.line.biz/flex-simulator/ (Create a message -> Showcase
-> "Carousel" -> switch to the JSON editor and paste).
"""
import json
import os
import sys
from datetime import date, timedelta

import httpx
from dotenv import load_dotenv

from base_scraper import TourItem
from notify import LINE_API, build_flex_message

load_dotenv()


def sample_tours() -> list[TourItem]:
    d = date.today()
    return [
        TourItem(
            title="เวียดนามใต้ ฟูก๊วก...เกาะสวนสนุกในฝัน PHU QUOC DREAM ISLAND 3 วัน 2 คืน",
            tour_url="https://example.com/phuquoc", source_id=8,
            original_price=23000, discounted_price=10800, discount_percent=53.04,
            departure_date=d + timedelta(days=20),
            image_url="https://picsum.photos/id/1015/800/600",
        ),
        TourItem(
            title="ทัวร์เกาหลี โซล สกีรีสอร์ท เก็บสตรอว์เบอร์รี่ 5 วัน 3 คืน",
            tour_url="https://example.com/korea", source_id=9,
            original_price=19900, discounted_price=8999, discount_percent=54.8,
            departure_date=d + timedelta(days=35),
            image_url="https://picsum.photos/id/1036/800/600",
        ),
        TourItem(
            title="ทัวร์ญี่ปุ่น (ไม่มีรูป ไม่มีวันเดินทาง ไม่มีราคาปกติ)",
            tour_url="https://example.com/japan", source_id=5,
            discounted_price=25900,
        ),
    ]


def main() -> int:
    message = build_flex_message(sample_tours(), total=14)
    print(json.dumps(message, ensure_ascii=False, indent=2))
    if "--validate" not in sys.argv:
        return 0

    token = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN", "").strip()
    if not token:
        print("\nSet LINE_CHANNEL_ACCESS_TOKEN to validate.", file=sys.stderr)
        return 1
    res = httpx.post(
        f"{LINE_API}/validate/broadcast",
        headers={"Authorization": f"Bearer {token}"},
        json={"messages": [message]},
        timeout=15,
    )
    if res.status_code == 200:
        print("\nLINE accepted the message format.", file=sys.stderr)
        return 0
    print(f"\nLINE rejected it: {res.status_code} {res.text}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
