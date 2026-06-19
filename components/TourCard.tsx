import type { Tour } from "@/types/database";

type Props = {
  tour: Tour & { source_name?: string };
  priority?: boolean;
};

function formatPrice(price: number | null) {
  if (price == null) return null;
  return price.toLocaleString("th-TH");
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

export default function TourCard({ tour, priority = false }: Props) {
  const discountPct = tour.discount_percent != null ? Math.round(tour.discount_percent) : null;
  const price = tour.discounted_price ?? tour.original_price;

  return (
    <a
      href={tour.tour_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-2xl bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden">
        {tour.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tour.image_url}
            alt={tour.title}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-100">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4d4d8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Discount badge */}
        {discountPct && (
          <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            ลด {discountPct}%
          </span>
        )}

        {/* Date */}
        {tour.departure_date && (
          <span className="absolute bottom-3 left-3 text-white text-xs font-medium bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
            {formatDate(tour.departure_date)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <p className="text-xs font-medium text-blue-600 mb-1">{tour.source_name ?? "ทัวร์"}</p>
        <h2 className="text-sm font-semibold text-zinc-800 line-clamp-2 leading-snug flex-1 mb-3">
          {tour.title}
        </h2>

        <div className="flex items-end justify-between gap-2">
          <div>
            {tour.original_price && tour.discounted_price && (
              <p className="text-xs text-zinc-400 line-through">
                ฿{formatPrice(tour.original_price)}
              </p>
            )}
            <p className="text-xl font-bold text-orange-500">
              {price ? `฿${formatPrice(price)}` : "ติดต่อสอบถาม"}
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-blue-800 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-xl group-hover:bg-blue-100 transition-colors">
            ดูทัวร์ ↗
          </span>
        </div>
      </div>
    </a>
  );
}
