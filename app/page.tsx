export const revalidate = 21600;

import { supabase } from "@/lib/supabase";
import type { Tour } from "@/types/database";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TourCard from "@/components/TourCard";
import Link from "next/link";

type TourWithSource = Tour & { source_name: string };

async function getTourCount(): Promise<number> {
  const { count, error } = await supabase
    .from("tours")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);
  if (error) console.error("getTourCount error:", error);
  return count ?? 0;
}

async function getFeaturedTours(): Promise<TourWithSource[]> {
  const { data, error } = await supabase
    .from("tours")
    .select("*, sources(name)")
    .eq("is_active", true)
    .not("discount_percent", "is", null)
    .not("image_url", "is", null)
    .order("discount_percent", { ascending: false })
    .limit(6);

  if (error) console.error("getFeaturedTours error:", error);

  return (data ?? []).map((row: Tour & { sources: { name: string } | null }) => ({
    ...row,
    source_name: row.sources?.name ?? "",
  }));
}

function PlaneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2l2 2L8 11 1 18l3 1 1 3 7-7 2.7 2.2 2 2z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export default async function Home() {
  const [tours, tourCount] = await Promise.all([getFeaturedTours(), getTourCount()]);

  return (
    <>
      <Navbar />
      <HeroSection />

      {/* Stat strip */}
      <div className="bg-white border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 py-2">
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center shrink-0 text-teal-600">
                <PlaneIcon />
              </div>
              <div>
                <p className="font-bold text-zinc-900 text-sm">6 เว็บไซต์หลัก</p>
                <p className="text-xs text-zinc-500">เปรียบเทียบราคาจากแหล่งที่เชื่อถือได้</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="w-11 h-11 rounded-full bg-sky-50 flex items-center justify-center shrink-0 text-sky-600">
                <ClockIcon />
              </div>
              <div>
                <p className="font-bold text-zinc-900 text-sm">อัปเดตทุก 6 ชั่วโมง</p>
                <p className="text-xs text-zinc-500">ไม่พลาดดีลไฟไหม้ล่าสุดเสมอ</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="w-11 h-11 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-orange-500">
                <ListIcon />
              </div>
              <div>
                <p className="font-bold text-zinc-900 text-sm">ทัวร์ {tourCount.toLocaleString("th-TH")} รายการ</p>
                <p className="text-xs text-zinc-500">หลากหลายปลายทางทั่วโลก</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-zinc-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-2">Flash Sale Deals</p>
            <h2 className="text-3xl font-bold text-zinc-900">ดีลทัวร์ไฟไหม้ แนะนำวันนี้</h2>
            <p className="text-zinc-500 text-sm mt-1">
              คัดสรรทัวร์ไฟไหม้ที่ลดราคาสูงสุดจากทุกแหล่ง
            </p>
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
                  className="inline-block bg-slate-800 text-white px-10 py-3 rounded-full font-semibold hover:bg-slate-700 transition-colors"
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
