"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

export default function Navbar() {
  const pathname = usePathname();

  function navClass(href: string) {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return `px-4 py-2 text-sm font-medium transition-colors relative ${
      active
        ? "text-zinc-900 after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-teal-500 after:rounded-full"
        : "text-zinc-500 hover:text-zinc-800"
    }`;
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo size={36} variant="full" />
        </Link>

        <div className="flex items-center gap-1 text-sm">
          <Link href="/" className={navClass("/")}>หน้าแรก</Link>
          <Link href="/tours" className={navClass("/tours")}>ทัวร์ทั้งหมด</Link>
        </div>
      </div>
    </nav>
  );
}
