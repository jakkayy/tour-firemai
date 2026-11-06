"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFavorites } from "@/lib/favorites";
import Logo from "./Logo";
import LineAddFriend from "./LineAddFriend";

export default function Navbar() {
  const pathname = usePathname();
  const { ids } = useFavorites();

  function navClass(href: string) {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return `px-2.5 sm:px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors relative ${
      active
        ? "text-zinc-900 after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-teal-500 after:rounded-full"
        : "text-zinc-500 hover:text-zinc-800"
    }`;
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center shrink-0">
          <Logo size={36} variant="full" />
        </Link>

        <div className="flex items-center gap-1 text-sm">
          {/* The logo already links home, so phones drop this to leave room for the LINE button */}
          <Link href="/" className={`${navClass("/")} hidden sm:block`}>หน้าแรก</Link>
          <Link href="/tours" className={navClass("/tours")}>ทัวร์ทั้งหมด</Link>
          <Link href="/favorites" className={navClass("/favorites")} aria-label="รายการโปรด">
            <svg className="sm:hidden inline" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="hidden sm:inline">รายการโปรด</span>
            {ids.length > 0 && (
              <span className="ml-1.5 inline-flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                {ids.length}
              </span>
            )}
          </Link>
          <LineAddFriend variant="nav" className="ml-1 sm:ml-2" />
        </div>
      </div>
    </nav>
  );
}
