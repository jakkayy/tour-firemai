function IconPrice() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v2m0 8v2M9 9h4.5a1.5 1.5 0 010 3H10a1.5 1.5 0 000 3H14" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L4.5 13.5H12L11 22l8.5-11.5H12L13 2z" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  );
}

const features = [
  {
    Icon: IconPrice,
    title: "ราคาโปร่งใส",
    desc: "เห็นราคาต้นทาง ราคาลด และส่วนลดชัดเจน ไม่มีค่าธรรมเนียมซ่อน",
  },
  {
    Icon: IconBolt,
    title: "อัปเดตอัตโนมัติ",
    desc: "ดึงข้อมูลจากเว็บทัวร์ชั้นนำทุก 6 ชั่วโมง ไม่พลาดโปรเด็ด",
  },
  {
    Icon: IconGlobe,
    title: "หลายปลายทาง",
    desc: "ครอบคลุมทัวร์ทั้งในไทยและต่างประเทศกว่า 20 ประเทศ",
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map(({ Icon, title, desc }) => (
            <div key={title} className="text-center group">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                <Icon />
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">{title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
