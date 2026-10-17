import "server-only";
import type { Prisma } from "@/generated/prisma/client";

export type StockLine = {
  productId: string;
  variantId: string | null;
  quantity: number;
  /** Shown in the error when this line can't be reserved */
  label: string;
};

// Expected business failure (not a bug): someone else bought the last piece.
export class StockError extends Error {}

type Tx = Prisma.TransactionClient;

// Variant products keep Product.stock equal to the sum of their variants, so
// storefront and admin code can read one number.
async function syncProductStock(tx: Tx, productId: string) {
  const agg = await tx.productVariant.aggregate({ where: { productId }, _sum: { stock: true }, _count: true });
  if (agg._count > 0) {
    await tx.product.update({ where: { id: productId }, data: { stock: agg._sum.stock ?? 0 } });
  }
}

/**
 * Atomically takes stock for every line, or throws StockError and takes none
 * (when run inside a transaction). Each take is one conditional UPDATE
 * (`stock >= qty`), so two buyers racing for the last piece can't both win.
 */
export async function reserveStock(tx: Tx, lines: StockLine[]) {
  const touched = new Set<string>();
  for (const line of lines) {
    if (line.quantity < 1) throw new StockError(`Invalid quantity for ${line.label}.`);
    if (line.variantId) {
      const res = await tx.productVariant.updateMany({
        where: { id: line.variantId, productId: line.productId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (res.count !== 1) throw new StockError(`Not enough stock for ${line.label}.`);
      touched.add(line.productId);
    } else {
      const res = await tx.product.updateMany({
        where: { id: line.productId, variants: { none: {} }, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (res.count !== 1) throw new StockError(`Not enough stock for ${line.label}.`);
    }
  }
  for (const productId of touched) await syncProductStock(tx, productId);
}

/** Puts previously reserved stock back. */
export async function releaseStock(tx: Tx, lines: Omit<StockLine, "label">[]) {
  const touched = new Set<string>();
  for (const line of lines) {
    if (line.variantId) {
      await tx.productVariant.updateMany({
        where: { id: line.variantId, productId: line.productId },
        data: { stock: { increment: line.quantity } },
      });
      touched.add(line.productId);
    } else {
      await tx.product.updateMany({
        where: { id: line.productId },
        data: { stock: { increment: line.quantity } },
      });
    }
  }
  for (const productId of touched) await syncProductStock(tx, productId);
}
