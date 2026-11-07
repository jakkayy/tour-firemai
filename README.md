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
- The search box on the tours page shows results as you type (the Search button still works); the "when" filter offers "within 7 days" next to the months (one choice, so they cannot cancel each other out)
- Privacy: a cookie banner asks before Microsoft Clarity is loaded (nothing from Clarity is requested until "accept"), the choice can be changed from the footer, and `/privacy` explains the data in Thai (PDPA).
- Filter by destination (multi-select; a tour can belong to several countries), departure month, price range, and sort order — see [Countries](#countries)
- The country field on the home page can be typed into as well as picked from the list (arrow keys and Enter work); countries show their flag
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
- UniThai's list page has no pictures, so each tour's picture is read once from its own page (the `og:image` tag) and kept; at most 80 pages per run, so the first runs fill them in gradually
- TravelZeed cards without a crossed-out price show only a "฿X off" badge; the original price is the price paid plus X (the badge matches the gap between the two prices on about 95% of the cards that show both)
- Tours without a picture show their country's flag and name instead of an empty box
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
├── public/flags/            # SVG flags (flag-icons, MIT); licence and notes inside
├── components/
│   ├── Navbar.tsx
│   ├── MobileMenu.tsx
│   ├── CountryFlag.tsx       # Flag icon from public/flags (decorative)
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
│   ├── countries.ts          # COUNTRY_LIST (must match scraper/countries.py) + label helpers
│   └── available-countries.ts # Countries that have tours, for the filter and home search box
├── types/
│   └── database.ts
├── scraper/
│   ├── main.py               # Entry point + retry logic + cleanup
│   ├── base_scraper.py       # Abstract base class
│   ├── countries.py          # Which countries a tour visits, from its title
│   ├── thai_text.py          # Puts Thai tone marks and vowel signs in the usual order
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
│       ├── test_countries.py # Country detection + list/flag sync with lib/countries.ts
│       ├── test_thai_text.py # Mark-order fix
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
│   ├── 007_notified_at.sql
│   └── 008_tour_countries.sql
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
supabase/migrations/008_tour_countries.sql
```

Run them in this order on an empty database: the scrapers use hardcoded `source_id` values that depend on insert order.

### Countries

Each tour has a `countries` list in the database (`tours.countries`, a Postgres array with a GIN index), set by the scraper from the title on every run. The site filters on it ("any of the chosen countries"), shows up to two countries on a card, and builds the filter and the home search box from the countries that actually have tours.

Detecting them takes more than looking for a country name, so `scraper/countries.py` also knows well-known cities and sights (`Qingdao`, `ฟุกุโอกะ`), English spellings, alternative Thai spellings (`ตุรเคีย`, `เมียนมาร์`), and that a tour naming a European country is also a `ยุโรป` tour. Words that merely look like a place are left out on purpose (`เว้`, `โรม`, `เช็ก`, `ไคโร`, `เวนิส`) and a few tours stay without a country rather than get a wrong one.

Titles from some sites store the tone mark before the vowel sign (`ป` `่` `ุ` instead of `ป` `ุ` `่`). It looks identical but never matches a search for "ญี่ปุ่น", so `scraper/thai_text.py` puts every title in the usual order before it is saved. This also fixed the search box for those tours.

To add a country: add it, with its words, to `COUNTRY_KEYWORDS` in `scraper/countries.py` **and** to `COUNTRY_LIST` and `COUNTRY_CODES` in `lib/countries.ts` (and the European sets if it is in Europe), and add its flag as `public/flags/<code>.svg`. A test fails if the lists differ or a flag file is missing or unused.

**Rolling it out, in this order:**

1. Run `supabase/migrations/008_tour_countries.sql` in the Supabase SQL Editor. It adds the column, tidies existing titles and gives existing tours a first set of countries.
2. Merge, so the site and the scraper are deployed.
3. Run the scraper once (Actions → Scrape Tours → Run workflow). It fills in the full detection for every active tour.

If the site is deployed before step 1, nothing breaks: without the column it falls back to matching country names in the title, as before.

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
