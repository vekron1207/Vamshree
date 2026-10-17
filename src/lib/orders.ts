import "server-only";
import type { OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { releaseStock, reserveStock, StockError, type StockLine } from "@/lib/stock";
import { redeemDiscount, releaseDiscount } from "@/lib/discounts";

const PENDING_TTL_MS = 45 * 60 * 1000;

type ItemRow = { productId: string; variantId: string | null; quantity: number; nameSnapshot: string };

const toLines = (items: ItemRow[]): StockLine[] =>
  items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity, label: i.nameSnapshot }));

/**
 * Cancels checkouts that were started but never paid, handing their reserved
 * stock (and discount use) back. Each order is claimed with a conditional
 * UPDATE first, so overlapping runs can never release the same stock twice.
 */
export async function expireStalePendingOrders(now = new Date()) {
  const cutoff = new Date(now.getTime() - PENDING_TTL_MS);
  const stale = await prisma.order.findMany({
    where: { status: "PENDING", stockHeld: true, createdAt: { lt: cutoff } },
    select: { id: true },
    take: 50,
  });

  let released = 0;
  for (const { id } of stale) {
    const done = await prisma.$transaction(async (tx) => {
      const claim = await tx.order.updateMany({
        where: { id, status: "PENDING", stockHeld: true },
        data: { status: "CANCELLED", stockHeld: false, adminNote: "Checkout expired without payment." },
      });
      if (claim.count !== 1) return false;
      const order = await tx.order.findUniqueOrThrow({ where: { id }, include: { items: true } });
      await releaseStock(tx, order.items);
      if (order.discountCode) await releaseDiscount(tx, order.discountCode);
      return true;
    });
    if (done) released++;
  }
  return released;
}

/**
 * Marks an order paid. Safe to call twice (browser callback + webhook): only
 * the first call changes anything. If the checkout had already expired, the
 * stock is taken again; if it's gone, the order is still recorded as paid
 * but flagged so you can refund or contact the customer.
 */
export async function markOrderPaid(orderId: string, razorpayPaymentId?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return null;

  if (order.status === "PENDING") {
    await prisma.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date(), razorpayPaymentId },
    });
    return prisma.order.findUnique({ where: { id: orderId } });
  }

  if (order.status === "CANCELLED") {
    try {
      await prisma.$transaction(async (tx) => {
        const claim = await tx.order.updateMany({
          where: { id: orderId, status: "CANCELLED" },
          data: { status: "PAID", paidAt: new Date(), razorpayPaymentId, stockHeld: true, adminNote: null },
        });
        if (claim.count !== 1) return;
        await reserveStock(tx, toLines(order.items));
        if (order.discountCode) await redeemDiscount(tx, order.discountCode);
      });
    } catch (err) {
      if (!(err instanceof StockError)) throw err;
      await prisma.order.updateMany({
        where: { id: orderId, status: "CANCELLED" },
        data: {
          status: "PAID",
          paidAt: new Date(),
          razorpayPaymentId,
          stockHeld: false,
          adminNote: "NEEDS ATTENTION: payment arrived after checkout expired and stock was no longer available. Refund or contact the customer.",
        },
      });
    }
  }

  return prisma.order.findUnique({ where: { id: orderId } });
}

const ACTIVE: OrderStatus[] = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export type StatusChangeResult = { ok: true } | { ok: false; error: string };

/** Admin status change that keeps stock honest. */
export async function changeOrderStatus(id: string, next: OrderStatus): Promise<StatusChangeResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!order) return { ok: false as const, error: "Order not found." };
      if (order.status === next) return { ok: true as const };

      const data: { status: OrderStatus; stockHeld?: boolean; shippedAt?: Date } = { status: next };

      if (next === "CANCELLED" && order.stockHeld) {
        await releaseStock(tx, order.items);
        if (order.discountCode) await releaseDiscount(tx, order.discountCode);
        data.stockHeld = false;
      } else if (order.status === "CANCELLED" && ACTIVE.includes(next) && !order.stockHeld) {
        // Reviving a cancelled order takes the stock again, or refuses
        await reserveStock(tx, toLines(order.items));
        if (order.discountCode) await redeemDiscount(tx, order.discountCode);
        data.stockHeld = true;
      }

      if (next === "SHIPPED" && !order.shippedAt) data.shippedAt = new Date();
      await tx.order.update({ where: { id }, data });
      return { ok: true as const };
    });
  } catch (err) {
    if (err instanceof StockError) {
      return { ok: false, error: `Can't reopen this order. ${err.message}` };
    }
    throw err;
  }
}
