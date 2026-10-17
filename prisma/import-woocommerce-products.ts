import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import rawProducts from "./data/woocommerce-products.json";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL ?? "");
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { slug: "pendant-sets", name: "Pendant Sets", imageUrl: "/brand/category-pendant-set.jpg" },
  { slug: "rings", name: "Rings", imageUrl: "/brand/category-ring.jpg" },
  { slug: "earrings", name: "Earrings", imageUrl: "/brand/category-earring.jpg" },
  { slug: "bracelets", name: "Bracelets", imageUrl: "/brand/category-bracelet.jpg" },
  { slug: "pendants", name: "Pendants", imageUrl: "/brand/category-pendant.jpg" },
];

const COLLECTIONS = [
  {
    slug: "rare-story",
    name: "Rare Story",
    imageUrl: "/brand/collection-rare-story.jpg",
    description:
      "Inspired by the rare and extraordinary beauty of flowers, the Rare Story Collection celebrates the individuality found in nature.",
  },
  {
    slug: "golden-hour-story",
    name: "Golden Hour Story",
    imageUrl: "/brand/collection-golden-hour-story.jpg",
    description:
      "Inspired by the timeless warmth of golden radiance, Golden Hour Story celebrates the enduring beauty and allure inspired by gold.",
  },
  {
    slug: "everyday-story",
    name: "Everyday Story",
    imageUrl: "/brand/collection-everyday-story.jpg",
    description:
      "Inspired by the beauty found in your routine, Everyday Story celebrates effortless elegance in its most refined form.",
  },
  {
    slug: "moonlight-story",
    name: "Moonlight Story",
    imageUrl: "/brand/collection-moonlight-story.jpg",
    description:
      "Inspired by the quiet glow of moonlit evenings, Moonlight Story is a collection where elegance meets subtle radiance.",
  },
];

type WooProduct = {
  slug: string;
  name: string;
  description: string;
  categorySlug: string | null;
  collectionSlug: string | null;
  image: string;
};

const products = rawProducts as WooProduct[];

async function main() {
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, imageUrl: c.imageUrl },
      create: c,
    });
  }

  for (const c of COLLECTIONS) {
    await prisma.collection.upsert({
      where: { slug: c.slug },
      update: { name: c.name, imageUrl: c.imageUrl, description: c.description },
      create: c,
    });
  }

  const categoryIds = Object.fromEntries(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id])
  );
  const collectionIds = Object.fromEntries(
    (await prisma.collection.findMany()).map((c) => [c.slug, c.id])
  );

  let created = 0;
  let updated = 0;

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });

    const data = {
      name: p.name,
      description: p.description,
      categoryId: p.categorySlug ? categoryIds[p.categorySlug] : null,
      collectionId: p.collectionSlug ? collectionIds[p.collectionSlug] : null,
    };

    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      const product = await prisma.product.create({
        data: {
          ...data,
          slug: p.slug,
          price: 0,
          stock: 0,
          // Imported as a draft: real price/stock aren't public on the
          // source site, so these stay hidden from the storefront until
          // an admin reviews and activates each one.
          isActive: false,
          images: { create: [{ url: p.image, position: 0 }] },
        },
      });
      created++;
      void product;
    }
  }

  console.log(`Categories: ${CATEGORIES.length}, Collections: ${COLLECTIONS.length}`);
  console.log(`Products created: ${created}, updated: ${updated}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
