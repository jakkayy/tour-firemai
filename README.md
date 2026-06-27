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
- Aggregates tours from 6 travel websites automatically
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
│   ├── Dropdown.tsx
│   ├── Pagination.tsx
│   ├── SiteFooter.tsx
│   └── Logo.tsx
├── lib/
│   ├── supabase.ts
│   └── countries.ts          # COUNTRY_LIST whitelist
├── types/
│   └── database.ts
├── scraper/
│   ├── main.py               # Entry point + retry logic + cleanup
│   ├── base_scraper.py       # Abstract base class
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
│       └── test_parsers.py   # 54 test cases covering all scrapers
├── supabase/migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_tour_url_unique.sql
│   ├── 003_add_quality_express_source.sql
│   ├── 004_add_navarich_source.sql
│   └── 005_enable_rls.sql
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

---

## Database Setup

Run the following SQL files in Supabase SQL Editor in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_add_tour_url_unique.sql
supabase/migrations/003_add_quality_express_source.sql
supabase/migrations/004_add_navarich_source.sql
supabase/migrations/005_enable_rls.sql
```

---

## Deployment

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com) → Framework: Next.js
3. Add environment variables in Vercel project settings
4. Add secrets in GitHub repository settings
5. Trigger the first scraper run manually: GitHub Actions → Scrape Tours → Run workflow
