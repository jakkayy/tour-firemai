import Link from "next/link";

type Props = {
  currentPage: number;
  totalPages: number;
  params: Record<string, string | undefined>;
};

function buildUrl(page: number, params: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  if (params.country) p.set("country", params.country);
  if (params.min) p.set("min", params.min);
  if (params.max) p.set("max", params.max);
  if (params.sort) p.set("sort", params.sort);
  p.set("page", String(page));
  return `/tours?${p.toString()}`;
}

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const nums: (number | "…")[] = [1];
  if (current > 3) nums.push("…");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    nums.push(i);
  }
  if (current < total - 2) nums.push("…");
  nums.push(total);
  return nums;
}

export default function Pagination({ currentPage, totalPages, params }: Props) {
  const pages = pageNumbers(currentPage, totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5 mt-12">
      {currentPage > 1 && (
        <Link
          href={buildUrl(currentPage - 1, params)}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-blue-400 hover:text-blue-700 text-sm transition-colors"
        >
          ‹
        </Link>
      )}

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`dot-${i}`}
            className="w-9 h-9 flex items-center justify-center text-zinc-400 text-sm"
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildUrl(Number(p), params)}
            className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
              p === currentPage
                ? "bg-blue-900 text-white"
                : "border border-zinc-200 text-zinc-600 hover:border-blue-400 hover:text-blue-700"
            }`}
          >
            {p}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={buildUrl(currentPage + 1, params)}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-blue-400 hover:text-blue-700 text-sm transition-colors"
        >
          ›
        </Link>
      )}
    </div>
  );
}
