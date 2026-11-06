import LineIcon from "./LineIcon";

// Link to the LINE Official Account's "add friend" page (e.g. https://lin.ee/xxxx).
// Renders nothing until it is configured, so the site works without it.
const ADD_FRIEND_URL = process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL;

type Props = {
  // "nav": pill for the navbar (icon only on phones). "banner": promo card for page bodies.
  // "note": one-line prompt for the tour page. "button": compact button for the footer.
  variant?: "nav" | "banner" | "note" | "button";
  className?: string;
};

export default function LineAddFriend({ variant = "banner", className = "" }: Props) {
  if (!ADD_FRIEND_URL || !ADD_FRIEND_URL.startsWith("https://")) return null;

  if (variant === "nav") {
    return (
      <a
        href={ADD_FRIEND_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="เพิ่มเพื่อน LINE รับแจ้งเตือนดีลใหม่"
        className={`inline-flex items-center gap-1.5 bg-[#06C755] text-white text-sm font-semibold whitespace-nowrap rounded-full p-2 sm:px-4 hover:opacity-90 transition-opacity ${className}`}
      >
        <LineIcon size={18} />
        <span className="hidden sm:inline">เพิ่มเพื่อน LINE</span>
      </a>
    );
  }

  if (variant === "note") {
    return (
      <div className={`flex items-center gap-3 rounded-xl bg-[#06C755]/10 px-4 py-3 ${className}`}>
        <span className="w-8 h-8 rounded-full bg-[#06C755] text-white flex items-center justify-center shrink-0">
          <LineIcon size={18} />
        </span>
        <p className="flex-1 text-xs text-zinc-600 leading-snug">
          ดีลแบบนี้มาใหม่ทุกวัน <span className="font-semibold text-zinc-800">รับแจ้งเตือนทาง LINE</span>
        </p>
        <a
          href={ADD_FRIEND_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-semibold text-white bg-[#06C755] px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
        >
          เพิ่มเพื่อน
        </a>
      </div>
    );
  }

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
