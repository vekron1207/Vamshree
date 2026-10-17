import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { priceFor, SALE_FIELDS } from "@/lib/pricing";
import type { ProductCardData } from "@/components/product-card";

// Deliberately uncached (plain request-time reads) for now. Once a live
// database is connected, wrap these in "use cache" + cacheTag("products")
// and invalidate with updateTag("products") from the admin mutations below.
//
// connection() marks this as request-time so Cache Components doesn't flag
// the Date.now() calls the mariadb driver makes internally (connection
// pooling, query timing) as non-deterministic prerender output. It also
// matters for sales: whether a sale window is open depends on "now".

const cardInclude = {
  images: { orderBy: { position: "asc" as const }, take: 1 },
  collection: { select: { name: true, ...SALE_FIELDS } },
};

type CardSource = {
  id: string;
  slug: string;
  name: string;
  price: unknown;
  compareAtPrice: unknown;
  stock: number;
  images: { url: string }[];
  collection: ({ name: string } & Parameters<typeof priceFor>[2]) | null;
};

function toCard(p: CardSource, withEyebrow: boolean): ProductCardData {
  const pricing = priceFor(
    Number(p.price),
    p.compareAtPrice ? Number(p.compareAtPrice) : null,
    p.collection
  );
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: pricing.price,
    originalPrice: pricing.originalPrice,
    saleLabel: pricing.saleLabel,
    stock: p.stock,
    image: p.images[0]?.url ?? null,
    eyebrow: withEyebrow ? (p.collection?.name ?? null) : null,
  };
}

export type ProductSort = "new" | "price-asc" | "price-desc" | "name";

export async function getActiveProducts(filter?: {
  categorySlug?: string;
  collectionSlug?: string;
  search?: string;
  sort?: ProductSort;
  minPrice?: number;
  maxPrice?: number;
}): Promise<ProductCardData[]> {
  await connection();
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(filter?.categorySlug ? { category: { slug: filter.categorySlug } } : {}),
      ...(filter?.collectionSlug ? { collection: { slug: filter.collectionSlug } } : {}),
      ...(filter?.search
        ? {
            OR: [
              { name: { contains: filter.search } },
              { description: { contains: filter.search } },
              { collection: { name: { contains: filter.search } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: cardInclude,
  });
  let cards = products.map((p) => toCard(p, true));
  // Prices include collection sales, so range and sort run on the final price
  const { minPrice, maxPrice, sort } = filter ?? {};
  if (minPrice !== undefined) cards = cards.filter((c) => c.price >= minPrice);
  if (maxPrice !== undefined) cards = cards.filter((c) => c.price <= maxPrice);
  if (sort === "price-asc") cards.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") cards.sort((a, b) => b.price - a.price);
  else if (sort === "name") cards.sort((a, b) => a.name.localeCompare(b.name));
  return cards;
}

export async function getProductsByIds(ids: string[]): Promise<ProductCardData[]> {
  await connection();
  const clean = [...new Set(ids.filter((i) => typeof i === "string"))].slice(0, 100);
  if (clean.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: clean }, isActive: true },
    include: cardInclude,
  });
  return products.map((p) => toCard(p, true));
}

export async function getProductBySlug(slug: string) {
  await connection();
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { position: "asc" } },
      category: true,
      collection: true,
      variants: { orderBy: { position: "asc" } },
    },
  });
  if (!product) return null;
  const pricing = priceFor(
    Number(product.price),
    product.compareAtPrice ? Number(product.compareAtPrice) : null,
    product.collection
  );
  return { ...product, pricing };
}

export async function getRelatedProducts(
  productId: string,
  collectionId: string | null
): Promise<ProductCardData[]> {
  await connection();
  if (!collectionId) return [];
  const products = await prisma.product.findMany({
    where: { isActive: true, collectionId, id: { not: productId } },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: cardInclude,
  });
  return products.map((p) => toCard(p, false));
}
