"use client";

import { setConsent } from "@/lib/consent";

// Footer link that asks again, so a choice made once can always be changed
export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => setConsent("undecided")}
      className="text-xs hover:text-teal-400 transition-colors text-left"
    >
      ตั้งค่าคุกกี้
    </button>
  );
}
