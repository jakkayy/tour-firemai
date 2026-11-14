import posthog from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

// PostHog starts opted out: nothing is captured, and no cookie or localStorage entry is written, until
// CookieConsent calls opt_in_capturing() after a "yes". Requests go through /ingest (see next.config.ts)
// so ad-blockers are less likely to drop them.
if (key) {
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
}
