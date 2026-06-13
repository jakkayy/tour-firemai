export default function NewsletterSection() {
  return (
    <section id="newsletter" className="bg-blue-900 py-16">
      <div className="max-w-2xl mx-auto px-4 text-center text-white">
        <p className="text-4xl mb-4">📬</p>
        <h2 className="text-3xl font-bold mb-3">ไม่พลาดโปรเด็ด!</h2>
        <p className="text-blue-200 mb-8">
          รับการแจ้งเตือนทัวร์ไฟไหม้ราคาพิเศษก่อนใคร ส่งตรงถึงอีเมลคุณ
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="อีเมลของคุณ"
            className="flex-1 px-4 py-3 rounded-xl text-zinc-900 text-sm outline-none"
          />
          <button className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors whitespace-nowrap">
            สมัครรับข่าวสาร
          </button>
        </div>
        <p className="text-xs text-blue-300 mt-4">ยกเลิกได้ทุกเมื่อ ไม่มีสแปม</p>
      </div>
    </section>
  );
}
