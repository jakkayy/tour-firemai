import { supabase } from "@/lib/supabase";
import TourCard from "@/components/TourCard";
import type { Tour, Source } from "@/types/database";

type TourWithSource = Tour & { source_name: string };

async function getTours(sourceId?: string): Promise<TourWithSource[]> {
  let query = supabase
    .from("tours")
    .select("*, sources(name)")
    .eq("is_active", true)
    .order("discount_percent", { ascending: false })
    .limit(60);

  if (sourceId) {
    query = query.eq("source_id", Number(sourceId));
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row: Tour & { sources: { name: string } | null }) => ({
    ...row,
    source_name: row.sources?.name ?? "",
  }));
}

async function getSources(): Promise<Source[]> {
  const { data } = await supabase.from("sources").select("*").order("name");
  return data ?? [];
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const { source } = await searchParams;
  const [tours, sources] = await Promise.all([getTours(source), getSources()]);

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div>
            <h1 className="text-lg font-bold text-zinc-900 leading-none">
              ทัวร์ไฟไหม้
            </h1>
            <p className="text-xs text-zinc-500">ทัวร์ลดราคาก่อนวันเดินทาง</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          <FilterChip href="/" active={!source} label="ทั้งหมด" />
          {sources.map((s) => (
            <FilterChip
              key={s.id}
              href={`/?source=${s.id}`}
              active={source === String(s.id)}
              label={s.name}
            />
          ))}
        </div>

        {/* Grid */}
        {tours.length === 0 ? (
          <div className="text-center py-24 text-zinc-400">
            <p className="text-4xl mb-3">🏝️</p>
            <p>ยังไม่มีทัวร์ในขณะนี้</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-500 mb-4">
              พบ {tours.length} ทัวร์
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <a
      href={href}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-red-500 text-white"
          : "bg-white border border-zinc-200 text-zinc-600 hover:border-red-300 hover:text-red-600"
      }`}
    >
      {label}
    </a>
  );
}
