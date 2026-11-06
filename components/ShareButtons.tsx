"use client";

import { useState } from "react";
import LineIcon from "./LineIcon";

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  async function handleNativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {}
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (canNativeShare) {
    return (
      <div className="flex gap-3">
        <button
          onClick={handleNativeShare}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors"
        >
          <ShareIcon />
          แชร์
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 border border-zinc-200 text-zinc-600 px-5 py-3 rounded-xl text-sm hover:bg-zinc-50 transition-colors"
        >
          <CopyIcon />
          {copied ? "คัดลอกแล้ว ✓" : "คัดลอกลิงก์"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-zinc-400 text-center mb-3">แชร์ให้เพื่อน</p>
      <div className="flex gap-3">
        <a
          href={`https://line.me/R/share?text=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-[#06C755] text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <LineIcon />
          แชร์ LINE
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-[#1877F2] text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <FacebookIcon />
          แชร์ Facebook
        </a>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 border border-zinc-200 text-zinc-600 px-4 py-3 rounded-xl text-sm hover:bg-zinc-50 transition-colors"
        >
          <CopyIcon />
          {copied ? "✓" : ""}
        </button>
      </div>
    </div>
  );
}
