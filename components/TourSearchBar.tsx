"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export default function TourSearchBar({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQ);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams(searchParams.toString());
    if (q.trim()) {
      p.set("q", q.trim());
    } else {
      p.delete("q");
    }
    p.delete("page");
    router.push(`/tours?${p.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ค้นหาชื่อทัวร์ เช่น ญี่ปุ่น โอซาก้า ฮ่องกง..."
        className="flex-1 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-400 bg-white shadow-sm"
      />
      <button
        type="submit"
        className="bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors flex items-center gap-2 shrink-0"
      >
        <SearchIcon />
        ค้นหา
      </button>
    </form>
  );
}
