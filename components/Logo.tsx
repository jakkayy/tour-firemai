type Props = {
  size?: number;
  variant?: "full" | "icon";
  textColor?: string;
};

function TravelIcon({ size }: { size: number }) {
  const clipId = "tci";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="43" />
        </clipPath>
      </defs>

      {/* Outer ring */}
      <circle cx="50" cy="50" r="46" fill="white" stroke="#26a69a" strokeWidth="5" />

      <g clipPath={`url(#${clipId})`}>
        {/* Sun */}
        <circle cx="50" cy="58" r="13" fill="#f5a31c" />

        {/* Left mountain */}
        <polygon points="3,90 38,33 68,90" fill="#1a8585" />

        {/* Right mountain (in front) */}
        <polygon points="26,90 63,24 95,90" fill="#26a69a" />

        {/* Ground fill */}
        <rect x="0" y="78" width="100" height="20" fill="#26a69a" />

        {/* Swoosh flight path */}
        <path
          d="M 13,46 C 6,16 64,5 76,26"
          stroke="#1a8585"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Airplane at end of swoosh, pointing upper-right */}
        <g transform="translate(76,23) rotate(45)" fill="#1a8585">
          <path d="M 0,-4.5 L 1,-2.8 L 1,0.5 L 5.5,2.5 L 5,3.5 L 1,1.5 L 1,3.5 L 2.5,5 L 1.5,5.5 L 0,4.5 L -1.5,5.5 L -2.5,5 L -1,3.5 L -1,1.5 L -5,3.5 L -5.5,2.5 L -1,0.5 L -1,-2.8 Z" />
        </g>
      </g>
    </svg>
  );
}

export default function Logo({ size = 36, variant = "full", textColor = "#1e3a8a" }: Props) {
  if (variant === "icon") return <TravelIcon size={size} />;

  return (
    <div className="flex items-center gap-2" aria-label="ทัวร์ไฟไหม้">
      <TravelIcon size={size} />
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
