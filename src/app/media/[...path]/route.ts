import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { mediaDir } from "@/lib/media";

/**
 * Serves uploaded files from MEDIA_DIR at /media/<path>.
 * File names are unique (random suffix), so they are cached for a year.
 * In production Nginx can serve MEDIA_DIR directly (see README) and skip this.
 */
const TYPES: Record<string, string> = {
  webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", avif: "image/avif",
  pdf: "application/pdf", doc: "application/msword", xls: "application/vnd.ms-excel", ppt: "application/vnd.ms-powerpoint",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  if (!parts?.length || parts.some((p) => p === ".." || p.includes("\\") || p.startsWith("."))) {
    return new Response("Not found", { status: 404 });
  }
  const root = mediaDir();
  const full = path.join(root, ...parts);
  if (!full.startsWith(root + path.sep)) return new Response("Not found", { status: 404 });
  try {
    const s = await stat(full);
    if (!s.isFile()) return new Response("Not found", { status: 404 });
    const ext = path.extname(full).slice(1).toLowerCase();
    const data = await readFile(full);
    const type = TYPES[ext] ?? "application/octet-stream";
    const name = parts[parts.length - 1];
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(s.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        ...(type.startsWith("image/") || type === "application/pdf" ? {} : { "Content-Disposition": `attachment; filename="${name}"` }),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
