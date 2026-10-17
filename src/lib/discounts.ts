import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type DiscountResult =
  | { ok: true; code: string; amount: number; description: string }
  | { ok: false; error: string };

export function normaliseCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

// Validates a code against a subtotal without using it up
export async function evaluateDiscount(rawCode: string, subtotal: number, now = new Date()): Promise<DiscountResult> {
  const code = normaliseCode(rawCode);
  if (!code) return { ok: false, error: "Enter a discount code." };

  const d = await prisma.discountCode.findUnique({ where: { code } });
  // One message for unknown/inactive/expired so codes can't be probed
  const invalid = { ok: false as const, error: "That code isn't valid." };
  if (!d || !d.isActive) return invalid;
  if (d.startsAt && now < d.startsAt) return { ok: false, error: "That code isn't active yet." };
  if (d.endsAt && now > d.endsAt) return { ok: false, error: "That code has expired." };
  if (d.maxUses !== null && d.usedCount >= d.maxUses) return { ok: false, error: "That code has been fully used." };
  if (d.minSubtotal !== null && subtotal < d.minSubtotal) {
    return { ok: false, error: `Spend ₹${d.minSubtotal.toLocaleString("en-IN")} or more to use this code.` };
  }

  const raw = d.kind === "PERCENT" ? Math.floor((subtotal * d.value) / 100) : d.value;
  // Never take the order to ₹0: payment needs a positive amount
  const amount = Math.max(0, Math.min(raw, Math.floor(subtotal) - 1));
  if (amount <= 0) return invalid;

  return {
    ok: true,
    code: d.code,
    amount,
    description: d.kind === "PERCENT" ? `${d.value}% off` : `₹${d.value.toLocaleString("en-IN")} off`,
  };
}

// Uses one redemption, atomically: the usage cap is enforced inside the UPDATE
// so concurrent checkouts can't both take the last use.
export async function redeemDiscount(tx: Prisma.TransactionClient, code: string) {
  const count = await tx.$executeRaw`
    UPDATE DiscountCode SET usedCount = usedCount + 1
    WHERE code = ${code} AND isActive = 1 AND (maxUses IS NULL OR usedCount < maxUses)`;
  return count === 1;
}

export async function releaseDiscount(tx: Prisma.TransactionClient, code: string) {
  await tx.$executeRaw`UPDATE DiscountCode SET usedCount = GREATEST(usedCount - 1, 0) WHERE code = ${code}`;
}
