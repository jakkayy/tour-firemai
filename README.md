# ทัวร์ไฟไหม้

รวมทัวร์ลดราคาก่อนวันเดินทาง ดึงข้อมูลอัตโนมัติจากเว็บทัวร์ชั้นนำทุก 6 ชั่วโมง

**ทัวร์ไฟไหม้** คือทัวร์ที่ใกล้ถึงวันเดินทางแต่ที่นั่งยังไม่เต็ม บริษัททัวร์จึงลดราคาเพื่อเติมที่นั่งให้ครบ โปรเจคนี้ทำหน้าที่รวบรวมทัวร์เหล่านั้นไว้ในที่เดียว

🌐 **Live:** https://tour-firemai.vercel.app

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + RLS) |
| Scraper | Python 3.12 + Playwright |
| Scheduler | GitHub Actions (cron ทุก 6 ชั่วโมง) |
| Hosting | Vercel (ISR) |
| Analytics | Vercel Analytics + Microsoft Clarity |

---

## Features

**Frontend**
- รวมทัวร์จาก 6 เว็บทัวร์ชั้นนำโดยอัตโนมัติ
- กรองตามประเทศปลายทาง (multi-select), เดือนเดินทาง, ช่วงราคา, และการเรียงลำดับ
- แสดงส่วนลด, ราคาต้นทาง, และวันเดินทาง
- Image fallback เมื่อโหลดรูปไม่ได้
- Mobile-friendly พร้อม filter drawer บนมือถือ
- ISR cache 6 ชั่วโมง — เร็ว ไม่กระทบ Supabase quota
- Error boundary ทุกหน้า, 404 page, loading skeleton
- SEO: sitemap, robots.txt, dynamic metadata ตามตัวกรอง

**Scraper**
- retry อัตโนมัติ 2 ครั้งเมื่อ scrape ล้ม พร้อม backoff 30s / 60s
- แจ้งเตือนทาง email เมื่อ scraper fail (GitHub Actions)
- ลบทัวร์ที่ inactive เกิน 3 วันอัตโนมัติหลังแต่ละ run

**Security**
- Row Level Security (RLS) บน Supabase
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Country filter whitelist ป้องกัน injection

---

## โครงสร้างโปรเจค

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
│   ├── HeroSection.tsx       # Search bar + 4 dropdowns
│   ├── TourCard.tsx
│   ├── TourImage.tsx         # Client component พร้อม image fallback
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
│   ├── db.py                 # Supabase upsert + stale tour cleanup
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
│       └── test_parsers.py   # 54 test cases ครอบคลุมทุก scraper
├── supabase/migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_tour_url_unique.sql
│   ├── 003_add_quality_express_source.sql
│   ├── 004_add_navarich_source.sql
│   └── 005_enable_rls.sql
└── .github/workflows/
    ├── ci.yml                # pytest ทุก push/PR
    └── scrape.yml            # cron: 0 */6 * * *
```

---

## การติดตั้ง (Local Development)

### Frontend

```bash
npm install
cp .env.local.example .env.local
# แก้ไข .env.local ใส่ Supabase URL + Anon Key
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
# แก้ไข .env ใส่ SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
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

| Secret | คำอธิบาย |
|---|---|
| `SUPABASE_URL` | URL ของ Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (ไม่ใช่ anon key) |

---

## Database Setup

รัน SQL ต่อไปนี้ใน Supabase SQL Editor ตามลำดับ:

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
2. Import repo ใน [Vercel](https://vercel.com) → Framework: Next.js
3. เพิ่ม Environment Variables ใน Vercel project settings
4. เพิ่ม Secrets ใน GitHub repository settings
5. รัน scraper ครั้งแรกด้วยตัวเอง: GitHub Actions → Scrape Tours → Run workflow
