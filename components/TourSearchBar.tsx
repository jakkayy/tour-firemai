"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

// How long after the last keystroke the results follow what was typed
const TYPING_PAUSE_MS = 350;

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

// Results update as you type, and the button still searches straight away.
export default function TourSearchBar({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const [text, setText] = useState(initialQ);
  const [focused, setFocused] = useState(false);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const composing = useRef(false); // part-way through composing a character on a phone keyboard

  // The URL changed on its own (back button, "clear all filters"): show it in the box. Never while the
  // person is typing: a result for something they typed a moment ago can arrive after they typed more,
  // and it must not eat the letters.
  const [seenInitial, setSeenInitial] = useState(initialQ);
  if (initialQ !== seenInitial) {
    setSeenInitial(initialQ);
    if (!focused) setText(initialQ);
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function apply(value: string, mode: "replace" | "push") {
    const search = value.trim();
    const params = new URLSearchParams(window.location.search); // read now: the filters may have changed since
    if ((params.get("q") ?? "") === search) return; // the results already match
    if (search) params.set("q", search);
    else params.delete("q");
    params.delete("page");
    // "replace" while typing so the back button isn't buried in one entry per pause
    startTransition(() => router[mode](`/tours?${params.toString()}`, { scroll: false }));
  }

  function schedule(value: string) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => apply(value, "replace"), TYPING_PAUSE_MS);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (timer.current) clearTimeout(timer.current);
    apply(text, "push");
  }

  return (
    <form onSubmit={handleSubmit} role="search" aria-busy={pending} className="flex gap-2 mb-6">
      <div className="relative flex-1">
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (!composing.current) schedule(e.target.value);
          }}
          onCompositionStart={() => { composing.current = true; }}
          onCompositionEnd={(e) => {
            composing.current = false;
            schedule(e.currentTarget.value);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="ค้นหาชื่อทัวร์ เช่น ญี่ปุ่น โอซาก้า ฮ่องกง..."
          autoComplete="off"
          // 16px on phones: below that, iOS zooms the page in when the field is focused
          className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 pr-10 text-base sm:text-sm outline-none focus:border-teal-400 bg-white shadow-sm"
        />
        {pending && (
          <span
            aria-hidden="true"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-teal-500 border-t-transparent animate-spin"
          />
        )}
      </div>
      <button
        type="submit"
        className="bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors flex items-center gap-2 shrink-0"
      >
        <SearchIcon />
        ค้นหา
      </button>
    </form>
  );
}
