import Image from "next/image";
import { COUNTRY_CODES } from "@/lib/countries";

// Decorative: the country's name is always printed next to the flag, so it has no alt text.
// `unoptimized` serves the SVG from public/flags as it is, without the image optimiser.
export default function CountryFlag({ country, size = 20 }: { country: string; size?: number }) {
  const code = COUNTRY_CODES[country];
  if (!code) return null;
  return (
    <Image
      src={`/flags/${code}.svg`}
      alt=""
      width={size}
      height={Math.round((size * 3) / 4)}
      unoptimized
      className="shrink-0 rounded-[2px] ring-1 ring-black/10"
    />
  );
}
