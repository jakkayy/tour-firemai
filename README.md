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
- Home page cached for 15 minutes and refreshed right after every scrape — fast response, minimal Supabase usage (see [Fresh data on the site](#fresh-data-on-the-site-after-each-scrape))
- Error boundaries on every page, 404 page, loading skeletons
- SEO: sitemap, robots.txt, dynamic metadata based on active filters

**Scraper**
- Retries up to 2 times on failure with 30s / 60s backoff
- Email notification via GitHub Actions when a scraper fails
- Deletes tours inactive for more than 3 days after each run
- Skips tours already departed, so they are deactivated and cleaned up with the rest
- Sends followers of the LINE account a morning Flex Message carousel of new deals discounting 30%+, by default at most once a day (optional, see [LINE alerts](#line-alerts))

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
│   ├── api/revalidate/route.ts # POST: refresh cached pages after a scrape (needs REVALIDATE_SECRET)
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
│   ├── revalidate.py         # Tells the website to refresh after a scrape
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
│       ├── test_revalidate.py # Website refresh call
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

Optional tuning variables for the alert rules go in GitHub **variables**, not secrets. See [LINE alerts](#line-alerts).

### Fresh data on the site after each scrape

The home page is cached (`revalidate = 900`, so at most 15 minutes behind on its own) and the sitemap is only rebuilt when the site is deployed. So new tours show up right away, the scraper calls `POST /api/revalidate` when it finishes; that endpoint refreshes the home page, sitemap and the country filter list, and the scraper then opens the home page once so the first visitor gets the finished page. The tour list and tour pages are rendered on every request and never needed this. Without `REVALIDATE_SECRET` nothing breaks: the home page just waits out its 15-minute cache, but the sitemap then only changes on a deploy.

| Variable | Where | Purpose |
|---|---|---|
| `REVALIDATE_SECRET` | **Vercel** (server-only, not `NEXT_PUBLIC_`, redeploy after adding) and **GitHub secret**, same value in both | Authorises the call. Without it the endpoint answers 503 and the scraper skips the step |
| `REVALIDATE_URL` | GitHub variable, optional | Defaults to `https://tour-firemai.vercel.app/api/revalidate` |

Use a long random value, for example `openssl rand -hex 32`. The step never fails a scrape: if the website is down it only logs a warning.

### LINE alerts

Visitors add the site's LINE Official Account as a friend with a button on the site (navbar, home page, tour pages, footer). Each morning the scraper can send everyone who follows the account one **Flex Message carousel** of the best new deals: a card per tour (image, discount badge, price, savings, departure date, "ดูทัวร์" button), biggest discounts first, plus a closing card linking to the site.

It is optional: with no token set it is skipped, and a failed send never fails the scrape.

**When it sends.** Only if all of these hold, otherwise the tours are held for a later run:

| Rule | Default | Variable |
|---|---|---|
| It is the morning run (Bangkok hours, inclusive; `any` = no restriction, handy for a manual test) | `7-9` | `LINE_SEND_HOURS` |
| The last alert was at least this many hours ago | `20` | `LINE_MIN_INTERVAL_HOURS` |
| New tours discounting by at least this many percent | `30` | `LINE_MIN_DISCOUNT` |
| At least this many such tours | `2` | `LINE_MIN_DEALS` |

That works out to at most one message a day, and none on days without enough good deals. Five cards are shown; the closing card says how many more there were. Alerts do not cover price drops on existing tours, and every recipient gets the same message.

**Why so conservative.** Broadcasts are billed per follower, and a blocked account is lost for good, so each message has to be worth opening. About 9% of tours clear the 30% bar. Watch the block count in LINE Official Account Manager and loosen or tighten the variables accordingly.

Which tours were already announced is stored in `tours.notified_at` (migration 007), so a tour is never announced twice and a failed send is retried on the next run. Tours below the discount bar are never marked, so one that later drops past the bar is announced then. Migration 007 marks existing tours as announced, so switching alerts on does not announce the whole catalogue.

LINE Notify was shut down in 2025, so this uses the Messaging API:

1. In LINE Official Account Manager open **Settings → Messaging API** and enable it for your account.
2. In the [LINE Developers console](https://developers.line.biz/console/) open that channel, **Messaging API** tab, and issue a **channel access token (long-lived)**.
3. Add the GitHub secrets below, and set `NEXT_PUBLIC_LINE_ADD_FRIEND_URL` (a plain **Config** variable, not secret) in Vercel to the account's add-friend link (e.g. `https://lin.ee/xxxx`, from Official Account Manager). Redeploy. The add-friend buttons stay hidden while it is unset.

| Variable | Where | Purpose |
|---|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | GitHub secret | Required to send |
| `LINE_BROADCAST` | GitHub secret | `true` to send to every follower |
| `LINE_TO` | GitHub secret | Alternative to broadcast: one user ID (Basic settings tab of the channel), for testing on yourself. `LINE_BROADCAST` wins if both are set |
| `LINE_SEND_HOURS`, `LINE_MIN_INTERVAL_HOURS`, `LINE_MIN_DISCOUNT`, `LINE_MIN_DEALS` | GitHub **variables** (Settings → Secrets and variables → Actions → Variables) | Optional tuning, see the table above |
| `NEXT_PUBLIC_LINE_ADD_FRIEND_URL` | Vercel (Config) | Add-friend link shown on the site |

**Preview the card without sending anything:**

```bash
cd scraper
python preview_flex.py             # prints sample JSON to paste into the Flex Message Simulator
python preview_flex.py --validate  # has LINE check the format (needs LINE_CHANNEL_ACCESS_TOKEN)
```

Simulator: https://developers.line.biz/flex-simulator/

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
