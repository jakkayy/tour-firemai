type Props = {
  size?: number;
  variant?: "full" | "icon";
  textColor?: string;
};

export default function Logo({ size = 36, variant = "full", textColor = "#1e3a8a" }: Props) {
  const h = size;
  const w = variant === "full" ? size * 4.2 : size * 0.9;

  return (
    <svg
      width={w}
      height={h}
      viewBox={variant === "full" ? "0 0 168 40" : "0 0 36 40"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ทัวร์ไฟไหม้"
    >
      <defs>
        {/* Outer flame gradient — hot yellow at base, deep red at tip */}
        <linearGradient id="lg-outer" x1="18" y1="38" x2="18" y2="3" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="45%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
        {/* Inner glow — bright core */}
        <linearGradient id="lg-inner" x1="18" y1="36" x2="18" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ── Flame icon ── */}
      {/*
        Design: flame that tapers to a teardrop point at the bottom,
        evoking a map location pin — "fire at this destination".
        Left side has a small curl inward for realism.
      */}
      <g>
        {/* Outer flame body */}
        <path
          d="
            M18 3
            C22 9 26 13 25 19
            C24 15 27 15 27 19
            C27 26 23 30 20 34
            C19 36 18.5 37 18 38
            C17.5 37 17 36 16 34
            C13 30 9 26 9 19
            C9 15 12 15 11 19
            C10 13 14 9 18 3
            Z
          "
          fill="url(#lg-outer)"
        />
        {/* Inner bright core */}
        <path
          d="
            M18 16
            C20 19 21 22 21 26
            C21 31 19.5 34.5 18 38
            C16.5 34.5 15 31 15 26
            C15 22 16 19 18 16
            Z
          "
          fill="url(#lg-inner)"
        />
        {/* Specular highlight — tiny bright dot near base */}
        <ellipse cx="16" cy="28" rx="2" ry="3" fill="white" opacity="0.25" />
      </g>

      {/* ── Wordmark (only in "full" variant) ── */}
      {variant === "full" && (
        <text
          x="44"
          y="29"
          fontFamily="'Geist', 'Noto Sans Thai', sans-serif"
          fontSize="22"
          fontWeight="700"
          fill={textColor}
          letterSpacing="-0.5"
        >
          ทัวร์ไฟไหม้
        </text>
      )}
    </svg>
  );
}
