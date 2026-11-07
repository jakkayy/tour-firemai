const DEFAULT_SITE_URL = "https://tour-firemai.vercel.app";

// The public address of the site, used for canonical/OpenGraph URLs, the sitemap and robots.txt.
// Set NEXT_PUBLIC_SITE_URL when the site moves to its own domain (e.g. https://firemai.example.com);
// it is read at build time, so redeploy after changing it. Anything else falls back to the default.
function resolveSiteUrl(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value) return DEFAULT_SITE_URL;
  try {
    // Be forgiving about a missing scheme ("firemai.example.com") and a trailing slash or path
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (url.protocol === "https:" || url.protocol === "http:") return url.origin;
  } catch {
    // fall through
  }
  console.warn(`NEXT_PUBLIC_SITE_URL is not a valid URL (${value}); using ${DEFAULT_SITE_URL}`);
  return DEFAULT_SITE_URL;
}

export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
