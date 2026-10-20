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
  const text = String(fd.get("text") ?? "").trim().slice(0, 140);
  const link = String(fd.get("link") ?? "").trim().slice(0, 300);
  const enabled = fd.get("enabled") === "on";
  if (enabled && !text) return { ok: false, error: "Write the message to show, or switch the bar off." };
  if (link && !(link.startsWith("/") && !link.startsWith("//")) && !link.startsWith("https://")) {
    return { ok: false, error: "The link must start with / (a page on this site) or https://" };
  }
  await writeSetting("announcement", { enabled, text, link });
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}
