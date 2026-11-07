import db


class FakeQuery:
    """Just enough of the supabase query builder for db.py, recording what it was asked."""

    def __init__(self, store, log):
        self.store, self.log = store, log
        self.filters, self.payload, self.rng = {}, None, None

    def select(self, *_):
        return self

    def update(self, payload):
        self.payload = payload
        return self

    def eq(self, col, val):
        self.filters[col] = val
        return self

    def in_(self, col, vals):
        self.filters[col + "__in"] = list(vals)
        return self

    def range(self, start, end):
        self.rng = (start, end)
        return self

    def execute(self):
        if self.payload is not None:
            self.log.append(self.filters)
            targets = set(self.filters["tour_url__in"])
            for row in self.store:
                if row["tour_url"] in targets and row["source_id"] == self.filters["source_id"]:
                    row.update(self.payload)
            return type("R", (), {"data": []})()
        rows = [
            {"tour_url": r["tour_url"]}
            for r in self.store
            if r["source_id"] == self.filters["source_id"]
            and ("is_active" not in self.filters or r["is_active"] == self.filters["is_active"])
        ]
        start, end = self.rng
        return type("R", (), {"data": rows[start : end + 1]})()


class FakeClient:
    def __init__(self, store):
        self.store, self.updates = store, []

    def table(self, _):
        return FakeQuery(self.store, self.updates)


def _store(n: int, source_id: int = 4):
    return [{"tour_url": f"https://x.test/{i:04d}", "source_id": source_id, "is_active": True} for i in range(n)]


def test_deactivates_only_missing_urls_of_that_source(monkeypatch):
    store = _store(10) + _store(3, source_id=9)
    client = FakeClient(store)
    monkeypatch.setattr(db, "get_client", lambda: client)

    db.deactivate_missing(4, [r["tour_url"] for r in store[:7]])

    inactive = [r["tour_url"] for r in store if not r["is_active"]]
    assert inactive == ["https://x.test/0007", "https://x.test/0008", "https://x.test/0009"]
    assert all(r["is_active"] for r in store if r["source_id"] == 9)


def test_large_batches_stay_small_enough_for_the_url_limit(monkeypatch):
    store = _store(600)
    client = FakeClient(store)
    monkeypatch.setattr(db, "get_client", lambda: client)

    # Scraper now sees only 1 tour: 599 must be deactivated, never in one giant request.
    db.deactivate_missing(4, [store[0]["tour_url"]])

    assert sum(not r["is_active"] for r in store) == 599
    assert len(client.updates) == -(-599 // db.DEACTIVATE_BATCH)
    assert all(len(u["tour_url__in"]) <= db.DEACTIVATE_BATCH for u in client.updates)


def test_nothing_scraped_deactivates_nothing(monkeypatch):
    store = _store(5)
    client = FakeClient(store)
    monkeypatch.setattr(db, "get_client", lambda: client)
    db.deactivate_missing(4, [])
    assert all(r["is_active"] for r in store) and client.updates == []


def test_reads_all_pages_of_existing_urls(monkeypatch):
    monkeypatch.setattr(db, "get_client", lambda: FakeClient(_store(2500)))
    assert len(db.get_existing_urls(4)) == 2500


class UpsertClient:
    def __init__(self):
        self.rows, self.conflict = None, None

    def table(self, _):
        return self

    def upsert(self, rows, on_conflict):
        self.rows, self.conflict = rows, on_conflict
        return self

    def execute(self):
        return type("R", (), {"data": []})()


def test_upsert_saves_the_countries_of_each_tour(monkeypatch):
    from base_scraper import TourItem

    client = UpsertClient()
    monkeypatch.setattr(db, "get_client", lambda: client)
    tours = [
        TourItem(title="ทัวร์สวิตเซอร์แลนด์ – ฝรั่งเศส", tour_url="https://x.test/1", source_id=7, countries=["สวิตเซอร์แลนด์", "ฝรั่งเศส", "ยุโรป"]),
        TourItem(title="no place named", tour_url="https://x.test/2", source_id=7),
    ]
    assert db.upsert_tours(tours) == 2
    assert client.conflict == "tour_url"
    assert [r["countries"] for r in client.rows] == [["สวิตเซอร์แลนด์", "ฝรั่งเศส", "ยุโรป"], []]


class KnownImagesClient:
    """Enough of the query builder for get_known_images: pages of rows that have an image."""

    def __init__(self, rows):
        self.rows, self.start, self.end, self.filters = rows, 0, 0, {}

    def table(self, _):
        return self

    def select(self, *_):
        return self

    def eq(self, col, val):
        self.filters[col] = val
        return self

    @property
    def not_(self):
        return self

    def is_(self, col, val):
        self.filters[f"not {col} is"] = val
        return self

    def range(self, start, end):
        self.start, self.end = start, end
        return self

    def execute(self):
        mine = [r for r in self.rows if r["source_id"] == self.filters["source_id"] and r["image_url"]]
        return type("R", (), {"data": [{"tour_url": r["tour_url"], "image_url": r["image_url"]} for r in mine[self.start : self.end + 1]]})()


def test_known_images_maps_every_stored_tour_with_a_picture(monkeypatch):
    rows = [{"source_id": 5, "tour_url": f"u{i}", "image_url": f"i{i}" if i % 3 else None} for i in range(2500)]
    rows += [{"source_id": 9, "tour_url": "other", "image_url": "other.jpg"}]
    monkeypatch.setattr(db, "get_client", lambda: KnownImagesClient(rows))
    images = db.get_known_images(5)
    assert len(images) == sum(1 for r in rows[:2500] if r["image_url"])  # all pages read, none without a picture
    assert images["u1"] == "i1" and "u0" not in images and "other" not in images

