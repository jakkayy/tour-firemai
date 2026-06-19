# ทัวร์ไฟไหม้

รวมทัวร์ลดราคาก่อนวันเดินทาง ดึงข้อมูลอัตโนมัติจากเว็บทัวร์ชั้นนำทุก 6 ชั่วโมง

**ทัวร์ไฟไหม้** คือทัวร์ที่ใกล้ถึงวันเดินทางแต่ที่นั่งยังไม่เต็ม บริษัททัวร์จึงลดราคาเพื่อเติมที่นั่งให้ครบ โปรเจคนี้ทำหน้าที่รวบรวมทัวร์เหล่านั้นไว้ในที่เดียว

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Scraper | Python 3.12 + Playwright |
| Scheduler | GitHub Actions (cron ทุก 6 ชั่วโมง) |
| Hosting | Vercel |

## Features

- รวมทัวร์จาก TravelZeed และ ThaiFly โดยอัตโนมัติ
- กรองตามประเทศปลายทาง, งบประมาณ, และการเรียงลำดับ
- แสดงส่วนลด, ราคาต้นทาง, และวันเดินทาง
- ISR cache 6 ชั่วโมง — เร็ว ไม่กระทบ Supabase quota

---

## การติดตั้ง (Local Development)

### 1. Frontend

```bash
npm install
cp .env.local.example .env.local
# แก้ไข .env.local ใส่ Supabase URL + Anon Key
npm run dev
```

### 2. Scraper

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

รัน SQL ต่อไปนี้ใน Supabase SQL Editor:

```sql
-- สร้างตาราง
-- ดูไฟล์: supabase/migrations/001_initial_schema.sql
-- และ:    supabase/migrations/002_add_tour_url_unique.sql

-- เปิด public read access
create policy "public read tours" on tours for select using (true);
create policy "public read sources" on sources for select using (true);
```

---

## โครงสร้างโปรเจค

```
tour-firemai/
├── app/
│   ├── page.tsx          # Homepage — top discounted tours
│   ├── tours/page.tsx    # Listing page — filter + pagination
│   └── icon.svg          # Favicon
├── components/
│   ├── Navbar.tsx
│   ├── HeroSection.tsx
│   ├── TourCard.tsx
│   ├── FilterSidebar.tsx
│   ├── Dropdown.tsx      # Custom dropdown component
│   ├── Pagination.tsx
│   ├── Logo.tsx
│   └── SiteFooter.tsx
├── scraper/
│   ├── main.py           # Entry point
│   ├── base_scraper.py   # Abstract base class
│   ├── db.py             # Supabase writer
│   └── scrapers/
│       ├── travelzeed.py
│       └── thaifly.py
├── lib/
│   ├── supabase.ts
│   └── countries.ts      # Country keyword extraction
└── .github/workflows/
    └── scrape.yml        # Cron: 0 */6 * * *
```

---

## Deployment

1. Push to GitHub
2. Import repo ใน [Vercel](https://vercel.com) → เลือก Framework: Next.js
3. เพิ่ม Environment Variables ใน Vercel project settings
4. เพิ่ม Secrets ใน GitHub repository settings สำหรับ Actions
