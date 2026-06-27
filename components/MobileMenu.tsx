"use client";

import { useState } from "react";
import Link from "next/link";

function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 transition-colors"
        aria-label="เมนู"
      >
        <MenuIcon open={open} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-lg border border-zinc-100 overflow-hidden z-50">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              หน้าแรก
            </Link>
            <Link
              href="/tours"
              onClick={() => setOpen(false)}
              className="flex items-center px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors border-t border-zinc-100"
            >
              ทัวร์ทั้งหมด
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
