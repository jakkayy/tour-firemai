import type { PriceHistory as PriceHistoryRow } from "@/types/database";

type Props = {
  history: PriceHistoryRow[];
  // When the scraper last saw this tour; the chart runs up to here.
  asOf: string;
};

const W = 300;
const H = 90;
const PAD_X = 6;
const PAD_Y = 10;

function formatPrice(price: number) {
  return price.toLocaleString("th-TH");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH-u-nu-latn", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "Asia/Bangkok",
  });
}

// Price changes are held until the next change, so draw them as a step line
// that runs on to `now` at the latest price.
function buildPath(points: { t: number; price: number }[], now: number, min: number, max: number) {
  const start = points[0].t;
  const span = Math.max(now - start, 1);
  const range = max - min;
  const x = (t: number) => PAD_X + ((t - start) / span) * (W - PAD_X * 2);
  const y = (p: number) => (range === 0 ? H / 2 : PAD_Y + (1 - (p - min) / range) * (H - PAD_Y * 2));

  let d = `M ${x(points[0].t)} ${y(points[0].price)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` H ${x(points[i].t)} V ${y(points[i].price)}`;
  }
  d += ` H ${x(now)}`;
  return d;
}

export default function PriceHistory({ history, asOf }: Props) {
  const points = history
    .filter((h): h is PriceHistoryRow & { discounted_price: number } => h.discounted_price != null)
    .map((h) => ({ t: new Date(h.recorded_at).getTime(), price: Number(h.discounted_price), at: h.recorded_at }));

  if (points.length === 0) return null;

  const first = points[0];
  const current = points[points.length - 1].price;

  // Only one data point so far: nothing to chart yet.
  if (points.length === 1) {
    return (
      <p className="text-xs text-zinc-400 mb-6">
        เริ่มติดตามราคาเมื่อ {formatDate(first.at)} · ยังไม่มีการเปลี่ยนแปลงราคา
      </p>
    );
  }

  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const isLowest = current === min && min !== max;
  const path = buildPath(points, Math.max(new Date(asOf).getTime(), points[points.length - 1].t), min, max);

  return (
    <div className="bg-zinc-50 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-sm font-semibold text-zinc-800">ประวัติราคา</p>
        {isLowest && (
          <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 rounded-full px-2.5 py-0.5">
            ราคาต่ำสุดที่เคยพบ
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-24 text-teal-500"
        role="img"
        aria-label={`กราฟราคาตั้งแต่ ${formatDate(first.at)} ราคาต่ำสุด ${formatPrice(min)} บาท สูงสุด ${formatPrice(max)} บาท`}
      >
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div>
          <p className="text-xs text-zinc-400">ต่ำสุด</p>
          <p className="text-sm font-semibold text-teal-600">฿{formatPrice(min)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">สูงสุด</p>
          <p className="text-sm font-semibold text-zinc-700">฿{formatPrice(max)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">เริ่มติดตาม</p>
          <p className="text-sm font-semibold text-zinc-700">{formatDate(first.at)}</p>
        </div>
      </div>
    </div>
  );
}
