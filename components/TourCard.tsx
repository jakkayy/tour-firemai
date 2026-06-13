import type { Tour } from "@/types/database";

type Props = {
  tour: Tour & { source_name?: string };
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

export default function TourCard({ tour }: Props) {
  const discountPct = tour.discount_percent != null ? Math.round(tour.discount_percent) : null;

  return (
    <a
      href={tour.tour_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-2xl bg-white border border-zinc-100 overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden">
        {tour.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tour.image_url}
            alt={tour.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-zinc-300">
            🌏
          </div>
        )}
        {discountPct && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
            🔥 ลด {discountPct}%
          </span>
        )}
        {tour.departure_date && (
          <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
            📅 {formatDate(tour.departure_date)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <p className="text-xs text-blue-600 font-medium">{tour.source_name ?? "ทัวร์"}</p>
        <h2 className="text-sm font-semibold text-zinc-800 line-clamp-2 leading-snug flex-1">
          {tour.title}
        </h2>

        <div className="flex items-end justify-between gap-2 pt-2 border-t border-zinc-50">
          <div>
            {tour.original_price && (
              <p className="text-xs text-zinc-400 line-through">
                ฿{formatPrice(tour.original_price)}
              </p>
            )}
            <p className="text-xl font-bold text-orange-500">
              {tour.discounted_price
                ? `฿${formatPrice(tour.discounted_price)}`
                : tour.original_price
                ? `฿${formatPrice(tour.original_price)}`
                : "ติดต่อสอบถาม"}
            </p>
          </div>
          {tour.seats_left != null && (
            <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">
              เหลือ {tour.seats_left} ที่
            </span>
          )}
        </div>

        <span className="mt-1 text-center text-xs text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 transition-colors py-2 rounded-xl">
          ดูรายละเอียด →
        </span>
      </div>
    </a>
  );
}
