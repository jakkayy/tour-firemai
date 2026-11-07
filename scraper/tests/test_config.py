import importlib

import pytest

import config
from config import DEFAULT_SITE_URL, resolve_site_url


@pytest.mark.parametrize("raw", [None, "", "   "])
def test_unset_or_empty_uses_the_default(raw):
    # GitHub passes variables that were never created as empty strings
    assert resolve_site_url(raw) == DEFAULT_SITE_URL


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("https://firemai.example.com", "https://firemai.example.com"),
        ("https://firemai.example.com/", "https://firemai.example.com"),
        ("https://firemai.example.com/tours?x=1#top", "https://firemai.example.com"),
        ("  https://firemai.example.com  ", "https://firemai.example.com"),
        ("firemai.example.com", "https://firemai.example.com"),
        ("HTTPS://Firemai.Example.com", "https://firemai.example.com"),
        ("http://localhost:3000", "http://localhost:3000"),
        ("https://firemai.example.com:8443", "https://firemai.example.com:8443"),
    ],
)
def test_normalises_to_scheme_and_host(raw, expected):
    assert resolve_site_url(raw) == expected


@pytest.mark.parametrize(
    "raw",
    ["ftp://firemai.example.com", "ftp://localhost", "javascript:alert(1)", "https://", "https://nodots", "http://host:notaport", "https://user:pw@evil.example.com@x"],
)
def test_garbage_falls_back_to_the_default(raw):
    assert resolve_site_url(raw) == DEFAULT_SITE_URL


def test_logins_in_the_url_are_dropped():
    # credentials must never end up in links we send to people
    assert resolve_site_url("https://user:secret@firemai.example.com") == "https://firemai.example.com"


def test_environment_variable_is_read_at_import(monkeypatch):
    monkeypatch.setenv("SITE_URL", "https://firemai.example.com")
    try:
        assert importlib.reload(config).SITE_URL == "https://firemai.example.com"
    finally:
        monkeypatch.delenv("SITE_URL")
        importlib.reload(config)
    assert config.SITE_URL == DEFAULT_SITE_URL
