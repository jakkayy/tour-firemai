import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import LineAddFriend from "@/components/LineAddFriend";
import CookieSettingsButton from "@/components/CookieSettingsButton";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว | ทัวร์ไฟไหม้",
  description: "ข้อมูลที่เว็บไซต์ทัวร์ไฟไหม้เก็บ ใช้ทำอะไร และวิธีควบคุมข้อมูลของคุณ",
};

const UPDATED = "7 พฤศจิกายน 2569";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-zinc-900 mb-2">{title}</h2>
      <div className="text-sm text-zinc-600 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="bg-zinc-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">นโยบายความเป็นส่วนตัว</h1>
          <p className="text-xs text-zinc-400 mb-8">ปรับปรุงล่าสุด {UPDATED}</p>

          <Section title="สรุปสั้น ๆ">
            <p>
              ทัวร์ไฟไหม้ไม่มีระบบสมัครสมาชิก ไม่ขอชื่อ เบอร์โทร หรืออีเมลของคุณ และไม่ขายข้อมูลให้ใคร
              ข้อมูลที่เกี่ยวกับตัวคุณมีเพียงสถิติการใช้งานที่เก็บเมื่อคุณยอมรับ และรายการโปรดที่เก็บไว้ในเครื่องของคุณเอง
            </p>
          </Section>

          <Section title="ข้อมูลที่เราเก็บและวิธีใช้">
            <p>
              <span className="font-medium text-zinc-800">1. สถิติการใช้งานแบบวัดผลรวม (Vercel Web Analytics)</span>{" "}
              นับจำนวนผู้เข้าชมและหน้าที่เปิด ไม่ใช้คุกกี้และไม่ระบุตัวตนรายบุคคล ใช้เพื่อดูว่าเว็บมีคนใช้มากน้อยแค่ไหน
            </p>
            <p>
              <span className="font-medium text-zinc-800">2. คุกกี้วิเคราะห์การใช้งาน (Microsoft Clarity)</span>{" "}
              บันทึกว่าคุณคลิกตรงไหน เลื่อนหน้าไปถึงไหน และอาจสร้างภาพจำลองการใช้งาน (session replay)
              พร้อมข้อมูลอุปกรณ์ เบราว์เซอร์ และตำแหน่งโดยประมาณ ใช้เพื่อปรับปรุงหน้าเว็บให้ใช้ง่ายขึ้น
              Clarity ให้ข้อความที่พิมพ์ในช่องกรอกถูกปิดบังโดยค่าเริ่มต้น{" "}
              <span className="font-medium text-zinc-800">เราจะโหลด Clarity ก็ต่อเมื่อคุณกด “ยอมรับ” เท่านั้น</span>{" "}
              ข้อมูลส่วนนี้ประมวลผลโดย Microsoft ตาม{" "}
              <a
                href="https://privacy.microsoft.com/privacystatement"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 underline underline-offset-2"
              >
                นโยบายของ Microsoft
              </a>
            </p>
            <p>
              <span className="font-medium text-zinc-800">3. ข้อมูลที่อยู่ในเครื่องของคุณ (localStorage)</span>{" "}
              รายการทัวร์โปรดและตัวเลือกเรื่องคุกกี้ของคุณเก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น
              เราไม่ได้รับสำเนา และจะหายเมื่อคุณล้างข้อมูลเว็บไซต์หรือเปลี่ยนเครื่อง
            </p>
            <p>
              <span className="font-medium text-zinc-800">4. บันทึกการเข้าถึงของผู้ให้บริการโฮสต์ (Vercel)</span>{" "}
              เซิร์ฟเวอร์ที่ให้บริการเว็บอาจบันทึก IP address และคำขอที่ส่งมาชั่วคราวเพื่อความปลอดภัยและแก้ปัญหา
              รวมถึงคำที่คุณพิมพ์ค้นหา เราไม่ได้นำข้อมูลนี้มาระบุตัวบุคคล
            </p>
          </Section>

          <Section title="LINE Official Account">
            <p>
              หากคุณเพิ่มเพื่อน LINE ของเรา เราส่งข้อความแจ้งดีลถึงผู้ติดตามทุกคนพร้อมกัน (broadcast)
              เราไม่ได้เก็บชื่อ รูปโปรไฟล์ หรือรหัสผู้ใช้ LINE ของคุณไว้ในระบบของเว็บไซต์
              ข้อมูลบัญชีของคุณอยู่กับ LINE ตามนโยบายของ LINE และคุณเลิกรับข้อความได้ด้วยการบล็อกหรือลบเพื่อน
            </p>
          </Section>

          <Section title="ข้อมูลทัวร์">
            <p>
              ราคา วันเดินทาง และรายละเอียดทัวร์ดึงมาจากเว็บไซต์บริษัททัวร์ที่ระบุไว้ท้ายหน้า
              ไม่ใช่ข้อมูลส่วนบุคคล เมื่อคุณกดไปดูหรือจองทัวร์ คุณจะออกจากเว็บไซต์นี้ไปยังเว็บของบริษัทนั้น
              ซึ่งมีนโยบายความเป็นส่วนตัวของตนเอง
            </p>
          </Section>

          <Section title="สิทธิของคุณ">
            <p>
              ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) คุณมีสิทธิขอเข้าถึง แก้ไข ลบ
              หรือคัดค้านการใช้ข้อมูลของคุณ และถอนความยินยอมได้ทุกเมื่อ
            </p>
            <p>
              เปลี่ยนใจเรื่องคุกกี้ได้ทันทีที่ปุ่มนี้:{" "}
              <span className="inline-block rounded-lg border border-zinc-200 bg-white px-3 py-1 text-zinc-700">
                <CookieSettingsButton />
              </span>{" "}
              หรือล้างข้อมูลเว็บไซต์ในเบราว์เซอร์เพื่อลบรายการโปรดและตัวเลือกทั้งหมด
            </p>
          </Section>

          <Section title="ติดต่อเรา">
            <p>มีคำถามเรื่องข้อมูลส่วนบุคคล หรืออยากใช้สิทธิข้างต้น ติดต่อได้ทาง LINE Official Account ของเรา</p>
            <LineAddFriend variant="button" />
          </Section>

          <Section title="การเปลี่ยนแปลงนโยบาย">
            <p>หากมีการเปลี่ยนแปลง เราจะแก้ไขหน้านี้และปรับวันที่ปรับปรุงล่าสุดด้านบน</p>
          </Section>
        </div>
      </main>
    </>
  );
}
