import { useSyncExternalStore } from "react";

// Whether the visitor allowed analytics cookies (Microsoft Clarity). Kept in localStorage, on this device only.
// "unknown" is only the server's answer: nothing is shown until the browser has been asked.
export type Consent = "granted" | "denied" | "undecided" | "unknown";

const STORAGE_KEY = "tour-firemai:cookie-consent";
const CHANGE_EVENT = "tour-firemai:cookie-consent-change";

function read(): Consent {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : "undecided";
  } catch {
    // Storage blocked: ask each time, and never track without a recorded yes
    return "undecided";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function setConsent(value: "granted" | "denied" | "undecided") {
  try {
    if (value === "undecided") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage blocked: the choice just lasts until the page is reloaded
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useConsent(): Consent {
  return useSyncExternalStore(subscribe, read, () => "unknown");
}
