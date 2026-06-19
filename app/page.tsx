export const revalidate = 21600;

import { supabase } from "@/lib/supabase";
import type { Tour } from "@/types/database";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TourCard from "@/components/TourCard";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";

type TourWithSource = Tour & { source_name: string };

async function getFeaturedTours(): Promise<TourWithSource[]> {
  const { data, error } = await supabase
    .from("tours")
    .select("*, sources(name)")
    .eq("is_active", true)
    .not("discount_percent", "is", null)
    .order("discount_percent", { ascending: false })
    .limit(6);

  if (error) console.error("getFeaturedTours error:", error);

  return (data ?? []).map((row: Tour & { sources: { name: string } | null }) => ({
    ...row,
    source_name: row.sources?.name ?? "",
  }));
}

export default async function Home() {
  const tours = await getFeaturedTours();

  return (
    <>
      <Navbar />
      <HeroSection />

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-zinc-900">ทัวร์ลดราคาสูงสุด</h2>
              <p className="text-zinc-500 text-sm mt-1">
                คัดสรรทัวร์ไฟไหม้ที่ลดราคาสูงสุดจากทุกแหล่ง
              </p>
            </div>
            <Link
              href="/tours"
              className="text-sm font-medium text-blue-700 hover:underline whitespace-nowrap"
            >
              ดูทั้งหมด →
            </Link>
          </div>

          {tours.length === 0 ? (
            <div className="text-center py-20 text-zinc-400">
              <p className="text-lg font-medium text-zinc-600">ยังไม่มีทัวร์ในขณะนี้</p>
              <p className="text-sm mt-1">ระบบอัปเดตทุก 6 ชั่วโมง</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {tours.map((tour, i) => (
                  <TourCard key={tour.id} tour={tour} priority={i < 3} />
                ))}
              </div>
              <div className="text-center mt-10">
                <Link
                  href="/tours"
                  className="inline-block bg-blue-900 text-white px-10 py-3 rounded-full font-semibold hover:bg-blue-800 transition-colors"
                >
                  ดูทัวร์ทั้งหมด
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
