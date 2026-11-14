import posthog from "posthog-js";

// Product events. posthog-js drops them silently while the visitor hasn't accepted cookies
// (see CookieConsent) or when no key is configured.
export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break the page
  }
}
