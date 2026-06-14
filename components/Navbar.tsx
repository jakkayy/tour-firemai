import Link from "next/link";
import Logo from "./Logo";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo size={36} variant="full" />
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-zinc-600">
          <Link href="/" className="hover:text-blue-700 transition-colors">หน้าแรก</Link>
          <Link href="/#hot-deals" className="hover:text-blue-700 transition-colors">ทัวร์ยอดนิยม</Link>
          <Link href="/#newsletter" className="hover:text-blue-700 transition-colors">รับข่าวสาร</Link>
        </div>

        <Link
          href="/#hot-deals"
          className="bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-orange-600 transition-colors"
        >
          ดูทัวร์เด็ด
        </Link>
      </div>
    </nav>
  );
}
