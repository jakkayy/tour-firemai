import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-8xl font-bold text-zinc-200 mb-4">404</p>
          <h1 className="text-xl font-semibold text-zinc-800 mb-2">ไม่พบหน้าที่ต้องการ</h1>
          <p className="text-sm text-zinc-500 mb-6">หน้าที่คุณกำลังมองหาอาจถูกย้ายหรือไม่มีอยู่</p>
          <Link
            href="/"
            className="bg-teal-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-400 transition-colors"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    </>
  );
}
