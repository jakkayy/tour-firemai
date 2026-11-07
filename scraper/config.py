import os
from urllib.parse import urlsplit

DEFAULT_SITE_URL = "https://tour-firemai.vercel.app"


def resolve_site_url(raw: str | None) -> str:
    """The public address of the website, as scheme://host[:port] with no path, query or login.

    Set SITE_URL (a GitHub variable) when the site moves to its own domain. Empty or
    invalid values fall back to the default; GitHub passes unset variables as "".
    """
    value = (raw or "").strip()
    if not value:
        return DEFAULT_SITE_URL
    try:
        parts = urlsplit(value if "://" in value else f"https://{value}")
        host = parts.hostname or ""
        port = f":{parts.port}" if parts.port else ""
    except ValueError:  # e.g. a port that is not a number
        return DEFAULT_SITE_URL
    if parts.scheme in ("http", "https") and ("." in host or host == "localhost"):
        return f"{parts.scheme}://{host}{port}"
    return DEFAULT_SITE_URL


SITE_URL = resolve_site_url(os.environ.get("SITE_URL"))
