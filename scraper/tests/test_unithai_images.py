import asyncio

import httpx

from base_scraper import TourItem
from scrapers import unithai as u

OG = '<meta property="og:image" content="https://www.unithaitravel.com/__files/t/ch/1-TAO.jpg?20261029" />'
PAGE = f"<html><head><title>x</title>{OG}</head><body>{'x' * 500}</body></html>"


def _tour(i: int) -> TourItem:
    return TourItem(title=f"t{i}", tour_url=f"https://www.unithaitravel.com/th/trip_detail2.php?route_id={i}", source_id=5)


def _fill(tours, known, handler, **kwargs):
    async def go():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await u._fill_images(tours, known, client=client, pause=0, **kwargs)

    return asyncio.run(go())


class TestParseOgImage:
    def test_reads_the_picture_whichever_way_round_the_attributes_are(self):
        assert u._parse_og_image(OG) == "https://www.unithaitravel.com/__files/t/ch/1-TAO.jpg?20261029"
        flipped = '<meta content="https://www.unithaitravel.com/a.jpg" property="og:image">'
        assert u._parse_og_image(flipped) == "https://www.unithaitravel.com/a.jpg"

    def test_ignores_pictures_that_are_not_the_sites_own_https_images(self):
        assert u._parse_og_image('<meta property="og:image" content="https://elsewhere.example/x.jpg">') is None
        assert u._parse_og_image('<meta property="og:image" content="http://www.unithaitravel.com/x.jpg">') is None
        assert u._parse_og_image('<meta property="og:image" content="https://unithaitravel.com.evil.example/x.jpg">') is None

    def test_page_without_a_picture(self):
        assert u._parse_og_image("<html><head><title>x</title></head></html>") is None


class TestFillImages:
    def test_fetches_each_tours_picture_once(self):
        tours = [_tour(1), _tour(2)]
        calls = []
        n = _fill(tours, {}, lambda r: calls.append(str(r.url)) or httpx.Response(200, text=PAGE))
        assert n == 2 and len(calls) == 2
        assert all(t.image_url and t.image_url.startswith("https://www.unithaitravel.com/") for t in tours)

    def test_reuses_stored_pictures_without_asking_the_site(self):
        tours = [_tour(1)]

        def never(_request):
            raise AssertionError("the site must not be asked for a picture we already have")

        n = _fill(tours, {tours[0].tour_url: "https://www.unithaitravel.com/__files/t/ch/old.jpg"}, never)
        assert n == 0 and tours[0].image_url.endswith("old.jpg")

    def test_stops_at_the_limit_and_leaves_the_rest_for_next_time(self):
        tours = [_tour(i) for i in range(5)]
        calls = []
        n = _fill(tours, {}, lambda r: calls.append(1) or httpx.Response(200, text=PAGE), limit=3)
        assert n == 3 and len(calls) == 3
        assert sum(1 for t in tours if t.image_url) == 3

    def test_one_broken_page_does_not_cost_the_others_their_pictures(self):
        tours = [_tour(1), _tour(2), _tour(3)]

        def handler(request):
            if "route_id=2" in str(request.url):
                return httpx.Response(500)
            if "route_id=3" in str(request.url):
                raise httpx.ConnectError("down")
            return httpx.Response(200, text=PAGE)

        n = _fill(tours, {}, handler)
        assert n == 1
        assert [bool(t.image_url) for t in tours] == [True, False, False]

    def test_a_page_with_no_picture_leaves_the_tour_without_one(self):
        tours = [_tour(1)]
        assert _fill(tours, {}, lambda r: httpx.Response(200, text="<html><head></head></html>")) == 0
        assert tours[0].image_url is None
