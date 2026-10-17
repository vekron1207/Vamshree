import fs from "node:fs/promises";
import { connection } from "next/server";
import { isUploadKind, uploadPath } from "@/lib/uploads";

// Only the exact shape the uploader writes: <kind>/<uuid>.webp
const FILE_NAME = /^[0-9a-f-]{36}\.webp$/;

export async function GET(
  _request: Request,
  ctx: RouteContext<"/media/[...path]">
) {
  await connection();
  const { path: segments } = await ctx.params;

  if (segments.length !== 2) return notFound();
  const [kind, name] = segments;
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
