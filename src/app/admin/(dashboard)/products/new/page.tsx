import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../product-form";
import { createProduct } from "../actions";

// Authenticated admin views always render fresh per request; navigations are
// allowed to wait for data rather than requiring a prerendered shell.
export const instant = false;

export default async function NewProductPage() {
  await connection();
  const [categories, collections] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.collection.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="text-sm text-ink/50 hover:text-forest">
        &larr; Products
      </Link>
      <h1 className="font-display text-3xl text-forest">New product</h1>
      <ProductForm action={createProduct} categories={categories} collections={collections} />
    </div>
  );
}
