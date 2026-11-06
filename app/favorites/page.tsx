import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import FavoritesList from "@/components/FavoritesList";
import LineAddFriend from "@/components/LineAddFriend";

export const metadata: Metadata = {
  title: "รายการโปรด | ทัวร์ไฟไหม้",
  description: "ทัวร์ไฟไหม้ที่คุณบันทึกไว้",
  robots: { index: false },
};

export default function FavoritesPage() {
  return (
    <>
      <Navbar />
      <div className="bg-zinc-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="mb-7">
            <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-4">
              <Link href="/" className="hover:text-zinc-600 transition-colors">หน้าแรก</Link>
              <span>/</span>
              <span className="text-teal-600 font-medium">รายการโปรด</span>
            </nav>
            <h1 className="text-3xl font-bold text-zinc-900">รายการโปรด</h1>
            <p className="text-zinc-500 text-sm mt-1">บันทึกไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น</p>
          </div>
          <FavoritesList />
          <LineAddFriend className="mt-12" />
        </div>
      </div>
    </>
  );
}
