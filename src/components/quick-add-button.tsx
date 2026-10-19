"use client";

import Link from "next/link";
import { useState } from "react";
import { cartKey, useCart } from "@/lib/cart-context";

// Add to bag straight from a product card. Pieces sold in sizes need a size
// first, so those send the shopper to the product page instead.
export function QuickAddButton({
  productId,
  slug,
  name,
  price,
  image,
  stock,
  hasSizes,
}: {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  stock: number;
  hasSizes: boolean;
}) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);
  const base = "mt-3 block w-full rounded-full px-4 py-2.5 text-center text-[11px] uppercase tracking-[0.16em]";

  if (stock <= 0) {
    return (
      <p className={`${base} border border-ink/15 text-ink/45`} aria-disabled="true">
        Sold out
      </p>
    );
  }

  if (hasSizes) {
    return (
      <Link
        href={`/products/${slug}`}
        className={`${base} border border-forest/30 text-forest transition-colors hover:bg-forest hover:text-cream`}
      >
        Choose size
      </Link>
    );
  }

  const inBag = items.find((i) => cartKey(i) === cartKey({ productId }))?.quantity ?? 0;
  const canAdd = inBag < stock;

  return (
    <button
      type="button"
      disabled={!canAdd}
      onClick={() => {
        addItem({ productId, name, price, image });
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
      }}
      className={`${base} bg-forest text-cream transition-[background-color] duration-300 hover:bg-forest-deep disabled:opacity-50`}
    >
      {added ? "Added ✓" : canAdd ? "Add to bag" : "All in your bag"}
    </button>
  );
}
