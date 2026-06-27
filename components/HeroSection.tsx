"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { COUNTRY_LIST } from "@/lib/countries";
import Dropdown from "./Dropdown";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1480796927426-f609979314bd?auto=format&fit=crop&w=1920&q=80";

const BUDGET_OPTIONS = [
  { value: "", label: "ทุกราคา" },
  { value: "10000", label: "ต่ำกว่า ฿10,000" },
  { value: "10000-20000", label: "฿10,000 – ฿20,000" },
  { value: "20000-50000", label: "฿20,000 – ฿50,000" },
  { value: "50000+", label: "มากกว่า ฿50,000" },
];

const SORT_OPTIONS = [
  { value: "discount", label: "ส่วนลดสูงสุด" },
  { value: "price_asc", label: "ราคาต่ำสุด" },
  { value: "date", label: "วันเดินทางใกล้สุด" },
];

const THAI_MONTHS_ABBR = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function getMonthOptions() {
  const now = new Date();
  const opts = [{ value: "", label: "ทุกเดือน" }];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const beYear = String(d.getFullYear() + 543).slice(-2);
    opts.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${THAI_MONTHS_ABBR[d.getMonth()]} ${beYear}`,
    });
  }
  return opts;
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}


export default function HeroSection({ selectedCountry }: { selectedCountry?: string }) {
  const router = useRouter();
  const [country, setCountry] = useState(selectedCountry ?? "");
  const [budget, setBudget] = useState("");
  const [sort, setSort] = useState("discount");
  const [month, setMonth] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (country) p.set("countries", country);
    if (budget === "10000") p.set("max", "10000");
    else if (budget === "10000-20000") { p.set("min", "10000"); p.set("max", "20000"); }
    else if (budget === "20000-50000") { p.set("min", "20000"); p.set("max", "50000"); }
    else if (budget === "50000+") p.set("min", "50000");
    if (sort && sort !== "discount") p.set("sort", sort);
    if (month) p.set("month", month);
    const qs = p.toString();
    router.push(`/tours${qs ? `?${qs}` : ""}`);
  }

  return (
    <section
      className="relative min-h-[560px] flex items-center justify-center"
      style={{
        backgroundImage: `url('${BG_IMAGE}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#0f172a",
      }}
    >
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 text-center text-white px-4 w-full max-w-3xl mx-auto py-16">
        <div className="inline-flex items-center gap-2 border border-white/25 rounded-full px-4 py-1.5 text-xs text-sky-200 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          อัปเดตทัวร์ทุก 6 ชั่วโมง
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight drop-shadow-lg">
          ค้นหาทัวร์ไฟไหม้{" "}
          <span className="text-teal-300">ดีลลับราคาพิเศษ</span>
        </h1>
        <p className="text-lg text-white/75 mb-8 drop-shadow">
          รวมทัวร์ลดราคาจากบริษัทชั้นนำ อัปเดตทุก 6 ชั่วโมง
        </p>

        <form
          onSubmit={handleSearch}
          className="bg-white rounded-2xl p-3 flex flex-col sm:flex-row gap-2 shadow-2xl"
        >
          <Dropdown
            variant="light"
            options={[
              { value: "", label: "ทุกประเทศ" },
              ...COUNTRY_LIST.map((c) => ({ value: c, label: c })),
            ]}
            value={country}
            onChange={setCountry}
            placeholder="ทุกประเทศ"
            className="flex-1"
          />

          <Dropdown
            variant="light"
            options={BUDGET_OPTIONS}
            value={budget}
            onChange={setBudget}
            placeholder="งบประมาณ"
            className="flex-1"
          />

          <Dropdown
            variant="light"
            options={getMonthOptions()}
            value={month}
            onChange={setMonth}
            placeholder="ทุกเดือน"
            className="flex-1"
          />

          <Dropdown
            variant="light"
            options={SORT_OPTIONS}
            value={sort}
            onChange={setSort}
            className="flex-1"
          />

          <button
            type="submit"
            className="bg-teal-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-teal-400 transition-colors whitespace-nowrap flex items-center justify-center gap-2 shrink-0"
          >
            <SearchIcon />
            ค้นหา
          </button>
        </form>
      </div>
    </section>
  );
}
