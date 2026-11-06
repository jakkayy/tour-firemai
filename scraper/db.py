import os
from datetime import date, datetime, timedelta, timezone
from supabase import create_client, Client
from dotenv import load_dotenv
from base_scraper import TourItem, today_bangkok

load_dotenv()

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        _client = create_client(url, key)
    return _client


def get_existing_urls(source_id: int, active_only: bool = False) -> set[str]:
    """tour_urls already stored for a source (active or not, unless active_only)."""
    client = get_client()
    urls: set[str] = set()
    page_size = 1000
    start = 0
    while True:
        query = client.table("tours").select("tour_url").eq("source_id", source_id)
        if active_only:
            query = query.eq("is_active", True)
        rows = query.range(start, start + page_size - 1).execute().data
        urls.update(r["tour_url"] for r in rows)
        if len(rows) < page_size:
            return urls
        start += page_size


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


# PostgREST puts `in` lists in the URL; a few hundred long URLs exceeds what the
# gateway accepts (400 Bad Request), so deactivate in small batches.
DEACTIVATE_BATCH = 50


def deactivate_missing(source_id: int, active_urls: list[str]) -> None:
    """Mark tours that disappeared from the page as inactive."""
    if not active_urls:
        return
    missing = sorted(get_existing_urls(source_id, active_only=True) - set(active_urls))
    client = get_client()
    for i in range(0, len(missing), DEACTIVATE_BATCH):
        batch = missing[i : i + DEACTIVATE_BATCH]
        client.table("tours").update({"is_active": False}).eq(
            "source_id", source_id
        ).in_("tour_url", batch).execute()


def delete_stale_tours(days: int = 3) -> int:
    """Delete inactive tours that have been gone for more than `days` days."""
    client = get_client()
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    result = client.table("tours").delete().eq("is_active", False).lt("updated_at", cutoff).execute()
    return len(result.data) if result.data else 0


def last_notified_at() -> datetime | None:
    """When the most recent LINE alert went out (None if never)."""
    rows = (
        get_client()
        .table("tours")
        .select("notified_at")
        .not_.is_("notified_at", "null")
        .order("notified_at", desc=True)
        .limit(1)
        .execute()
        .data
    )
    return datetime.fromisoformat(rows[0]["notified_at"]) if rows else None


def fetch_unnotified() -> list[tuple[int, TourItem]]:
    """Active, not-yet-departed tours that haven't been announced. Returns (id, tour)."""
    rows = (
        get_client()
        .table("tours")
        .select("*")
        .eq("is_active", True)
        .is_("notified_at", "null")
        .or_(f"departure_date.is.null,departure_date.gte.{today_bangkok().isoformat()}")
        .limit(1000)
        .execute()
        .data
    )
    return [
        (
            r["id"],
            TourItem(
                title=r["title"],
                tour_url=r["tour_url"],
                source_id=r["source_id"],
                destination=r.get("destination"),
                original_price=r.get("original_price"),
                discounted_price=r.get("discounted_price"),
                discount_percent=r.get("discount_percent"),
                departure_date=date.fromisoformat(r["departure_date"]) if r.get("departure_date") else None,
                seats_left=r.get("seats_left"),
                image_url=r.get("image_url"),
            ),
        )
        for r in rows
    ]


def mark_notified(ids: list[int]) -> None:
    now = datetime.now(timezone.utc).isoformat()
    client = get_client()
    for i in range(0, len(ids), 200):
        client.table("tours").update({"notified_at": now}).in_("id", ids[i : i + 200]).execute()
