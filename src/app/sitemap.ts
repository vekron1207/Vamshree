import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site-url";
import { POLICY_LINKS } from "@/lib/site-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const [products, collections] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.collection.findMany({ where: { isVisible: true }, select: { slug: true, updatedAt: true } }),
  ]);

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/collections`, changeFrequency: "weekly", priority: 0.7 },
    ...collections.map((c) => ({ url: `${SITE_URL}/collections/${c.slug}`, lastModified: c.updatedAt, priority: 0.7 })),
    ...products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
    ...POLICY_LINKS.map((l) => ({ url: `${SITE_URL}/${l.slug}`, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
