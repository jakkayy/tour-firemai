export const revalidate = 21600;

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";
import { COUNTRY_LIST, extractCountry } from "@/lib/countries";
import type { Tour } from "@/types/database";
import Navbar from "@/components/Navbar";
import TourCard from "@/components/TourCard";
import FilterSidebar from "@/components/FilterSidebar";
import Pagination from "@/components/Pagination";

const PER_PAGE = 12;

type Params = {
  country?: string;
  min?: string;
  max?: string;
  sort?: string;
  page?: string;
};

type TourWithSource = Tour & { source_name: string };

async function getTours(params: Params): Promise<{ tours: TourWithSource[]; total: number }> {
  const page = Math.max(1, Number(params.page ?? 1));
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let query = supabase
    .from("tours")
    .select("*, sources(name)", { count: "exact" })
    .eq("is_active", true);

  if (params.country) query = query.ilike("title", `%${params.country}%`);
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
  if (error) console.error("getTours error:", error);

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

  const [{ tours, total }, countries] = await Promise.all([
    getTours(params),
    getAvailableCountries(),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const heading = params.country ? `ทัวร์${params.country}` : "ทัวร์ไฟไหม้ทั้งหมด";

  return (
    <>
      <Navbar />

      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-xs font-semibold text-teal-400 uppercase tracking-widest mb-2">Flash Deals</p>
          <h1 className="text-3xl font-bold text-white">{heading}</h1>
          <p className="text-slate-400 text-sm mt-1">พบ <span className="text-white font-semibold">{total}</span> รายการ</p>
        </div>
      </div>

      <div className="bg-zinc-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex gap-7">
            <FilterSidebar countries={countries} currentParams={params} />

            <div className="flex-1 min-w-0">
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
