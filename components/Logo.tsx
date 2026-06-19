type Props = {
  size?: number;
  variant?: "full" | "icon";
  textColor?: string;
};

let _uid = 0;

function PinIcon({ size }: { size: number }) {
  const id = ++_uid;
  const grad = `pin-grad-${id}`;
  const shine = `pin-shine-${id}`;

  return (
    <svg
      width={size * 0.82}
      height={size}
      viewBox="0 0 36 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={grad} x1="18" y1="2" x2="18" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="55%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <radialGradient id={shine} cx="35%" cy="28%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.35" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Pin body */}
      <path
        d="M18 2 C9.163 2 2 9.163 2 18 C2 29 18 44 18 44 C18 44 34 29 34 18 C34 9.163 26.837 2 18 2 Z"
        fill={`url(#${grad})`}
      />

      {/* Shine overlay */}
      <path
        d="M18 2 C9.163 2 2 9.163 2 18 C2 29 18 44 18 44 C18 44 34 29 34 18 C34 9.163 26.837 2 18 2 Z"
        fill={`url(#${shine})`}
      />

      {/* Inner ring */}
      <circle cx="18" cy="17" r="8" fill="white" opacity="0.15" />

      {/* Center dot */}
      <circle cx="18" cy="17" r="4" fill="white" opacity="0.85" />

      {/* Tiny plane silhouette inside dot */}
      <path
        d="M18 14.5 L20.5 17 L18 16.5 L15.5 17 Z"
        fill="#1d4ed8"
        opacity="0.7"
      />
    </svg>
  );
}

export default function Logo({ size = 36, variant = "full", textColor = "#1e3a8a" }: Props) {
  if (variant === "icon") return <PinIcon size={size} />;

  return (
    <div className="flex items-center gap-2" aria-label="ทัวร์ไฟไหม้">
      <PinIcon size={size} />
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
