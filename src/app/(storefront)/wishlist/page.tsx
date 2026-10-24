"use client";

import { LinkButton } from "@/components/ui/link-button";

import { useEffect, useState } from "react";
import { useWishlist } from "@/lib/wishlist-context";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { loadWishlistProducts } from "./actions";

export default function WishlistPage() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<ProductCardData[] | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    loadWishlistProducts(key.split(","))
      .then((p) => !cancelled && setProducts(p))
      .catch(() => !cancelled && setProducts([]));
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Keep the order they were saved in, and hide anything no longer on sale
  const shown = !key
    ? []
    : products
    ? ids.map((id) => products.find((p) => p.id === id)).filter((p): p is ProductCardData => Boolean(p))
    : null;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-6 sm:pt-14">
      <h1 className="text-center font-display text-4xl text-forest">Wishlist</h1>
      {shown === null ? (
        <p className="mt-16 text-center text-ink/50">Loading...</p>
      ) : shown.length === 0 ? (
        <div className="mx-auto mt-16 max-w-sm text-center">
          <p className="font-tagline text-xl italic text-ink/70">Nothing saved yet. Tap the heart on any piece you love.</p>
          <LinkButton href="/products" variant="contained" size="large" sx={{ mt: 4 }}>
            Shop jewellery
          </LinkButton>
        </div>
      ) : (
        <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-14 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
