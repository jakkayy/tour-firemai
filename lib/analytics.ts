import posthog from "posthog-js";

// True once instrumentation-client.ts has started PostHog: a key is set and this is not `next dev`.
export function analyticsReady(): boolean {
  return typeof window !== "undefined" && posthog.__loaded === true;
}

// Product events. posthog-js drops them silently while the visitor hasn't accepted cookies
// (see CookieConsent) or when PostHog isn't running.
export function track(event: string, properties?: Record<string, unknown>) {
  if (!analyticsReady()) return;
  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break the page
  }
}
