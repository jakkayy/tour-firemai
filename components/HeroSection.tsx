"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { COUNTRY_LIST } from "@/lib/countries";
import Dropdown from "./Dropdown";

export default function HeroSection({ selectedCountry }: { selectedCountry?: string }) {
  const router = useRouter();
  const [country, setCountry] = useState(selectedCountry ?? "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const url = country ? `/tours?country=${encodeURIComponent(country)}` : "/tours";
    router.push(url);
  }

  return (
    <section className="relative min-h-[500px] bg-gradient-to-b from-slate-900 via-blue-950 to-teal-950 flex items-center justify-center overflow-hidden">
      {/* Subtle dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Glow orbs */}
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 border border-white/20 rounded-full px-4 py-1.5 text-sm text-sky-200 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          อัปเดตทัวร์ทุก 6 ชั่วโมง
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          ค้นพบ<span className="text-sky-300">ทัวร์ไฟไหม้</span>
          <br />ราคาดีที่สุด
        </h1>
        <p className="text-lg text-slate-300 mb-10">
          รวมทัวร์ลดราคาสูงสุดก่อนวันเดินทาง จากเว็บทัวร์ชั้นนำ
        </p>

        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto"
        >
          <Dropdown
            variant="dark"
            options={[
              { value: "", label: "ทุกประเทศปลายทาง" },
              ...COUNTRY_LIST.map((c) => ({ value: c, label: `ทัวร์${c}` })),
            ]}
            value={country}
            onChange={setCountry}
            placeholder="ทุกประเทศปลายทาง"
            className="flex-1"
          />
          <button
            type="submit"
            className="bg-teal-500 text-white px-8 py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-400 transition-colors whitespace-nowrap"
          >
            ค้นหาทัวร์
          </button>
        </form>
      </div>
    </section>
  );
}
