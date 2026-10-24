import fs from "node:fs/promises";
import { connection } from "next/server";
import { isUploadKind, uploadPath, videoPath } from "@/lib/uploads";

// Only the exact shape the uploader writes: <kind>/<uuid>.webp
const FILE_NAME = /^[0-9a-f-]{36}\.webp$/;

export async function GET(
  request: Request,
  ctx: RouteContext<"/media/[...path]">
) {
  await connection();
  const { path: segments } = await ctx.params;

  if (segments.length !== 2) return notFound();
  const [kind, name] = segments;
  if (kind === "videos") return serveVideo(request, name);
  if (!isUploadKind(kind) || !FILE_NAME.test(name)) return notFound();

  try {
    const file = await fs.readFile(uploadPath(kind, name));
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "image/webp",
        // Filenames are random and never reused, so the content never changes
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return notFound();
  }
}

function notFound() {
  return new Response("Not found", { status: 404 });
}

const VIDEO_NAME = /^[0-9a-f-]{36}\.(mp4|webm)$/;

// Browsers stream video in byte ranges (and Safari insists on it), so answer those properly
async function serveVideo(request: Request, name: string) {
  if (!VIDEO_NAME.test(name)) return notFound();
  const type = name.endsWith(".webm") ? "video/webm" : "video/mp4";
  let handle: fs.FileHandle | null = null;
  try {
    handle = await fs.open(videoPath(name), "r");
    const { size } = await handle.stat();
    const headers: Record<string, string> = {
      "Content-Type": type,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    };

    const m = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
    let start = 0;
    let end = size - 1;
    let partial = false;
    if (m && (m[1] || m[2])) {
      if (m[1]) {
        start = Number(m[1]);
        end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
      } else {
        start = Math.max(0, size - Number(m[2])); // "last N bytes"
      }
      if (start > end || start >= size) {
        return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${size}` } });
      }
      partial = true;
    }
    const length = end - start + 1;
    const buf = Buffer.alloc(length);
    await handle.read(buf, 0, length, start);
    return new Response(new Uint8Array(buf), {
      status: partial ? 206 : 200,
      headers: {
        ...headers,
        "Content-Length": String(length),
        ...(partial ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}),
      },
    });
  } catch {
    return notFound();
  } finally {
    await handle?.close();
  }
}
