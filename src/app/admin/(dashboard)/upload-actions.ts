"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { isUploadKind, saveImageUpload } from "@/lib/uploads";

export type UploadResult = { url: string } | { error: string };

export async function uploadImageAction(formData: FormData): Promise<UploadResult> {
  await requireAdmin();

  const file = formData.get("file");
  const kind = String(formData.get("kind") ?? "");
  if (!(file instanceof File)) return { error: "No file was received." };
  if (!isUploadKind(kind)) return { error: "Unknown upload type." };

  try {
    return { url: await saveImageUpload(file, kind) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed. Try again." };
  }
}
