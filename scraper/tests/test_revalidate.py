import httpx

import revalidate


def _capture(monkeypatch, post_status=200, fail_get=False):
    calls = {"post": [], "get": []}

    def fake_post(url, headers, timeout):
        calls["post"].append((url, headers))
        return httpx.Response(post_status, request=httpx.Request("POST", url))

    def fake_get(url, timeout):
        calls["get"].append(url)
        if fail_get:
            raise httpx.ConnectError("down")
        return httpx.Response(200, request=httpx.Request("GET", url))

    monkeypatch.setattr(httpx, "post", fake_post)
    monkeypatch.setattr(httpx, "get", fake_get)
    return calls


def test_skipped_without_a_secret(monkeypatch):
    monkeypatch.delenv("REVALIDATE_SECRET", raising=False)
    monkeypatch.setattr(httpx, "post", lambda *a, **k: (_ for _ in ()).throw(AssertionError("must not call")))
    assert revalidate.trigger_revalidation() is False


def test_empty_secret_counts_as_unset(monkeypatch):
    # GitHub passes secrets that were never created as empty strings
    monkeypatch.setenv("REVALIDATE_SECRET", "")
    monkeypatch.setattr(httpx, "post", lambda *a, **k: (_ for _ in ()).throw(AssertionError("must not call")))
    assert revalidate.trigger_revalidation() is False


def test_posts_with_the_bearer_token_to_the_default_url(monkeypatch):
    monkeypatch.setenv("REVALIDATE_SECRET", "s3cret")
    monkeypatch.delenv("REVALIDATE_URL", raising=False)
    calls = _capture(monkeypatch)

    assert revalidate.trigger_revalidation() is True
    (url, headers), = calls["post"]
    assert url == "https://tour-firemai.vercel.app/api/revalidate"
    assert headers == {"Authorization": "Bearer s3cret"}


def test_warms_up_the_home_page_after_refreshing(monkeypatch):
    monkeypatch.setenv("REVALIDATE_SECRET", "s3cret")
    monkeypatch.setenv("REVALIDATE_URL", "https://example.test/api/revalidate")
    calls = _capture(monkeypatch)

    assert revalidate.trigger_revalidation() is True
    assert calls["post"][0][0] == "https://example.test/api/revalidate"
    assert calls["get"] == ["https://example.test/"]


def test_rejected_secret_does_not_raise_and_skips_the_warm_up(monkeypatch):
    monkeypatch.setenv("REVALIDATE_SECRET", "wrong")
    calls = _capture(monkeypatch, post_status=401)
    assert revalidate.trigger_revalidation() is False
    assert calls["get"] == []


def test_unreachable_website_does_not_raise(monkeypatch):
    monkeypatch.setenv("REVALIDATE_SECRET", "s3cret")
    monkeypatch.setattr(httpx, "post", lambda *a, **k: (_ for _ in ()).throw(httpx.ConnectError("down")))
    assert revalidate.trigger_revalidation() is False


def test_failed_warm_up_still_counts_as_refreshed(monkeypatch):
    monkeypatch.setenv("REVALIDATE_SECRET", "s3cret")
    _capture(monkeypatch, fail_get=True)
    assert revalidate.trigger_revalidation() is True
