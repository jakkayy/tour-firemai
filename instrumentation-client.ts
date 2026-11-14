import posthog from "posthog-js";
import { readConsent } from "@/lib/consent";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

// PostHog captures nothing, and writes no cookie or localStorage entry, until the visitor has accepted
// cookies (CookieConsent calls opt_in_capturing() on a "yes"). Requests go through /ingest (see
// next.config.ts) so ad-blockers are less likely to drop them. Skipped in `next dev` so local testing
// doesn't land in the real project's data.
if (key && process.env.NODE_ENV === "production") {
  posthog.init(key, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2025-05-24", // pageviews follow client-side navigation
    opt_out_capturing_by_default: true,
    opt_out_capturing_persistence_type: "localStorage",
    autocapture: false, // only the events in lib/analytics.ts
    disable_session_recording: true,
    person_profiles: "identified_only",
  });

  // PostHog remembers an earlier opt-in on its own. That must not outlive the visitor's recorded choice
  // (for instance after the consent key changed), so follow the consent we hold, before anything is sent.
  if (readConsent() === "granted") {
    if (posthog.has_opted_out_capturing()) posthog.opt_in_capturing({ captureEventName: false });
  } else {
    posthog.opt_out_capturing();
  }
}
