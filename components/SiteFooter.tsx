const SOURCES = [
  { name: "TravelZeed Fire", url: "https://www.travelzeed.com/fire" },
  { name: "Uni Thai Travel", url: "https://www.unithaitravel.com/th/trip-tourfiremai.php" },
  { name: "Mushroom Travel", url: "https://www.mushroomtravel.com/tour/promotion" },
  { name: "Thai Fly", url: "https://thaifly.com/service/hot-deal" },
  { name: "Quality Express", url: "https://www.qualityexpress.co.th" },
  { name: "Navarich Travel", url: "https://www.navarichtravel.com/faimai" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-zinc-900 text-zinc-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

          {/* About */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">ทัวร์ไฟไหม้</p>
            <p className="text-xs leading-relaxed">
              รวมทัวร์ที่ใกล้วันเดินทางแต่ที่นั่งยังไม่เต็ม
              บริษัทลดราคาเพื่อเติมที่นั่ง อัปเดตทุก 6 ชั่วโมง
            </p>
            <p className="text-xs mt-3 text-zinc-500">
              ราคาและโปรโมชันอาจเปลี่ยนแปลงได้ กรุณายืนยันกับเว็บต้นทางก่อนจอง
            </p>
          </div>

          {/* Sources */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">แหล่งข้อมูล</p>
            <ul className="space-y-1.5">
              {SOURCES.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs hover:text-teal-400 transition-colors"
                  >
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">เมนู</p>
            <ul className="space-y-1.5">
              <li><a href="/" className="text-xs hover:text-teal-400 transition-colors">หน้าแรก</a></li>
              <li><a href="/tours" className="text-xs hover:text-teal-400 transition-colors">ทัวร์ทั้งหมด</a></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-zinc-800 mt-8 pt-6 text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} ทัวร์ไฟไหม้ · ข้อมูลดึงจากเว็บทัวร์ชั้นนำ ไม่ใช่บริษัททัวร์
        </div>
      </div>
    </footer>
  );
}
