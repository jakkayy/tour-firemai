"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Dropdown from "./Dropdown";

type Params = {
  countries?: string;
  min?: string;
  max?: string;
  sort?: string;
};

type Props = {
  countries: string[];
  currentParams: Params;
};

function FilterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export default function FilterSidebar({ countries, currentParams }: Props) {
  const router = useRouter();

  const initialSelected = currentParams.countries
    ? currentParams.countries.split(",").filter(Boolean)
    : [];

  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [min, setMin] = useState(currentParams.min ?? "");
  const [max, setMax] = useState(currentParams.max ?? "");
  const [sort, setSort] = useState(currentParams.sort ?? "discount");

  function toggleCountry(c: string) {
    setSelected((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function buildUrl() {
    const p = new URLSearchParams();
    if (selected.length > 0) p.set("countries", selected.join(","));
    if (min) p.set("min", min);
    if (max) p.set("max", max);
    if (sort && sort !== "discount") p.set("sort", sort);
    const qs = p.toString();
    return `/tours${qs ? `?${qs}` : ""}`;
  }

  function apply() {
    router.push(buildUrl());
  }

  function clear() {
    setSelected([]);
    setMin("");
    setMax("");
    setSort("discount");
    router.push("/tours");
  }

  return (
    <aside className="w-64 shrink-0 hidden md:block">
      <div className="bg-white rounded-2xl p-5 shadow-sm sticky top-20">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-teal-600"><FilterIcon /></span>
          <h2 className="font-semibold text-zinc-900">ตัวกรองขั้นสูง</h2>
        </div>

        {/* Country checkboxes */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              จุดหมายปลายทาง
            </label>
            {selected.length > 0 && (
              <button
                onClick={() => setSelected([])}
                className="text-xs text-teal-600 hover:text-teal-500 font-medium"
              >
                ล้าง ({selected.length})
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
            {countries.map((c) => (
              <label
                key={c}
                className="flex items-center gap-2.5 cursor-pointer group py-0.5"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(c)}
                  onChange={() => toggleCountry(c)}
                  className="w-4 h-4 rounded border-zinc-300 accent-teal-500 cursor-pointer"
                />
                <span className="text-sm text-zinc-700 group-hover:text-zinc-900 transition-colors">
                  {c}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Price range */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2.5 block">
            ช่วงราคา (฿)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="ต่ำสุด"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-400"
            />
            <input
              type="number"
              placeholder="สูงสุด"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-400"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2.5 block">
            เรียงลำดับตาม
          </label>
          <Dropdown
            options={[
              { value: "discount", label: "ส่วนลดสูงสุด" },
              { value: "price_asc", label: "ราคา: น้อย → มาก" },
              { value: "price_desc", label: "ราคา: มาก → น้อย" },
              { value: "date", label: "วันเดินทางใกล้สุด" },
            ]}
            value={sort}
            onChange={setSort}
          />
        </div>

        <button
          onClick={apply}
          className="w-full bg-slate-800 text-white py-3 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
        >
          <SearchIcon />
          ค้นหาทัวร์
        </button>

        <button
          onClick={clear}
          className="w-full mt-2 text-xs text-zinc-400 hover:text-zinc-600 transition-colors py-1.5"
        >
          ล้างตัวกรองทั้งหมด
        </button>
      </div>
    </aside>
  );
}
