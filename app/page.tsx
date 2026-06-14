import { supabase } from "@/lib/supabase";
import { COUNTRY_LIST, extractCountry } from "@/lib/countries";
import type { Tour } from "@/types/database";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import CategorySection from "@/components/CategorySection";
import SiteFooter from "@/components/SiteFooter";
import TourCard from "@/components/TourCard";
import Link from "next/link";

type TourWithSource = Tour & { source_name: string };

async function getTours(country?: string): Promise<TourWithSource[]> {
  let query = supabase
    .from("tours")
    .select("*, sources(name)")
    .eq("is_active", true)
    .order("discount_percent", { ascending: false })
    .limit(60);

  if (country) {
    query = query.ilike("title", `%${country}%`);
  }

  const { data, error } = await query;
  if (error) console.error("getTours error:", error);
  if (!data) return [];

  return data.map((row: Tour & { sources: { name: string } | null }) => ({
    ...row,
    source_name: row.sources?.name ?? "",
  }));
}

async function getAvailableCountries(): Promise<string[]> {
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
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const { country } = await searchParams;
  const [tours, countries] = await Promise.all([
    getTours(country),
    getAvailableCountries(),
  ]);

  return (
    <>
      <Navbar />
      <HeroSection selectedCountry={country} />
      <FeaturesSection />
      <CategorySection />

      {/* Hot Deals */}
      <section id="hot-deals" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-zinc-900">
                🔥 ทัวร์ไฟไหม้ ราคาดีที่สุด
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                {country
                  ? `ทัวร์${country} — พบ ${tours.length} รายการ`
                  : `พบ ${tours.length} รายการ อัปเดตล่าสุดทุก 6 ชั่วโมง`}
              </p>
            </div>
            {country && (
              <Link
                href="/#hot-deals"
                className="text-sm text-blue-600 hover:underline whitespace-nowrap"
              >
                ← ดูทั้งหมด
              </Link>
            )}
          </div>

          {/* Country filter chips */}
          {countries.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-8">
              <Link
                href="/#hot-deals"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  !country
                    ? "bg-blue-900 text-white border-blue-900"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-blue-400 hover:text-blue-700"
                }`}
              >
                ทั้งหมด
              </Link>
              {countries.map((c) => (
                <Link
                  key={c}
                  href={`/?country=${encodeURIComponent(c)}#hot-deals`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    country === c
                      ? "bg-blue-900 text-white border-blue-900"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-blue-400 hover:text-blue-700"
                  }`}
                >
                  {c}
                </Link>
              ))}
            </div>
          )}

          {tours.length === 0 ? (
            <div className="text-center py-24 text-zinc-400">
              <p className="text-5xl mb-4">🏝️</p>
              <p className="text-lg font-medium text-zinc-600 mb-2">
                {country ? `ยังไม่มีทัวร์${country}ในขณะนี้` : "ยังไม่มีทัวร์ในขณะนี้"}
              </p>
              <p className="text-sm">ระบบอัปเดตทุก 6 ชั่วโมง ลองกลับมาดูใหม่ในภายหลัง</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
