"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { normaliseCode } from "@/lib/discounts";

export type DiscountResult = { ok: true } | { ok: false; error: string };

function optInt(raw: FormDataEntryValue | null) {
  const v = String(raw ?? "").trim();
  if (v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
}

function optDate(raw: FormDataEntryValue | null, endOfDay: boolean) {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  const d = new Date(`${v}T${endOfDay ? "23:59:59" : "00:00:00"}+05:30`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function createDiscount(fd: FormData): Promise<DiscountResult> {
  await requireAdmin();
  const code = normaliseCode(String(fd.get("code") ?? ""));
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) return { ok: false, error: "Code must be 3 to 24 letters, numbers, - or _." };
  const kind = fd.get("kind") === "FLAT" ? "FLAT" : "PERCENT";
  const value = Number(fd.get("value"));
  if (!Number.isInteger(value) || value < 1) return { ok: false, error: "Enter a whole-number value of 1 or more." };
  if (kind === "PERCENT" && value > 90) return { ok: false, error: "A percentage discount can be at most 90%." };
  const minSubtotal = optInt(fd.get("minSubtotal"));
  const maxUses = optInt(fd.get("maxUses"));
  if (Number.isNaN(minSubtotal) || Number.isNaN(maxUses)) return { ok: false, error: "Minimum spend and uses must be whole numbers." };
  const startsAt = optDate(fd.get("startsAt"), false);
  const endsAt = optDate(fd.get("endsAt"), true);
  if (startsAt === undefined || endsAt === undefined) return { ok: false, error: "Check the dates." };
  if (startsAt && endsAt && endsAt < startsAt) return { ok: false, error: "The end date is before the start date." };

  try {
    await prisma.discountCode.create({ data: { code, kind, value, minSubtotal, maxUses, startsAt, endsAt } });
  } catch {
    return { ok: false, error: "A code with that name already exists." };
  }
  revalidatePath("/admin/discounts");
  return { ok: true };
}

export async function setDiscountActive(id: string, isActive: boolean): Promise<DiscountResult> {
  await requireAdmin();
  await prisma.discountCode.updateMany({ where: { id }, data: { isActive } });
  revalidatePath("/admin/discounts");
  return { ok: true };
}

export async function deleteDiscount(id: string): Promise<DiscountResult> {
  await requireAdmin();
  const d = await prisma.discountCode.findUnique({ where: { id } });
  if (!d) return { ok: true };
  // Orders keep the code text, so deleting is safe; usage history lives on the orders
  await prisma.discountCode.delete({ where: { id } });
  revalidatePath("/admin/discounts");
  return { ok: true };
}
