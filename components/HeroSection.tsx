"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { COUNTRY_LIST } from "@/lib/countries";

export default function HeroSection({ selectedCountry }: { selectedCountry?: string }) {
  const router = useRouter();
  const [country, setCountry] = useState(selectedCountry ?? "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const url = country ? `/?country=${encodeURIComponent(country)}#hot-deals` : "/#hot-deals";
    router.push(url);
  }

  return (
    <section className="relative min-h-[480px] bg-gradient-to-br from-blue-950 via-blue-800 to-cyan-700 flex items-center justify-center overflow-hidden">
      {/* decorative circles */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
      <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5" />

      <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm text-blue-100 mb-6">
          อัปเดตทัวร์ทุก 6 ชั่วโมง
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          ค้นพบ<span className="text-orange-400">ทัวร์ไฟไหม้</span><br />ราคาดีที่สุด
        </h1>
        <p className="text-lg text-blue-100 mb-10">
          รวมทัวร์ลดราคาสูงสุดก่อนวันเดินทาง จาก 5+ เว็บทัวร์ชั้นนำ
        </p>

        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto bg-white rounded-2xl p-2 shadow-2xl"
        >
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="flex-1 px-4 py-2.5 text-zinc-700 bg-transparent outline-none text-sm"
          >
            <option value="">ทุกประเทศปลายทาง</option>
            {COUNTRY_LIST.map((c) => (
              <option key={c} value={c}>
                ทัวร์{c}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-orange-500 text-white px-8 py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors whitespace-nowrap"
          >
            ค้นหาทัวร์
          </button>
        </form>
      </div>
    </section>
  );
}
