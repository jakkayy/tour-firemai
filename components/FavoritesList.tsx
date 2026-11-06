"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useFavorites } from "@/lib/favorites";
import { notDepartedFilter } from "@/lib/tours";
import type { Tour } from "@/types/database";
import TourCard from "./TourCard";

type TourWithSource = Tour & { source_name: string };

export default function FavoritesList() {
  const { ids, removeMany } = useFavorites();
  const idsKey = ids.join(",");
  // `key` records which ids the result belongs to, so "loading" is derived rather than set in the effect.
  const [loaded, setLoaded] = useState<{ key: string; tours: TourWithSource[]; failed: boolean } | null>(null);

  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;
    const wanted = idsKey.split(",").map(Number);

    supabase
      .from("tours")
      .select("*, sources(name)")
      .in("id", wanted)
      .eq("is_active", true)
      .or(notDepartedFilter())
      .then(({ data, error }) => {
        if (cancelled) return;
        const rows = (data ?? []) as Array<Tour & { sources: { name: string } | null }>;
        const byId = new Map(rows.map((r) => [r.id, { ...r, source_name: r.sources?.name ?? "" }]));
        // Keep the order they were saved in (newest first).
        const tours = wanted.flatMap((id) => byId.get(id) ?? []);
        setLoaded({ key: idsKey, tours, failed: !!error });
      });

    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  if (ids.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-lg font-medium text-zinc-600">ยังไม่มีรายการโปรด</p>
        <p className="text-sm text-zinc-400 mt-1">กดไอคอนหัวใจบนทัวร์ที่สนใจเพื่อบันทึกไว้ดูภายหลัง</p>
        <Link
          href="/tours"
          className="inline-block mt-6 bg-slate-800 text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-slate-700 transition-colors"
        >
          ดูทัวร์ทั้งหมด
        </Link>
      </div>
    );
  }

  if (!loaded || loaded.key !== idsKey) {
    return <p className="text-center py-24 text-sm text-zinc-400">กำลังโหลด...</p>;
  }

  if (loaded.failed) {
    return <p className="text-center py-24 text-sm text-zinc-500">โหลดรายการโปรดไม่สำเร็จ ลองรีเฟรชหน้านี้อีกครั้ง</p>;
  }

  const foundIds = new Set(loaded.tours.map((t) => t.id));
  const gone = ids.filter((id) => !foundIds.has(id));

  return (
    <>
      {gone.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-100 text-amber-700 text-sm rounded-xl px-4 py-3 mb-6">
          <span>{gone.length} รายการที่บันทึกไว้ปิดรับหรือเดินทางไปแล้ว</span>
          <button
            type="button"
            onClick={() => removeMany(gone)}
            className="font-semibold underline underline-offset-2 hover:text-amber-900"
          >
            ลบออกจากรายการ
          </button>
        </div>
      )}

      {loaded.tours.length === 0 ? (
        <p className="text-center py-20 text-sm text-zinc-400">ไม่มีทัวร์ที่ยังเปิดอยู่ในรายการโปรด</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loaded.tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      )}
    </>
  );
}
