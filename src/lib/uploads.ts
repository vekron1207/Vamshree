import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Uploads live outside public/ so they don't depend on build-time static file handling,
// and are served by app/media/[...path]. Set UPLOADS_DIR to a folder that survives
// deployments (hosts that deploy each build into a fresh folder would otherwise lose
// them); without it they go in <project>/uploads (gitignored), which is fine locally.
function uploadsRoot() {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
}

export function uploadPath(kind: UploadKind, name?: string) {
  return name ? path.join(uploadsRoot(), kind, name) : path.join(uploadsRoot(), kind);
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const KINDS = {
  products: { maxWidth: 1600, maxHeight: 2000 },
  collections: { maxWidth: 2400, maxHeight: 1600 },
  pages: { maxWidth: 2000, maxHeight: 2000 },
} as const;

export type UploadKind = keyof typeof KINDS;

export function isUploadKind(value: string): value is UploadKind {
  return value in KINDS;
}

export async function saveImageUpload(file: File, kind: UploadKind): Promise<string> {
  if (file.size === 0) throw new Error("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Images must be 10 MB or smaller.");

  const input = Buffer.from(await file.arrayBuffer());

  // Decoding with sharp is the real type check: anything that isn't a raster
  // image fails here, regardless of the extension or MIME type sent.
  let meta;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new Error("That file isn't a supported image. Use JPG, PNG or WebP.");
  }
  if (!meta.format || !["jpeg", "png", "webp", "avif", "heif"].includes(meta.format)) {
    throw new Error("That file isn't a supported image. Use JPG, PNG or WebP.");
  }

  const { maxWidth, maxHeight } = KINDS[kind];
  const output = await sharp(input)
    .rotate() // honour camera orientation before metadata is stripped
    .resize({ width: maxWidth, height: maxHeight, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 86 })
    .toBuffer();

  const name = `${crypto.randomUUID()}.webp`;
  await fs.mkdir(uploadPath(kind), { recursive: true });
  await fs.writeFile(uploadPath(kind, name), output);

  return `/media/${kind}/${name}`;
}

// Image references accepted from admin forms: our own uploads, bundled
// static assets, or absolute https URLs.
export function isAllowedImageUrl(url: string) {
  if (/^\/(media|products|brand)\/[\w./-]+$/.test(url) && !url.includes("..")) return true;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}
