export const revalidate = 21600;

import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { COUNTRY_LIST, extractCountry } from "@/lib/countries";
import type { Tour } from "@/types/database";
import Navbar from "@/components/Navbar";
import TourCard from "@/components/TourCard";
import FilterSidebar from "@/components/FilterSidebar";
import TourSearchBar from "@/components/TourSearchBar";
import Pagination from "@/components/Pagination";

const PER_PAGE = 12;

type Params = {
  countries?: string;
  min?: string;
  max?: string;
  sort?: string;
  page?: string;
  month?: string;
  q?: string;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Params>;
}): Promise<Metadata> {
  const params = await searchParams;
  const selected = params.countries
    ? params.countries.split(",").filter((c) => COUNTRY_LIST.includes(c))
    : [];

  const title =
    selected.length === 1
      ? `ทัวร์${selected[0]}ราคาถูก | ทัวร์ไฟไหม้`
      : selected.length > 1
        ? `ทัวร์ ${selected.join(" · ")} | ทัวร์ไฟไหม้`
        : "ทัวร์ไฟไหม้ทั้งหมด | รวมทัวร์ลดราคาก่อนวันเดินทาง";

  const description =
    selected.length > 0
      ? `รวมทัวร์${selected.join(" ")}ไฟไหม้ ลดราคาสูงสุด อัปเดตทุก 6 ชั่วโมง`
      : "รวมทัวร์ไฟไหม้จาก 6 เว็บชั้นนำ ลดราคาสูงสุด อัปเดตทุก 6 ชั่วโมง";

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

type TourWithSource = Tour & { source_name: string };

async function getTours(params: Params): Promise<{ tours: TourWithSource[]; total: number }> {
  const page = Math.max(1, Number(params.page ?? 1));
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let query = supabase
    .from("tours")
    .select("*, sources(name)", { count: "exact" })
    .eq("is_active", true);

  if (params.q) {
    query = query.ilike("title", `%${params.q}%`);
  }

  if (params.countries) {
    const list = params.countries
      .split(",")
      .filter((c) => COUNTRY_LIST.includes(c));
    if (list.length === 1) {
      query = query.ilike("title", `%${list[0]}%`);
    } else if (list.length > 1) {
      query = query.or(list.map((c) => `title.ilike.%${c}%`).join(","));
    }
  }

  if (params.month && /^\d{4}-\d{2}$/.test(params.month)) {
    const [y, m] = params.month.split("-").map(Number);
    const firstDay = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const lastDayStr = `${y}-${String(m).padStart(2, "0")}-${lastDay}`;
    query = query.gte("departure_date", firstDay).lte("departure_date", lastDayStr);
  }

  if (params.min) query = query.gte("discounted_price", Number(params.min));
  if (params.max) query = query.lte("discounted_price", Number(params.max));

  if (params.sort === "price_asc") {
    query = query.order("discounted_price", { ascending: true });
  } else if (params.sort === "price_desc") {
    query = query.order("discounted_price", { ascending: false });
  } else if (params.sort === "date") {
    query = query.order("departure_date", { ascending: true }).not("departure_date", "is", null);
  } else {
    query = query.order("discount_percent", { ascending: false });
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw new Error(`getTours: ${error.message}`);

  return {
    tours: (data ?? []).map((row: Tour & { sources: { name: string } | null }) => ({
      ...row,
      source_name: row.sources?.name ?? "",
    })),
    total: count ?? 0,
  };
}

const getAvailableCountries = unstable_cache(
  async (): Promise<string[]> => {
    const { data } = await supabase
      .from("tours")
      .select("title")
      .eq("is_active", true)
      .limit(500);

    if (!data) return [];
    const found = new Set<string>();
    data.forEach(({ title }) => {
      const c = extractCountry(title);
      if (c) found.add(c);
    });
    return COUNTRY_LIST.filter((c) => found.has(c));
  },
  ["available-countries"],
  { revalidate: 21600 }
);

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));

  const [{ tours, total }, availableCountries] = await Promise.all([
    getTours(params),
    getAvailableCountries(),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const selectedList = params.countries ? params.countries.split(",").filter(Boolean) : [];
  const heading =
    selectedList.length === 1
      ? `ทัวร์${selectedList[0]}`
      : selectedList.length > 1
        ? `ทัวร์ ${selectedList.join(" · ")}`
        : "ทัวร์ไฟไหม้ทั้งหมด";

  return (
    <>
      <Navbar />

      <div className="bg-zinc-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="mb-7">
            <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-4">
              <Link href="/" className="hover:text-zinc-600 transition-colors">หน้าแรก</Link>
              <span>/</span>
              <span className="text-teal-600 font-medium">ทัวร์ทั้งหมด</span>
            </nav>
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-2">Flash Deals</p>
            <h1 className="text-3xl font-bold text-zinc-900">{heading}</h1>
            <p className="text-zinc-500 text-sm mt-1">
              พบ <span className="text-zinc-800 font-semibold">{total}</span> รายการ
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-7">
            <FilterSidebar countries={availableCountries} currentParams={params} />

            <div className="flex-1 min-w-0">
              <TourSearchBar initialQ={params.q ?? ""} />
              {tours.length === 0 ? (
                <div className="text-center py-24">
                  <p className="text-lg font-medium text-zinc-600">ไม่พบทัวร์ที่ตรงกับเงื่อนไข</p>
                  <p className="text-sm text-zinc-400 mt-1">ลองเปลี่ยนตัวกรองใหม่</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {tours.map((tour, i) => (
                      <TourCard key={tour.id} tour={tour} priority={i < 3} />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      params={params as Record<string, string | undefined>}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
