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
  const discountLabel =
    tour.discount_percent != null
      ? `ลด ${Math.round(tour.discount_percent)}%`
      : null;

  return (
    <a
      href={tour.tour_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-video bg-zinc-100 overflow-hidden">
        {tour.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tour.image_url}
            alt={tour.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">
            ไม่มีรูปภาพ
          </div>
        )}
        {discountLabel && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            🔥 {discountLabel}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <p className="text-xs text-zinc-400">{tour.source_name ?? "ทัวร์"}</p>
        <h2 className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-snug">
          {tour.title}
        </h2>

        {tour.departure_date && (
          <p className="text-xs text-zinc-500">
            เดินทาง: {formatDate(tour.departure_date)}
          </p>
        )}

        <div className="mt-auto pt-2 flex items-end justify-between gap-2">
          <div>
            {tour.original_price && (
              <p className="text-xs text-zinc-400 line-through">
                ฿{formatPrice(tour.original_price)}
              </p>
            )}
            {tour.discounted_price && (
              <p className="text-lg font-bold text-red-600">
                ฿{formatPrice(tour.discounted_price)}
              </p>
            )}
          </div>
          {tour.seats_left != null && (
            <p className="text-xs text-amber-600 font-medium">
              เหลือ {tour.seats_left} ที่
            </p>
          )}
        </div>
      </div>
    </a>
  );
}
