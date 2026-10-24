import Link from "next/link";
import { Suspense } from "react";
import { getActiveProducts, type ProductSort } from "@/lib/products";
import { CATEGORIES } from "@/lib/site-content";
import { ProductCard, ProductGridSkeleton } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { ShopFilters } from "./shop-filters";

export default function ProductsPage(props: PageProps<"/products">) {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-6 sm:pt-14">
      <Suspense fallback={<ShopSkeleton />}>
        <Shop searchParamsPromise={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Shop({
  searchParamsPromise,
}: {
  searchParamsPromise: PageProps<"/products">["searchParams"];
}) {
  const searchParams = await searchParamsPromise;
  const categorySlug =
    typeof searchParams.category === "string" ? searchParams.category : undefined;
  const category = CATEGORIES.find((c) => c.slug === categorySlug);
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const search = one(searchParams.q)?.trim().slice(0, 80) || undefined;
  const sort: ProductSort = (["price-asc", "price-desc", "name"] as const).find((s) => s === one(searchParams.sort)) ?? "new";
  const num = (v: string | undefined) => {
    const n = v === undefined || v === "" ? NaN : Number(v);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const minPrice = num(one(searchParams.min));
  const maxPrice = num(one(searchParams.max));
  const filtered = Boolean(search || minPrice !== undefined || maxPrice !== undefined);
  const products = await getActiveProducts({ categorySlug: category?.slug, search, sort, minPrice, maxPrice });

  return (
    <>
      <header className="text-center">
        <p className="text-[11px] uppercase tracking-[0.24em] text-gold">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>
        <h1 className="mt-3 font-display text-4xl text-forest sm:text-5xl">
          {search ? `Results for "${search}"` : category ? category.label : "All jewellery"}
        </h1>
      </header>

      <ShopFilters
        key={[category?.slug ?? '', search ?? '', minPrice ?? '', maxPrice ?? '', sort].join('|')}
        categories={CATEGORIES.map((c) => ({ slug: c.slug, label: c.label }))}
        initial={{
          q: search ?? '',
          min: minPrice !== undefined ? String(minPrice) : '',
          max: maxPrice !== undefined ? String(maxPrice) : '',
          sort,
          category: category?.slug ?? '',
        }}
      />

      {products.length === 0 ? (
        <div className="mx-auto mt-20 max-w-sm text-center">
          <p className="font-tagline text-xl italic text-ink/70">
            {filtered ? "Nothing matches that search." : category ? `No ${category.label.toLowerCase()} available right now.` : "New pieces arriving soon."}
          </p>
          {category || filtered ? (
            <Link
              href="/products"
              className="mt-6 inline-block text-[12px] uppercase tracking-[0.18em] text-forest underline underline-offset-8"
            >
              See all jewellery
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-14 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={(i % 4) * 80}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}

function ShopSkeleton() {
  return (
    <>
      <div className="mx-auto h-3 w-20 animate-pulse bg-ink/5" />
      <div className="mx-auto mt-4 h-10 w-64 animate-pulse bg-ink/5" />
      <div className="mt-24">
        <ProductGridSkeleton />
      </div>
    </>
  );
}
