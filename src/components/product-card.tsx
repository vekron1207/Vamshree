import Link from "next/link";
import { ViewTransition } from "react";
import { formatINR } from "@/lib/format";
import { WishlistButton } from "./wishlist-button";
import { QuickAddButton } from "./quick-add-button";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  saleLabel?: string | null;
  stock: number;
  hasSizes?: boolean;
  image: string | null;
  eyebrow?: string | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <div className="relative">
    <WishlistButton productId={product.id} name={product.name} className="absolute right-3 top-3 z-10" />
    <Link href={`/products/${product.slug}`} className="group block">
      <ViewTransition name={`product-image-${product.slug}`}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] bg-paper">
          {product.image ? (
            // Admin-supplied image URLs can be arbitrary external hosts,
            // so this stays a plain <img> rather than next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
            />
          ) : null}
          {product.saleLabel && product.stock > 0 ? (
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-terracotta px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-cream">
              {product.saleLabel}
            </span>
          ) : null}
          {product.stock <= 0 ? (
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-cream/90 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-ink/70">
              Sold out
            </span>
          ) : null}
        </div>
      </ViewTransition>
      <div className="mt-4 text-center">
        {product.eyebrow ? (
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold">{product.eyebrow}</p>
        ) : null}
        <p className="mt-1 text-sm leading-snug text-ink transition-colors group-hover:text-forest">
          {product.name}
        </p>
        <p className="mt-1 text-sm">
          {product.originalPrice ? (
            <>
              <span className="text-terracotta">{formatINR(product.price)}</span>{" "}
              <span className="text-ink/40 line-through">{formatINR(product.originalPrice)}</span>
            </>
          ) : (
            <span className="text-ink/55">{formatINR(product.price)}</span>
          )}
        </p>
      </div>
    </Link>
    <QuickAddButton
      productId={product.id}
      slug={product.slug}
      name={product.name}
      price={product.price}
      image={product.image}
      stock={product.stock}
      hasSizes={Boolean(product.hasSizes)}
    />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-t-[999px] bg-ink/5" />
          <div className="mx-auto mt-4 h-3 w-2/3 bg-ink/5" />
          <div className="mx-auto mt-2 h-3 w-1/3 bg-ink/5" />
        </div>
      ))}
    </div>
  );
}
