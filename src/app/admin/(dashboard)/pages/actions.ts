"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { isAllowedImageUrl } from "@/lib/uploads";
import { isEditablePage } from "@/lib/site-pages";

export type PageFormState = { error?: string; savedAt?: number };

const LIMITS = { title: 120, intro: 600, body: 20000, field: 300 };

function text(formData: FormData, key: string, max: number) {
  const value = String(formData.get(key) ?? "").trim();
  if (value.length > max) throw new Error(`"${key}" is too long (max ${max} characters).`);
  return value;
}

export async function saveSitePage(
  slug: string,
  _prev: PageFormState,
  formData: FormData
): Promise<PageFormState> {
  await requireAdmin();
  if (!isEditablePage(slug)) return { error: "Unknown page." };

  try {
    const title = text(formData, "title", LIMITS.title);
    const intro = text(formData, "intro", LIMITS.intro);
    const body = text(formData, "body", LIMITS.body);
    const imageUrl = text(formData, "imageUrl", 500);
    if (!title) throw new Error("Title is required.");
    if (imageUrl && !isAllowedImageUrl(imageUrl)) throw new Error("Image links must start with https://");

    let details = undefined;
    if (slug === "contact") {
      const email = text(formData, "email", LIMITS.field);
      const phone = text(formData, "phone", LIMITS.field);
      const whatsapp = text(formData, "whatsapp", LIMITS.field);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
      if (phone && !/^[+\d][\d\s-]{6,}$/.test(phone)) throw new Error("Enter a valid phone number.");
      if (whatsapp && !/^[+\d][\d\s-]{6,}$/.test(whatsapp)) throw new Error("Enter a valid WhatsApp number.");
      details = {
        email,
        phone,
        whatsapp,
        address: text(formData, "address", 1000),
        hours: text(formData, "hours", LIMITS.field),
      };
    }

    const data = { title, intro: intro || null, body: body || null, imageUrl: imageUrl || null, details };
    await prisma.sitePage.upsert({ where: { slug }, update: data, create: { slug, ...data } });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save. Try again." };
  }

  revalidatePath(`/${slug}`);
  revalidatePath("/admin/pages");
  return { savedAt: Date.now() };
}
