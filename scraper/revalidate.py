import os
import sys
from urllib.parse import urlsplit

import httpx

from config import SITE_URL

DEFAULT_URL = f"{SITE_URL}/api/revalidate"


def trigger_revalidation() -> bool:
    """Tell the website its cached pages are out of date, so new tours show right away.

    Needs REVALIDATE_SECRET (the same value as on Vercel); REVALIDATE_URL is optional.
    Skipped when no secret is set, and never raises: a slow or broken website must not
    fail the scrape. Returns True only if the website accepted the request.
    """
    secret = os.environ.get("REVALIDATE_SECRET", "").strip()
    if not secret:
        print("[revalidate] REVALIDATE_SECRET not set, skipping")
        return False
    url = os.environ.get("REVALIDATE_URL", "").strip() or DEFAULT_URL
    try:
        res = httpx.post(url, headers={"Authorization": f"Bearer {secret}"}, timeout=30)
        res.raise_for_status()
    except Exception as e:
        print(f"[revalidate] website refresh failed: {e}", file=sys.stderr)
        return False

    # The site rebuilds a page when someone next asks for it. Ask once ourselves so the
    # first real visitor gets the finished page instead of waiting for it to be built.
    parts = urlsplit(url)
    try:
        httpx.get(f"{parts.scheme}://{parts.netloc}/", timeout=30)
    except Exception as e:
        print(f"[revalidate] refreshed, but the warm-up request failed: {e}", file=sys.stderr)
    print("[revalidate] website refreshed")
    return True
