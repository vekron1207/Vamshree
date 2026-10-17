import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/settings";
import { ProductTable, type AdminProductRow } from "./product-table";

// Authenticated admin views always render fresh per request; navigations are
// allowed to wait for data rather than requiring a prerendered shell.
export const instant = false;

export default async function AdminProductsPage(props: PageProps<"/admin/products">) {
  await connection();
  const { status } = await props.searchParams;
  const initialStatus =
    status === "live" || status === "archived" ? status : "all";

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      category: { select: { name: true } },
      collection: { select: { name: true } },
    },
  });

  const rows: AdminProductRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    stock: p.stock,
    isActive: p.isActive,
    image: p.images[0]?.url ?? null,
    category: p.category?.name ?? null,
    collection: p.collection?.name ?? null,
  }));

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Catalogue</p>
          <h1 className="mt-1 font-display text-3xl text-forest">Products</h1>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-forest px-5 py-2.5 text-sm text-cream transition-colors hover:bg-forest-deep"
        >
          Add product
        </Link>
      </header>

      <ProductTable products={rows} initialStatus={initialStatus} lowStockThreshold={(await getStoreSettings()).lowStockThreshold} />
    </div>
  );
}
