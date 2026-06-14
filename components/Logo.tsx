type Props = {
  size?: number;
  variant?: "full" | "icon";
  textColor?: string;
};

function FlameIcon({ size }: { size: number }) {
  return (
    <svg
      width={size * 0.9}
      height={size}
      viewBox="0 0 36 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lg-outer" x1="18" y1="38" x2="18" y2="3" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="45%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
        <linearGradient id="lg-inner" x1="18" y1="36" x2="18" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M18 3 C22 9 26 13 25 19 C24 15 27 15 27 19 C27 26 23 30 20 34 C19 36 18.5 37 18 38 C17.5 37 17 36 16 34 C13 30 9 26 9 19 C9 15 12 15 11 19 C10 13 14 9 18 3 Z"
        fill="url(#lg-outer)"
      />
      <path
        d="M18 16 C20 19 21 22 21 26 C21 31 19.5 34.5 18 38 C16.5 34.5 15 31 15 26 C15 22 16 19 18 16 Z"
        fill="url(#lg-inner)"
      />
      <ellipse cx="16" cy="28" rx="2" ry="3" fill="white" opacity="0.25" />
    </svg>
  );
}

export default function Logo({ size = 36, variant = "full", textColor = "#1e3a8a" }: Props) {
  if (variant === "icon") {
    return <FlameIcon size={size} />;
  }

  return (
    <div className="flex items-center gap-2" aria-label="ทัวร์ไฟไหม้">
      <FlameIcon size={size} />
      <span
        style={{
          color: textColor,
          fontSize: size * 0.58,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        ทัวร์ไฟไหม้
      </span>
    </div>
  );
}
