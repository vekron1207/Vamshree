import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { activeSalePercent } from "@/lib/pricing";

export type StoreCollection = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  imageUrl: string | null;
  salePercent: number;
  saleLabel: string | null;
  saleEndsAt: Date | null;
};

function toStore(c: {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  imageUrl: string | null;
  saleEnabled: boolean;
  salePercent: number;
  saleLabel: string | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
}): StoreCollection {
  const pct = activeSalePercent(c);
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    description: c.description,
    imageUrl: c.imageUrl,
    salePercent: pct,
    saleLabel: pct > 0 ? c.saleLabel || `${pct}% off` : null,
    saleEndsAt: pct > 0 ? c.saleEndsAt : null,
  };
}

export async function getVisibleCollections(): Promise<StoreCollection[]> {
  await connection();
  const rows = await prisma.collection.findMany({
    where: { isVisible: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toStore);
}

export async function getVisibleCollection(slug: string): Promise<StoreCollection | null> {
  await connection();
  const row = await prisma.collection.findFirst({ where: { slug, isVisible: true } });
  return row ? toStore(row) : null;
}
