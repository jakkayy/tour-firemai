import LineIcon from "./LineIcon";

// Link to the LINE Official Account's "add friend" page (e.g. https://lin.ee/xxxx).
// Renders nothing until it is configured, so the site works without it.
const ADD_FRIEND_URL = process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL;

type Props = {
  // "banner": promo card for page bodies. "button": compact button for the footer.
  variant?: "banner" | "button";
  className?: string;
};

export default function LineAddFriend({ variant = "banner", className = "" }: Props) {
  if (!ADD_FRIEND_URL || !ADD_FRIEND_URL.startsWith("https://")) return null;

  if (variant === "button") {
    return (
      <a
        href={ADD_FRIEND_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 bg-[#06C755] text-white text-xs font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity ${className}`}
      >
        <LineIcon size={16} />
        เพิ่มเพื่อน LINE รับแจ้งเตือนดีลใหม่
      </a>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-5 bg-white rounded-2xl border border-zinc-100 shadow-sm px-6 py-5 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-[#06C755] text-white flex items-center justify-center shrink-0">
        <LineIcon size={26} />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <p className="font-bold text-zinc-900">รับแจ้งเตือนทัวร์ไฟไหม้ใหม่ทาง LINE</p>
        <p className="text-sm text-zinc-500 mt-0.5">
          เพิ่มเพื่อนกับเรา แล้วเราจะส่งสรุปดีลใหม่ที่ลดแรงที่สุดให้ ไม่เกินวันละครั้ง
        </p>
      </div>
      <a
        href={ADD_FRIEND_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 inline-flex items-center gap-2 bg-[#06C755] text-white text-sm font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
      >
        เพิ่มเพื่อน
      </a>
    </div>
  );
}
