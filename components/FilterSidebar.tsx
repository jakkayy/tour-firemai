"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Dropdown from "./Dropdown";

type Params = {
  country?: string;
  min?: string;
  max?: string;
  sort?: string;
};

type Props = {
  countries: string[];
  currentParams: Params;
};

export default function FilterSidebar({ countries, currentParams }: Props) {
  const router = useRouter();
  const [country, setCountry] = useState(currentParams.country ?? "");
  const [min, setMin] = useState(currentParams.min ?? "");
  const [max, setMax] = useState(currentParams.max ?? "");
  const [sort, setSort] = useState(currentParams.sort ?? "discount");

  function buildUrl(overrides: Partial<Params>) {
    const merged = { country, min, max, sort, ...overrides };
    const p = new URLSearchParams();
    if (merged.country) p.set("country", merged.country);
    if (merged.min) p.set("min", merged.min);
    if (merged.max) p.set("max", merged.max);
    if (merged.sort && merged.sort !== "discount") p.set("sort", merged.sort);
    const qs = p.toString();
    return `/tours${qs ? `?${qs}` : ""}`;
  }

  function apply() {
    router.push(buildUrl({}));
  }

  function clear() {
    setCountry("");
    setMin("");
    setMax("");
    setSort("discount");
    router.push("/tours");
  }

  return (
    <aside className="w-56 shrink-0 hidden md:block">
      <div className="bg-white rounded-2xl p-5 shadow-sm sticky top-20">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-zinc-900">ตัวกรอง</h2>
          <button
            onClick={clear}
            className="text-xs text-teal-600 hover:underline font-medium"
          >
            ล้างทั้งหมด
          </button>
        </div>

        {/* Country */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 block">
            ประเทศปลายทาง
          </label>
          <Dropdown
            options={[
              { value: "", label: "ทุกประเทศ" },
              ...countries.map((c) => ({ value: c, label: c })),
            ]}
            value={country}
            onChange={setCountry}
            placeholder="ทุกประเทศ"
          />
        </div>

        {/* Price range */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 block">
            งบประมาณ (฿)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="ต่ำสุด"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <input
              type="number"
              placeholder="สูงสุด"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 block">
            เรียงตาม
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
          className="w-full bg-blue-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors"
        >
          ค้นหา
        </button>
      </div>
    </aside>
  );
}
