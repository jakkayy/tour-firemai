import CountryFlag from "./CountryFlag";

// Stands in for a tour's picture when it has none (or it fails to load): the flag and name of the
// country, so the card still says where the tour goes instead of showing an empty grey box.
export default function ImagePlaceholder({ countries, large = false }: { countries: string[]; large?: boolean }) {
  const label = countries.slice(0, 2).join(" · ");
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-teal-50 via-sky-50 to-blue-100">
      {countries.length > 0 ? (
        <>
          <CountryFlag country={countries[0]} size={large ? 64 : 44} />
          <span className={`${large ? "text-base" : "text-sm"} font-semibold text-slate-600`}>{label}</span>
        </>
      ) : (
        <svg width={large ? 48 : 32} height={large ? 48 : 32} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      )}
      <span className="text-xs text-slate-400">ไม่มีรูปภาพ</span>
    </div>
  );
}
