"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { changeOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@/generated/prisma/client";

export type ActionResult = { ok: true } | { ok: false; error: string };

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<ActionResult> {
  await requireAdmin();
  if (!STATUSES.includes(status)) return { ok: false, error: "Unknown status." };
  const result = await changeOrderStatus(id, status);
  updateTag("products");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  return result;
}

function cleanUrl(raw: string) {
  const v = raw.trim().slice(0, 500);
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

export async function saveTracking(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const courier = String(formData.get("courier") ?? "").trim().slice(0, 80) || null;
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim().slice(0, 80) || null;
  const trackingUrl = cleanUrl(String(formData.get("trackingUrl") ?? ""));
  if (trackingUrl === undefined) return { ok: false, error: "Tracking link must start with http:// or https://" };
  const adminNote = String(formData.get("adminNote") ?? "").trim().slice(0, 1000) || null;

  const order = await prisma.order.findUnique({ where: { id }, select: { adminNote: true } });
  if (!order) return { ok: false, error: "Order not found." };
  // A system "NEEDS ATTENTION" flag stays until the order is dealt with
  const flagged = order.adminNote?.startsWith("NEEDS ATTENTION");
  await prisma.order.update({
    where: { id },
    data: { courier, trackingNumber, trackingUrl, ...(flagged ? {} : { adminNote }) },
  });
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true };
}
