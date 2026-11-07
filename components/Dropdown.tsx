"use client";

import { useState, useRef, useEffect, useId, type ReactNode } from "react";

export type DropdownOption = {
  value: string;
  label: string;
  // Shown before the label, in the list and in the field
  icon?: ReactNode;
  // Extra words that find this option when searching, without being shown (e.g. a month's full name)
  keywords?: string;
};

type Props = {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: "light" | "dark";
  className?: string;
  // The field can be typed into to narrow the list, and the list used with the arrow keys,
  // so a long list needs no scrolling
  searchable?: boolean;
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

// Compare without caring about case, spaces, commas, dots, dashes or the baht sign, so that
// "20000" finds "฿20,000" and "พย" finds "พ.ย."
const fold = (text: string) => text.toLowerCase().replace(/[\s,.฿–-]/g, "");

function matches(option: DropdownOption, query: string) {
  return fold(`${option.label} ${option.keywords ?? ""}`).includes(fold(query));
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = "เลือก...",
  variant = "light",
  className = "",
  searchable = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [typed, setTyped] = useState(false); // has the person typed since opening?
  const [active, setActive] = useState(0); // highlighted row while using the keyboard
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  function close() {
    setOpen(false);
    setQuery("");
    setTyped(false);
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setTyped(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);
  // Names that start with what was typed come before names that only contain it (the sort is stable)
  const startsWith = (o: DropdownOption) => (fold(o.label).startsWith(fold(query)) ? 0 : 1);
  const shown =
    searchable && typed && query.trim()
      ? options.filter((o) => matches(o, query)).sort((a, b) => startsWith(a) - startsWith(b))
      : options;

  // Keep the highlighted row in view while moving with the arrow keys
  useEffect(() => {
    if (!open || !searchable) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, searchable]);

  function openList() {
    if (open) return;
    setQuery("");
    setTyped(false);
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function choose(option: DropdownOption) {
    onChange(option.value);
    close();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return openList();
      const last = Math.max(0, shown.length - 1);
      setActive((i) => Math.min(last, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1))));
    } else if (e.key === "Enter" && open) {
      // Picks the highlighted row instead of submitting the form; Enter on a closed field still submits
      e.preventDefault();
      const option = shown[active];
      if (option) choose(option);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      close();
    }
  }

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

  const optionHighlight = isDark ? "bg-white/10" : "bg-zinc-100";

  const fieldText = typed ? query : (selected?.label ?? "");

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      {searchable ? (
        <div
          onClick={openList}
          className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-sm transition-colors cursor-text focus-within:border-blue-400 ${triggerClass}`}
        >
          {!typed && selected?.icon}
          <input
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
            value={fieldText}
            placeholder={placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setTyped(true);
              setActive(0);
              setOpen(true);
            }}
            // Not opened on focus: tabbing through the form must not open it, or Enter would pick a row
            // instead of searching. A click, typing or the down arrow open it.
            onFocus={(e) => e.target.select()} // so typing replaces the current choice
            onKeyDown={onKeyDown}
            // 16px on phones: below that, iOS zooms the page in when the field is focused
            className={`min-w-0 flex-1 bg-transparent outline-none text-base sm:text-sm truncate ${
              isDark ? "placeholder:text-white/50" : "placeholder:text-zinc-400"
            }`}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={open ? "ปิดรายการ" : "เปิดรายการ"}
            onClick={(e) => {
              e.stopPropagation();
              if (open) close();
              else openList();
            }}
            className="shrink-0"
          >
            <Chevron open={open} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-sm transition-colors outline-none ${triggerClass}`}
        >
          <span className={`flex items-center gap-2 min-w-0 truncate ${selected ? "" : placeholderClass}`}>
            {selected?.icon}
            {selected ? selected.label : placeholder}
          </span>
          <Chevron open={open} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className={`absolute z-50 top-full mt-1.5 w-full border rounded-xl overflow-hidden ${panelClass}`}
        >
          <div
            ref={listRef}
            id={listId}
            role={searchable ? "listbox" : undefined}
            className="max-h-60 overflow-y-auto"
          >
            {shown.length === 0 && (
              <p className="px-4 py-3 text-sm text-zinc-400">ไม่พบตัวเลือกที่ตรงกัน</p>
            )}
            {shown.map((opt, index) => (
              <button
                key={opt.value}
                id={searchable ? `${listId}-${index}` : undefined}
                data-index={index}
                role={searchable ? "option" : undefined}
                aria-selected={searchable ? opt.value === value : undefined}
                type="button"
                tabIndex={searchable ? -1 : undefined}
                onMouseEnter={searchable ? () => setActive(index) : undefined}
                onClick={() => choose(opt)}
                className={`${optionBase} ${opt.value === value ? optionActive : optionIdle} ${
                  searchable && index === active && opt.value !== value ? optionHighlight : ""
                }`}
              >
                {opt.value === value && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
                <span className={`flex items-center gap-2 ${opt.value === value ? "" : "ml-[22px]"}`}>
                  {opt.icon}
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
