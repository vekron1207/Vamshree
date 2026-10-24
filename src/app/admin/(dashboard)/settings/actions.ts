"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { writeSetting } from "@/lib/settings";

export type SettingsResult = { ok: true } | { ok: false; error: string };

const text = (fd: FormData, key: string, max: number) => String(fd.get(key) ?? "").trim().slice(0, max);

export async function saveShipping(fd: FormData): Promise<SettingsResult> {
  await requireAdmin();
  const flatFee = Math.round(Number(fd.get("flatFee") || 0));
  const freeRaw = String(fd.get("freeAbove") ?? "").trim();
  const freeAbove = freeRaw === "" ? null : Math.round(Number(freeRaw));
  if (!Number.isFinite(flatFee) || flatFee < 0 || flatFee > 100000) return { ok: false, error: "Shipping fee must be 0 or more." };
  if (freeAbove !== null && (!Number.isFinite(freeAbove) || freeAbove < 0)) {
    return { ok: false, error: "Free shipping threshold must be 0 or more, or blank for none." };
  }
  await writeSetting("shipping", { flatFee, freeAbove });
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function saveBusiness(fd: FormData): Promise<SettingsResult> {
  await requireAdmin();
  const prefix = text(fd, "invoicePrefix", 8).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const legalName = text(fd, "legalName", 120);
  if (!legalName) return { ok: false, error: "Business name is required." };
  await writeSetting("business", {
    legalName,
    gstin: text(fd, "gstin", 20).toUpperCase(),
    address: text(fd, "address", 400),
    phone: text(fd, "phone", 30),
    email: text(fd, "email", 120),
    invoicePrefix: prefix || "VA",
  });
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function saveStore(fd: FormData): Promise<SettingsResult> {
  await requireAdmin();
  const lowStockThreshold = Math.floor(Number(fd.get("lowStockThreshold")));
  if (!Number.isFinite(lowStockThreshold) || lowStockThreshold < 0 || lowStockThreshold > 1000) {
    return { ok: false, error: "Low-stock level must be a whole number from 0 to 1000." };
  }
  await writeSetting("store", { lowStockThreshold });
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { ok: true };
}

export async function saveAnnouncement(fd: FormData): Promise<SettingsResult> {
  await requireAdmin();
  const enabled = fd.get("enabled") === "on";
  let list: unknown;
  try {
    list = JSON.parse(String(fd.get("items") ?? "[]"));
  } catch {
    return { ok: false, error: "The messages could not be read. Reload the page and try again." };
  }
  if (!Array.isArray(list)) return { ok: false, error: "The messages could not be read." };
  if (list.length > 4) return { ok: false, error: "Use up to 4 messages." };

  const items: { text: string; code: string; link: string }[] = [];
  for (const raw of list) {
    const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const text = String(r.text ?? "").trim().slice(0, 140);
    const code = String(r.code ?? "").trim().toUpperCase();
    const link = String(r.link ?? "").trim().slice(0, 300);
    if (!text && !code && !link) continue; // blank row
    if (!text) return { ok: false, error: "Every message needs some text." };
    if (code && !/^[A-Z0-9_-]{3,24}$/.test(code)) return { ok: false, error: "A coupon code is 3 to 24 letters or numbers." };
    if (link && !(link.startsWith("/") && !link.startsWith("//")) && !link.startsWith("https://")) {
      return { ok: false, error: "A link must start with / (a page on this site) or https://" };
    }
    items.push({ text, code, link });
  }
  if (enabled && items.length === 0) return { ok: false, error: "Add at least one message, or switch the bar off." };
  await writeSetting("announcement", { enabled, items });
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}
