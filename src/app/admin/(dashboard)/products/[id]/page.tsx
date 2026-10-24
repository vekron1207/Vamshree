import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../product-form";
import { updateProduct } from "../actions";

// Authenticated admin views always render fresh per request; navigations are
// allowed to wait for data rather than requiring a prerendered shell.
export const instant = false;

// Stored as exact moments; the form works in India calendar days
const istDay = (d: Date | null) => (d ? new Date(d.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10) : "");

export default async function EditProductPage(
  props: PageProps<"/admin/products/[id]">
) {
  await connection();
  const { id } = await props.params;
  const [product, categories, collections] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: { orderBy: { position: "asc" } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.collection.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="text-sm text-ink/50 hover:text-forest">
        &larr; Products
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-forest">{product.name}</h1>
        {product.isActive ? (
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            className="text-sm text-forest hover:underline"
          >
            View on storefront &#8599;
          </Link>
        ) : (
          <span className="rounded-full bg-ink/5 px-3 py-1 text-xs text-ink/60">Archived - not visible on storefront</span>
        )}
      </div>
      <ProductForm
        action={updateProduct.bind(null, product.id)}
        categories={categories}
        collections={collections}
        initial={{
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: Number(product.price),
          stock: product.stock,
          sku: product.sku,
          isFeatured: product.isFeatured,
          isActive: product.isActive,
          images: product.images.map((img) => img.url),
          categoryId: product.categoryId,
          collectionId: product.collectionId,
          variants: product.variants.map((v) => ({ id: v.id, label: v.label, stock: v.stock })),
          discountPercent: product.discountPercent,
          discountStartsOn: istDay(product.discountStartsAt),
          discountEndsOn: istDay(product.discountEndsAt),
        }}
      />
    </div>
  );
}
