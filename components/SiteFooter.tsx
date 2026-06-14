import Link from "next/link";
import Logo from "./Logo";

export default function SiteFooter() {
  return (
    <footer className="bg-zinc-900 text-zinc-400 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="mb-3">
              <Logo size={32} variant="full" textColor="#ffffff" />
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
              รวมทัวร์ลดราคาก่อนวันเดินทาง ดึงข้อมูลอัตโนมัติจากเว็บทัวร์ชั้นนำ
            </p>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3">ปลายทางยอดนิยม</h4>
            <div className="flex flex-col gap-2 text-sm">
              {["จีน", "ญี่ปุ่น", "เกาหลี", "เวียดนาม", "ยุโรป"].map((c) => (
                <Link key={c} href={`/?country=${c}`} className="hover:text-white transition-colors">
                  ทัวร์{c}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3">แหล่งข้อมูล</h4>
            <div className="flex flex-col gap-2 text-sm">
              <span>TravelZeed</span>
              <span>ThaiFly</span>
              <span>และเว็บทัวร์อื่นๆ</span>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <p>© 2026 ทัวร์ไฟไหม้ · รวบรวมข้อมูลจากเว็บทัวร์ชั้นนำ ราคาอาจเปลี่ยนแปลงได้</p>
          <p>อัปเดตล่าสุดทุก 6 ชั่วโมง</p>
        </div>
      </div>
    </footer>
  );
}
