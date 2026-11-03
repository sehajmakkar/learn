import { buildSearchIndex } from "@/lib/search";

// Only reads files at build time, so it's prerendered to a static file.
export function GET() {
  return Response.json(buildSearchIndex());
}
