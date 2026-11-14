import { SeverityNumber } from "@opentelemetry/api-logs";
import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { loggerProvider, posthogLogger } from "@/instrumentation";

// Called by the scraper right after it has written new tours, so the site shows them
// now instead of when the 6-hour cache would have expired on its own.
//
// POST /api/revalidate  with  Authorization: Bearer <REVALIDATE_SECRET>

function authorized(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  // Hash both sides so the comparison is constant-time and independent of length.
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(token), digest(secret));
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    // Never let an unset secret turn this into an open endpoint.
    return Response.json({ error: "not configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (!authorized(request, secret)) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  revalidatePath("/");
  revalidatePath("/tours");
  revalidatePath("/tours/[id]", "page");
  revalidatePath("/sitemap.xml");
  // The country list on /tours lives in its own cache entry
  revalidateTag("tours", "max");

  posthogLogger.emit({
    body: "cache_revalidation_completed",
    severityNumber: SeverityNumber.INFO,
    attributes: {
      revalidated_path_count: 4,
      revalidated_tag_count: 1,
    },
  });
  await loggerProvider.forceFlush().catch(() => {});

  return Response.json({ revalidated: true }, { headers: { "Cache-Control": "no-store" } });
}
