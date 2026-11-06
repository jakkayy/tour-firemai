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
