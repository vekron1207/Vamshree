"use client";

import { useEffect } from "react";
import { cartKey, useCart } from "@/lib/cart-context";
import { quoteCart } from "./checkout/actions";

// Re-price the bag against the server once per visit, so a sale that started
// or ended since an item was added shows the right amount before payment.
export function usePriceSync() {
  const { items, syncPrices } = useCart();
  const key = items.map((i) => cartKey(i)).sort().join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    quoteCart(
      key.split(",").map((k) => {
        const [productId, variantId] = k.split(":");
        return { productId, variantId: variantId || null };
      })
    )
      .then((quote) => {
        if (!cancelled) syncPrices(quote);
      })
      .catch(() => {
        // Non-fatal: checkout re-prices on the server anyway
      });
    return () => {
      cancelled = true;
    };
  }, [key, syncPrices]);
}
