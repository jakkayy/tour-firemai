export const revalidate = 21600;

import { supabase } from "@/lib/supabase";
import type { Tour } from "@/types/database";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TourCard from "@/components/TourCard";
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

      {/* Stat strip */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-6 text-xs text-slate-400 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
            รวบรวมจาก <span className="text-white font-semibold">4 เว็บทัวร์</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
            อัปเดตอัตโนมัติ <span className="text-white font-semibold">ทุก 6 ชั่วโมง</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            ทัวร์ทั้งหมด <span className="text-white font-semibold">275+ รายการ</span>
          </span>
        </div>
      </div>

      <section className="bg-zinc-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-2">Flash Deals</p>
              <h2 className="text-3xl font-bold text-zinc-900">ทัวร์ลดราคาสูงสุด</h2>
              <p className="text-zinc-500 text-sm mt-1">
                คัดสรรทัวร์ไฟไหม้ที่ลดราคาสูงสุดจากทุกแหล่ง
              </p>
            </div>
            <Link
              href="/tours"
              className="text-sm font-semibold text-teal-700 hover:text-teal-600 transition-colors whitespace-nowrap"
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


    </>
  );
}
