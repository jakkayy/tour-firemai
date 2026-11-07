"use client";

import Link from "next/link";
import { useEffect } from "react";
import { setConsent, useConsent } from "@/lib/consent";

const CLARITY_ID = "xdo6ug506l";

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[] };
declare global {
  interface Window {
    clarity?: ClarityFn;
  }
}

// Microsoft Clarity records how people use the pages (clicks, scrolling) and sets cookies, so it is
// loaded only after a "yes". Without one, no analytics script from Microsoft is requested at all.
export default function CookieConsent() {
  const consent = useConsent();

  useEffect(() => {
    if (consent === "granted") {
      if (!document.getElementById("clarity-script")) {
        window.clarity =
          window.clarity ||
          function (...args: unknown[]) {
            (window.clarity!.q = window.clarity!.q || []).push(args);
          };
        const script = document.createElement("script");
        script.id = "clarity-script";
        script.async = true;
        script.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
        document.head.appendChild(script);
      }
      window.clarity?.("consent", true);
    } else if (consent === "denied") {
      // Changed their mind after saying yes: stop recording and have Clarity remove its cookies
      window.clarity?.("consent", false);
    }
  }, [consent]);

  if (consent !== "undecided") return null;

  return (
    <div
      role="region"
      aria-label="การใช้คุกกี้"
      className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl bg-slate-900 text-slate-200 shadow-2xl ring-1 ring-white/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-sm leading-relaxed flex-1">
          เว็บไซต์นี้ใช้คุกกี้ของ Microsoft Clarity เพื่อดูว่าคนใช้หน้าเว็บอย่างไร จะได้ปรับปรุงให้ใช้ง่ายขึ้น
          จะเปิดใช้ก็ต่อเมื่อคุณยอมรับ และเปลี่ยนใจได้ทุกเมื่อ{" "}
          <Link href="/privacy" className="text-teal-300 underline underline-offset-2 hover:text-teal-200">
            อ่านนโยบายความเป็นส่วนตัว
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setConsent("denied")}
            className="flex-1 sm:flex-none rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors"
          >
            ไม่ยอมรับ
          </button>
          <button
            type="button"
            onClick={() => setConsent("granted")}
            className="flex-1 sm:flex-none rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400 transition-colors"
          >
            ยอมรับ
          </button>
        </div>
      </div>
    </div>
  );
}
