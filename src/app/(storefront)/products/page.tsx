import Link from "next/link";
import { Suspense } from "react";
import { getActiveProducts, type ProductSort } from "@/lib/products";
import { CATEGORIES } from "@/lib/site-content";
import { ProductCard, ProductGridSkeleton } from "@/components/product-card";
import { Reveal } from "@/components/reveal";

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

      <form method="get" action="/products" className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        {category ? <input type="hidden" name="category" value={category.slug} /> : null}
        <label className="block border-b border-ink/20 pb-1 focus-within:border-forest">
          <span className="block text-[10px] uppercase tracking-[0.14em] text-ink/50">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Necklace, pearl, ring..."
            className="w-full bg-transparent py-1.5 text-sm outline-none"
          />
        </label>
        <div className="flex gap-2">
          <label className="block w-24 border-b border-ink/20 pb-1 focus-within:border-forest">
            <span className="block text-[10px] uppercase tracking-[0.14em] text-ink/50">Min ₹</span>
            <input type="number" name="min" min={0} defaultValue={minPrice} className="w-full bg-transparent py-1.5 text-sm outline-none" />
          </label>
          <label className="block w-24 border-b border-ink/20 pb-1 focus-within:border-forest">
            <span className="block text-[10px] uppercase tracking-[0.14em] text-ink/50">Max ₹</span>
            <input type="number" name="max" min={0} defaultValue={maxPrice} className="w-full bg-transparent py-1.5 text-sm outline-none" />
          </label>
        </div>
        <label className="block border-b border-ink/20 pb-1 focus-within:border-forest">
          <span className="block text-[10px] uppercase tracking-[0.14em] text-ink/50">Sort</span>
          <select name="sort" defaultValue={sort} className="w-full bg-transparent py-1.5 text-sm outline-none">
            <option value="new">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name A-Z</option>
          </select>
        </label>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-full bg-forest px-6 py-2.5 text-[11px] uppercase tracking-[0.16em] text-cream hover:bg-forest-deep"
          >
            Apply
          </button>
          {filtered || sort !== "new" ? (
            <Link href={category ? `/products?category=${category.slug}` : "/products"} className="text-[11px] uppercase tracking-[0.14em] text-ink/50 hover:text-forest">
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      <nav
        aria-label="Filter by category"
        className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0"
      >
        <FilterPill href="/products" active={!category}>
          All
        </FilterPill>
        {CATEGORIES.map((c) => (
          <FilterPill key={c.slug} href={`/products?category=${c.slug}`} active={category?.slug === c.slug}>
            {c.label}
          </FilterPill>
        ))}
      </nav>

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

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 rounded-full border px-5 py-2 text-[11px] uppercase tracking-[0.16em] transition-colors duration-300 ${
        active
          ? "border-forest bg-forest text-cream"
          : "border-forest/20 text-forest hover:border-forest/60"
      }`}
    >
      {children}
    </Link>
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
