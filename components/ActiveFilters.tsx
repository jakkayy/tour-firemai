import Link from "next/link";

type Params = {
  countries?: string;
  min?: string;
  max?: string;
  sort?: string;
  month?: string;
  q?: string;
  within?: string;
};

const SORT_LABELS: Record<string, string> = {
  price_asc: "ราคา: น้อย → มาก",
  price_desc: "ราคา: มาก → น้อย",
  date: "วันเดินทางใกล้สุด",
};

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function monthLabel(value: string): string {
  const [y, m] = value.split("-").map(Number);
  return `${THAI_MONTHS[m - 1] ?? ""} ${String(y + 543).slice(-2)}`;
}

// The filters in effect as removable chips, so it is clear what is narrowing the list and each one
// can be dropped with a single tap. Plain links: no client state needed.
export default function ActiveFilters({ params }: { params: Params }) {
  const hrefWithout = (...keys: (keyof Params)[]) => {
    const p = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && key !== "page" && !(keys as string[]).includes(key)) p.set(key, value);
    }
    const qs = p.toString();
    return `/tours${qs ? `?${qs}` : ""}`;
  };

  const chips: { key: string; label: string; href: string }[] = [];

  const countries = params.countries ? params.countries.split(",").filter(Boolean) : [];
  for (const country of countries) {
    const rest = countries.filter((c) => c !== country);
    const p = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && key !== "page" && key !== "countries") p.set(key, value);
    }
    if (rest.length > 0) p.set("countries", rest.join(","));
    const qs = p.toString();
    chips.push({ key: `c-${country}`, label: country, href: `/tours${qs ? `?${qs}` : ""}` });
  }
  if (params.q) chips.push({ key: "q", label: `ค้นหา: ${params.q}`, href: hrefWithout("q") });
  if (params.within) chips.push({ key: "within", label: `ภายใน ${params.within} วัน`, href: hrefWithout("within") });
  if (params.month && /^\d{4}-\d{2}$/.test(params.month)) {
    chips.push({ key: "month", label: `เดินทาง ${monthLabel(params.month)}`, href: hrefWithout("month") });
  }
  if (params.min || params.max) {
    const label =
      params.min && params.max
        ? `฿${Number(params.min).toLocaleString("th-TH")} – ฿${Number(params.max).toLocaleString("th-TH")}`
        : params.min
          ? `ตั้งแต่ ฿${Number(params.min).toLocaleString("th-TH")}`
          : `ไม่เกิน ฿${Number(params.max).toLocaleString("th-TH")}`;
    chips.push({ key: "price", label, href: hrefWithout("min", "max") });
  }
  if (params.sort && SORT_LABELS[params.sort]) {
    chips.push({ key: "sort", label: SORT_LABELS[params.sort], href: hrefWithout("sort") });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          aria-label={`ลบตัวกรอง ${chip.label}`}
          className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-100 text-xs font-medium rounded-full pl-3 pr-2 py-1 hover:bg-teal-100 transition-colors"
        >
          {chip.label}
          <span aria-hidden className="text-teal-500">✕</span>
        </Link>
      ))}
      <Link href="/tours" className="text-xs text-zinc-400 hover:text-zinc-600 underline underline-offset-2 ml-1">
        ล้างทั้งหมด
      </Link>
    </div>
  );
}
