const features = [
  {
    icon: "💎",
    title: "ราคาโปร่งใส",
    desc: "เห็นราคาต้นทาง ราคาลด และส่วนลดชัดเจน ไม่มีค่าธรรมเนียมซ่อน",
  },
  {
    icon: "⚡",
    title: "อัปเดตอัตโนมัติ",
    desc: "ดึงข้อมูลจากเว็บทัวร์ชั้นนำทุก 6 ชั่วโมง ไม่พลาดโปรเด็ด",
  },
  {
    icon: "🌏",
    title: "หลายปลายทาง",
    desc: "ครอบคลุมทัวร์ทั้งในไทยและต่างประเทศกว่า 20 ประเทศ",
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="text-center group">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                {f.icon}
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
