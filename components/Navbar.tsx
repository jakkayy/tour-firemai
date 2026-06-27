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
          <Link href="/tours" className="hover:text-blue-700 transition-colors">ทัวร์ทั้งหมด</Link>
        </div>
      </div>
    </nav>
  );
}
