import Link from "next/link";

function IconWaves() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 17c1.5-1.5 3-2 4.5-2s3 .5 4.5 2 3 2 4.5 2 3-.5 4.5-2" />
      <path d="M2 11c1.5-1.5 3-2 4.5-2s3 .5 4.5 2 3 2 4.5 2 3-.5 4.5-2" />
      <path d="M2 5c1.5-1.5 3-2 4.5-2s3 .5 4.5 2 3 2 4.5 2 3-.5 4.5-2" />
    </svg>
  );
}

function IconMountain() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21l4-8 4 8" />
      <path d="M3 21l6.5-13 3 5" />
      <path d="M21 21l-6.5-13-1.5 3" />
    </svg>
  );
}

function IconPagoda() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L9 7h6L12 2z" />
      <rect x="7" y="7" width="10" height="3" />
      <path d="M5 10l-1 1h16l-1-1" />
      <rect x="5" y="11" width="14" height="3" />
      <path d="M3 14l-1 1h20l-1-1" />
      <rect x="3" y="15" width="18" height="4" />
      <line x1="3" y1="19" x2="21" y2="19" />
    </svg>
  );
}

function IconTower() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L10 9h4L12 3z" />
      <path d="M8 9L6 15h12L16 9" />
      <path d="M4 15L3 21h18l-1-6" />
      <line x1="10" y1="15" x2="10" y2="21" />
      <line x1="14" y1="15" x2="14" y2="21" />
    </svg>
  );
}

const categories = [
  {
    Icon: IconWaves,
    label: "ทัวร์ทะเล",
    gradient: "from-cyan-500 to-blue-600",
    country: "ไทย",
    desc: "ทะเลใต้ เกาะสวยงาม",
  },
  {
    Icon: IconMountain,
    label: "ทัวร์ญี่ปุ่น",
    gradient: "from-pink-500 to-rose-600",
    country: "ญี่ปุ่น",
    desc: "ซากุระ ฟูจิ โตเกียว",
  },
  {
    Icon: IconPagoda,
    label: "ทัวร์จีน",
    gradient: "from-red-500 to-orange-600",
    country: "จีน",
    desc: "กำแพงเมืองจีน ฉางซา",
  },
  {
    Icon: IconTower,
    label: "ทัวร์ยุโรป",
    gradient: "from-purple-600 to-indigo-700",
    country: "ยุโรป",
    desc: "ปารีส ลอนดอน โรม",
  },
];

export default function CategorySection() {
  return (
    <section className="bg-zinc-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">เลือกตามปลายทาง</h2>
          <p className="text-zinc-500">ค้นพบทัวร์ไฟไหม้ตามประเทศที่คุณใฝ่ฝัน</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(({ Icon, label, gradient, country, desc }) => (
            <Link
              key={label}
              href={`/?country=${encodeURIComponent(country)}#hot-deals`}
              className={`relative bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white overflow-hidden group hover:scale-[1.02] transition-transform`}
            >
              <div className="mb-4 opacity-90">
                <Icon />
              </div>
              <h3 className="font-bold text-lg">{label}</h3>
              <p className="text-sm text-white/80">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
