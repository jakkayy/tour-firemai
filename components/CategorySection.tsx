import Link from "next/link";

const categories = [
  {
    label: "ทัวร์ทะเล",
    emoji: "🏖️",
    gradient: "from-cyan-500 to-blue-600",
    country: "ไทย",
    desc: "ทะเลใต้ เกาะสวยงาม",
  },
  {
    label: "ทัวร์ญี่ปุ่น",
    emoji: "🗻",
    gradient: "from-pink-500 to-rose-600",
    country: "ญี่ปุ่น",
    desc: "ซากุระ ฟูจิ โตเกียว",
  },
  {
    label: "ทัวร์จีน",
    emoji: "🏯",
    gradient: "from-red-500 to-orange-600",
    country: "จีน",
    desc: "กำแพงเมืองจีน ฉางเซี่ยง",
  },
  {
    label: "ทัวร์ยุโรป",
    emoji: "🗼",
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
          {categories.map((cat) => (
            <Link
              key={cat.label}
              href={`/?country=${encodeURIComponent(cat.country)}#hot-deals`}
              className={`relative bg-gradient-to-br ${cat.gradient} rounded-2xl p-6 text-white overflow-hidden group hover:scale-[1.02] transition-transform`}
            >
              <div className="absolute -bottom-4 -right-4 text-7xl opacity-20 group-hover:opacity-30 transition-opacity">
                {cat.emoji}
              </div>
              <p className="text-4xl mb-3">{cat.emoji}</p>
              <h3 className="font-bold text-lg">{cat.label}</h3>
              <p className="text-sm text-white/80">{cat.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
