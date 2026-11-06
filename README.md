# Tour Firemai

Aggregates last-minute discounted tours from leading Thai travel agencies, updated automatically every 6 hours.

**Tour Firemai** (ทัวร์ไฟไหม้) refers to tours close to their departure date that still have empty seats — travel companies slash prices to fill them. This project collects those deals in one place.

**Live:** https://tour-firemai.vercel.app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + RLS) |
| Scraper | Python 3.12 + Playwright |
| Scheduler | GitHub Actions (cron every 6 hours) |
| Hosting | Vercel (ISR) |
| Analytics | Vercel Analytics + Microsoft Clarity |

---

## Features

**Frontend**
- Aggregates tours from 6 travel websites automatically (see [Sources](#sources))
- Hides tours whose departure date has already passed
- Price history chart on each tour, with a "lowest price seen" badge
- "Add LINE friend" button to receive those alerts
- Favorites: save tours with the heart icon (stored in the browser, no login) and review them at `/favorites`
- Filter by destination (multi-select), departure month, price range, and sort order
- Displays discount percentage, original price, and departure date
- Image fallback when tour photo fails to load
- Mobile-friendly with a filter drawer on small screens
- ISR cache (6 hours) — fast response, minimal Supabase usage
- Error boundaries on every page, 404 page, loading skeletons
- SEO: sitemap, robots.txt, dynamic metadata based on active filters

**Scraper**
- Retries up to 2 times on failure with 30s / 60s backoff
- Email notification via GitHub Actions when a scraper fails
- Deletes tours inactive for more than 3 days after each run
- Skips tours already departed, so they are deactivated and cleaned up with the rest
- Sends a LINE Flex Message carousel of newly found tours to the account's followers, at most about once a day (optional, see [LINE alerts](#line-alerts))

**Security**
- Row Level Security (RLS) on Supabase
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Country filter whitelist to prevent query injection

---

## Project Structure

```
tour-firemai/
├── app/
│   ├── page.tsx              # Landing page — top discounted tours
│   ├── tours/page.tsx        # Listing page — filter + pagination
│   ├── layout.tsx            # Root layout + Analytics
│   ├── error.tsx             # Root error boundary
│   ├── not-found.tsx         # 404 page
│   ├── loading.tsx           # Landing skeleton
│   ├── sitemap.ts            # /sitemap.xml
│   ├── robots.ts             # /robots.txt
│   ├── tours/error.tsx       # Tours error boundary
│   ├── tours/loading.tsx     # Tours skeleton
│   └── icon.svg              # Favicon
├── components/
│   ├── Navbar.tsx
│   ├── MobileMenu.tsx
│   ├── HeroSection.tsx       # Search bar with 4 dropdowns
│   ├── TourCard.tsx
│   ├── TourImage.tsx         # Client component with image fallback
│   ├── FilterSidebar.tsx     # Desktop sidebar + mobile drawer
│   ├── FavoriteButton.tsx    # Heart toggle (client, localStorage)
│   ├── FavoritesList.tsx     # Saved tours for /favorites
│   ├── PriceHistory.tsx      # Step chart of price changes
│   ├── LineAddFriend.tsx     # Add-friend banner / button (hidden until configured)
│   ├── LineIcon.tsx
│   ├── Dropdown.tsx
│   ├── Pagination.tsx
│   ├── SiteFooter.tsx
│   └── Logo.tsx
├── lib/
│   ├── supabase.ts
│   ├── tours.ts              # "not departed yet" filter
│   ├── favorites.ts          # useFavorites() hook
│   └── countries.ts          # COUNTRY_LIST whitelist
├── types/
│   └── database.ts
├── scraper/
│   ├── main.py               # Entry point + retry logic + cleanup
│   ├── base_scraper.py       # Abstract base class
│   ├── notify.py             # LINE Flex Message alerts
│   ├── preview_flex.py       # Preview / validate the alert card
│   ├── db.py                 # Supabase upsert + stale tour deletion
│   ├── requirements.txt
│   ├── scrapers/
│   │   ├── travelzeed.py     # source_id=4
│   │   ├── unithai.py        # source_id=5
│   │   ├── mushroom.py       # source_id=6
│   │   ├── thaifly.py        # source_id=7
│   │   ├── qualityexpress.py # source_id=8
│   │   └── navarich.py       # source_id=9
│   └── tests/
│       ├── conftest.py
│       ├── test_parsers.py   # parser tests for all scrapers
│       ├── test_filters.py   # departed-tour filter tests
│       ├── test_notify.py    # Flex message + alert rules
│       ├── test_db.py
│       └── test_main.py
├── supabase/migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_tour_url_unique.sql
│   ├── 003_add_quality_express_source.sql
│   ├── 004_add_navarich_source.sql
│   ├── 005_enable_rls.sql
│   ├── 006_price_history.sql
│   └── 007_notified_at.sql
└── .github/workflows/
    ├── ci.yml                # pytest on every push/PR
    └── scrape.yml            # cron: 0 */6 * * *
```

---

## Local Development

### Frontend

```bash
npm install
cp .env.local.example .env.local
# Fill in your Supabase URL and Anon Key
npm run dev
```

### Scraper

```bash
cd scraper
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium

cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
python main.py
```

### Tests

```bash
cd scraper
pytest tests/ -v
```

---

## Environment Variables

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Scraper (`scraper/.env`)

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### GitHub Actions Secrets

| Secret | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (not the anon key) |
| `LINE_CHANNEL_ACCESS_TOKEN` | Optional. LINE Messaging API channel access token |
| `LINE_BROADCAST` / `LINE_TO` | Optional. Broadcast to all followers, or push to one user ID |
| `LINE_MIN_INTERVAL_HOURS` | Optional. Minimum hours between alerts (default 20) |

See [LINE alerts](#line-alerts).

### LINE alerts

After each scrape, the scraper pushes one LINE message with the newly found tours (best discounts first, up to 10). It is optional: with no token set it is skipped, and a failed push never fails the scrape. The first run for an empty source reports nothing, to avoid a flood of every tour as "new".

LINE Notify was shut down in 2025, so this uses the Messaging API:

1. Create a Messaging API channel in the [LINE Developers console](https://developers.line.biz/console/) and issue a **channel access token (long-lived)**.
2. Get the target ID: your own **user ID** (Basic settings tab), or a **group ID** if you add the bot to a group (needs a webhook to read it).
3. Add the token and ID as the secrets above. To try it locally, put `LINE_CHANNEL_ACCESS_TOKEN` and `LINE_TO` in `scraper/.env`.

A push to a user requires that user to have added the bot as a friend first.

---

## Database Setup

Run the following SQL files in Supabase SQL Editor in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_add_tour_url_unique.sql
supabase/migrations/003_add_quality_express_source.sql
supabase/migrations/004_add_navarich_source.sql
supabase/migrations/005_enable_rls.sql
supabase/migrations/006_price_history.sql
supabase/migrations/007_notified_at.sql
```

Run them in this order on an empty database: the scrapers use hardcoded `source_id` values that depend on insert order.

### Sources

The `sources` table is seeded with 9 rows, but only 6 have a scraper:

| id | Source | Scraper |
|---|---|---|
| 1 | Thaitravelcenter | — (not implemented) |
| 2 | Traveloka | — (not implemented) |
| 3 | Nidnoi Travel | — (listing page has no title, needs more work) |
| 4 | TravelZeed Fire | `travelzeed.py` |
| 5 | Uni Thai Travel | `unithai.py` |
| 6 | Mushroom Travel | `mushroom.py` |
| 7 | Thai Fly | `thaifly.py` |
| 8 | Quality Express | `qualityexpress.py` |
| 9 | Navarich Travel | `navarich.py` |

### Supabase API keys

Both key styles work. For the new style, use the publishable key (`sb_publishable_...`) in `NEXT_PUBLIC_SUPABASE_ANON_KEY` and the secret key (`sb_secret_...`) in `SUPABASE_SERVICE_ROLE_KEY`. The scraper needs `supabase>=2.34` for `sb_secret_` keys; older versions reject them with `Invalid API key`. Never put the secret key in a `NEXT_PUBLIC_*` variable or in Vercel: it bypasses RLS.

---

## Deployment

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com) → Framework: Next.js
3. Add environment variables in Vercel project settings
4. Add secrets in GitHub repository settings
5. Trigger the first scraper run manually: GitHub Actions → Scrape Tours → Run workflow
