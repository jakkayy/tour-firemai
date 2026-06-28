export const revalidate = 21600;

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { extractCountry } from "@/lib/countries";
import type { Tour } from "@/types/database";
import Navbar from "@/components/Navbar";
import TourImage from "@/components/TourImage";
import ShareButtons from "@/components/ShareButtons";

const BASE_URL = "https://tour-firemai.vercel.app";

type TourWithSource = Tour & { source_name: string };

async function getTour(id: number): Promise<TourWithSource | null> {
  const { data, error } = await supabase
    .from("tours")
    .select("*, sources(name)")
    .eq("id", id)
    .eq("is_active", true);

  if (error || !data || data.length === 0) return null;

  const row = data[0] as Tour & { sources: { name: string } | null };
  return { ...row, source_name: row.sources?.name ?? "" };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tour = await getTour(Number(id));

  if (!tour) return { title: "ไม่พบทัวร์ | ทัวร์ไฟไหม้" };

  const price = tour.discounted_price ?? tour.original_price;
  const discountPct = tour.discount_percent ? Math.round(tour.discount_percent) : null;
  const description = [
    price ? `ราคา ฿${price.toLocaleString("th-TH")} / ท่าน` : null,
    discountPct ? `ลด ${discountPct}%` : null,
    `จาก ${tour.source_name}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title: `${tour.title} | ทัวร์ไฟไหม้`,
    description,
    openGraph: {
      title: tour.title,
      description,
      url: `${BASE_URL}/tours/${tour.id}`,
      images: tour.image_url ? [{ url: tour.image_url }] : [],
    },
  };
}

function formatPrice(price: number | null) {
  if (price == null) return null;
  return price.toLocaleString("th-TH");
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tour = await getTour(Number(id));

  if (!tour) notFound();

  const country = extractCountry(tour.title);
  const price = tour.discounted_price ?? tour.original_price;
  const discountPct = tour.discount_percent != null ? Math.round(tour.discount_percent) : null;
  const pageUrl = `${BASE_URL}/tours/${tour.id}`;

  return (
    <>
      <Navbar />
      <div className="bg-zinc-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-6">
            <Link href="/" className="hover:text-zinc-600 transition-colors">หน้าแรก</Link>
            <span>/</span>
            <Link href="/tours" className="hover:text-zinc-600 transition-colors">ทัวร์ทั้งหมด</Link>
            <span>/</span>
            <span className="text-teal-600 font-medium line-clamp-1">{tour.title}</span>
          </nav>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="relative aspect-[16/9] bg-zinc-100">
              {tour.image_url ? (
                <TourImage src={tour.image_url} alt={tour.title} priority />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 gap-2">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                  <span className="text-sm text-zinc-400">ไม่มีรูปภาพ</span>
                </div>
              )}
              {discountPct && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow">
                  ลด {discountPct}%
                </span>
              )}
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5">
                  {tour.source_name}
                </span>
                {country && (
                  <span className="inline-flex items-center text-xs font-medium text-zinc-500 bg-zinc-100 rounded-full px-2.5 py-0.5">
                    📍 {country}
                  </span>
                )}
              </div>

              <h1 className="text-xl md:text-2xl font-bold text-zinc-900 mb-6 leading-snug">
                {tour.title}
              </h1>

              <div className="bg-zinc-50 rounded-2xl p-5 mb-6">
                {tour.original_price && tour.discounted_price && (
                  <p className="text-sm text-zinc-400 line-through mb-1">
                    ราคาปกติ ฿{formatPrice(tour.original_price)}
                  </p>
                )}
                <p className="text-3xl font-bold text-red-500">
                  {price ? (
                    <>฿{formatPrice(price)}<span className="text-base font-normal text-zinc-400 ml-1">/ ท่าน</span></>
                  ) : "ติดต่อสอบถาม"}
                </p>
                {tour.original_price && tour.discounted_price && (
                  <p className="text-sm text-teal-600 font-medium mt-1">
                    ประหยัด ฿{formatPrice(tour.original_price - tour.discounted_price)}
                  </p>
                )}
              </div>

              {(tour.departure_date || tour.seats_left != null) && (
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {tour.departure_date && (
                    <div className="bg-zinc-50 rounded-xl p-4">
                      <p className="text-xs text-zinc-400 mb-1">วันเดินทาง</p>
                      <p className="text-sm font-semibold text-zinc-800">{formatDate(tour.departure_date)}</p>
                    </div>
                  )}
                  {tour.seats_left != null && (
                    <div className="bg-zinc-50 rounded-xl p-4">
                      <p className="text-xs text-zinc-400 mb-1">ที่นั่งว่าง</p>
                      <p className="text-sm font-semibold text-zinc-800">{tour.seats_left} ที่นั่ง</p>
                    </div>
                  )}
                </div>
              )}

              <a
                href={tour.tour_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-slate-800 text-white py-4 rounded-2xl font-semibold text-base hover:bg-slate-700 transition-colors mb-4"
              >
                ดูรายละเอียดและจอง ↗
              </a>

              <ShareButtons url={pageUrl} title={tour.title} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
