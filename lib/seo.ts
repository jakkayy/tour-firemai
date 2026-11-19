// JSON-LD must be embedded as a <script>; escaping "<" stops a tour title from closing the tag early.
export function jsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
