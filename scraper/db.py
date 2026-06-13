import os
from supabase import create_client, Client
from dotenv import load_dotenv
from base_scraper import TourItem

load_dotenv()

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        _client = create_client(url, key)
    return _client


def upsert_tours(tours: list[TourItem]) -> int:
    if not tours:
        return 0
    client = get_client()
    rows = [
        {
            "source_id": t.source_id,
            "title": t.title,
            "tour_url": t.tour_url,
            "destination": t.destination,
            "original_price": t.original_price,
            "discounted_price": t.discounted_price,
            "discount_percent": t.discount_percent,
            "departure_date": t.departure_date.isoformat() if t.departure_date else None,
            "seats_left": t.seats_left,
            "image_url": t.image_url,
            "is_active": True,
        }
        for t in tours
    ]
    # Upsert โดยใช้ tour_url เป็น unique key
    client.table("tours").upsert(rows, on_conflict="tour_url").execute()
    return len(rows)


def deactivate_missing(source_id: int, active_urls: list[str]) -> None:
    """Mark tours that disappeared from the page as inactive."""
    if not active_urls:
        return
    client = get_client()
    client.table("tours").update({"is_active": False}).eq(
        "source_id", source_id
    ).not_.in_("tour_url", active_urls).execute()
