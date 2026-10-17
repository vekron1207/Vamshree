"use client";

import Link from "next/link";
import { useState } from "react";
import { cartKey, useCart, type CartItem } from "@/lib/cart-context";

type Variant = { id: string; label: string; stock: number };

export function AddToCartButton({
  product,
  stock,
  variants = [],
  className = "",
}: {
  product: Omit<CartItem, "quantity" | "variantId" | "variantLabel">;
  stock: number;
  variants?: Variant[];
  className?: string;
}) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [needSize, setNeedSize] = useState(false);

  const hasVariants = variants.length > 0;
  const variant = variants.find((v) => v.id === variantId) ?? null;
  const available = hasVariants ? (variant?.stock ?? 0) : stock;
  const inBag =
    items.find((i) => cartKey(i) === cartKey({ productId: product.productId, variantId: variant?.id }))?.quantity ?? 0;
  const canAddMore = inBag < available;

  if (stock <= 0) {
    return (
      <div className={className}>
        <p className="rounded-full border border-ink/15 px-8 py-3.5 text-center text-[12px] uppercase tracking-[0.18em] text-ink/50">
          Sold out
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {hasVariants ? (
        <fieldset className="mb-6">
          <legend className="text-[11px] uppercase tracking-[0.18em] text-ink/55">
            Size{variant ? <span className="ml-2 text-ink">{variant.label}</span> : null}
          </legend>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
            {variants.map((v) => (
              <label
                key={v.id}
                className={`relative flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border px-3 text-sm transition-colors ${
                  v.stock <= 0
                    ? "cursor-not-allowed border-ink/10 text-ink/30 line-through"
                    : variantId === v.id
                      ? "border-forest bg-forest text-cream"
                      : "border-forest/25 text-ink hover:border-forest"
                }`}
              >
                <input
                  type="radio"
                  name="size"
                  className="sr-only"
                  disabled={v.stock <= 0}
                  checked={variantId === v.id}
                  onChange={() => {
                    setVariantId(v.id);
                    setNeedSize(false);
                  }}
                />
                {v.label}
              </label>
            ))}
          </div>
          {needSize ? (
            <p role="alert" className="mt-3 text-sm text-terracotta">
              Please choose a size.
            </p>
          ) : null}
        </fieldset>
      ) : null}

      <button
        type="button"
        disabled={hasVariants && variant ? !canAddMore : !hasVariants && !canAddMore}
        onClick={() => {
          if (hasVariants && !variant) {
            setNeedSize(true);
            return;
          }
          addItem({ ...product, variantId: variant?.id ?? null, variantLabel: variant?.label ?? null });
          setAdded(true);
          window.setTimeout(() => setAdded(false), 2200);
        }}
        className="relative w-full overflow-hidden rounded-full bg-forest px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-cream transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-forest-deep disabled:translate-y-0 disabled:opacity-50"
      >
        <span
          className={`block transition-[opacity,transform] duration-500 ${
            added ? "-translate-y-6 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          {canAddMore || (hasVariants && !variant) ? "Add to bag" : "All available stock is in your bag"}
        </span>
        <span
          aria-hidden={!added}
          className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-500 ${
            added ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          Added &#10003;
        </span>
      </button>
      <p className="mt-3 h-5 text-center text-xs text-ink/60" aria-live="polite">
        {inBag > 0 ? (
          <>
            {inBag} in your bag &middot;{" "}
            <Link href="/cart" className="text-forest underline underline-offset-4">
              View bag
            </Link>
          </>
        ) : available > 0 && available <= 3 && (!hasVariants || variant) ? (
          `Only ${available} left`
        ) : null}
      </p>
    </div>
  );
}
