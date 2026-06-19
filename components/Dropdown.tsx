"use client";

import { useState, useRef, useEffect } from "react";

export type DropdownOption = { value: string; label: string };

type Props = {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: "light" | "dark";
  className?: string;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = "เลือก...",
  variant = "light",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  const isDark = variant === "dark";

  const triggerClass = isDark
    ? "bg-white/10 border-white/20 text-white hover:bg-white/15 hover:border-white/30"
    : "bg-white border-zinc-200 text-zinc-700 hover:border-blue-400";

  const placeholderClass = isDark ? "text-white/50" : "text-zinc-400";

  const panelClass = isDark
    ? "bg-slate-900 border-slate-700 shadow-2xl"
    : "bg-white border-zinc-200 shadow-lg";

  const optionBase = "w-full text-left px-4 py-2.5 text-sm transition-colors duration-100 flex items-center gap-2";

  const optionIdle = isDark
    ? "text-slate-200 hover:bg-white/10"
    : "text-zinc-700 hover:bg-zinc-50";

  const optionActive = isDark
    ? "text-teal-300 bg-white/10 font-medium"
    : "text-blue-700 bg-blue-50 font-medium";

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-sm transition-colors outline-none ${triggerClass}`}
      >
        <span className={selected ? "" : placeholderClass}>
          {selected ? selected.label : placeholder}
        </span>
        <Chevron open={open} />
      </button>

      {/* Panel */}
      {open && (
        <div
          className={`absolute z-50 top-full mt-1.5 w-full border rounded-xl overflow-hidden ${panelClass}`}
        >
          <div className="max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`${optionBase} ${opt.value === value ? optionActive : optionIdle}`}
              >
                {opt.value === value && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
                <span className={opt.value === value ? "" : "ml-[22px]"}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
