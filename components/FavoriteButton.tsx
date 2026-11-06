"use client";

import { useFavorites } from "@/lib/favorites";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

type Props = {
  tourId: number;
  // "icon": round overlay button for cards. "full": labelled button for the detail page.
  variant?: "icon" | "full";
};

export default function FavoriteButton({ tourId, variant = "icon" }: Props) {
  const { ids, toggle } = useFavorites();
  const saved = ids.includes(tourId);
  const label = saved ? "นำออกจากรายการโปรด" : "บันทึกเป็นรายการโปรด";

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={() => toggle(tourId)}
        aria-pressed={saved}
        className={`inline-flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold border transition-colors ${
          saved
            ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
            : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
        }`}
      >
        <HeartIcon filled={saved} />
        {saved ? "บันทึกไว้แล้ว" : "บันทึกเป็นรายการโปรด"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(tourId)}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm transition-colors ${
        saved ? "bg-white text-red-500" : "bg-white/80 text-zinc-500 hover:bg-white hover:text-red-500"
      }`}
    >
      <HeartIcon filled={saved} />
    </button>
  );
}
