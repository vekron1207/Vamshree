"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import CheckIcon from "@mui/icons-material/CheckRounded";
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
        <Button fullWidth size="large" variant="outlined" color="inherit" disabled>
          Sold out
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {hasVariants ? (
        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink/55">
            Size{variant ? <span className="ml-2 text-ink">{variant.label}</span> : null}
          </p>
          <ToggleButtonGroup
            exclusive
            value={variantId}
            onChange={(_, next: string | null) => {
              if (next) {
                setVariantId(next);
                setNeedSize(false);
              }
            }}
            aria-label="Size"
            sx={{ mt: 1.5, flexWrap: "wrap", gap: 1, "& .MuiToggleButtonGroup-grouped": { border: "1px solid rgba(14,59,34,0.25) !important", borderRadius: "999px !important" } }}
          >
            {variants.map((v) => (
              <ToggleButton
                key={v.id}
                value={v.id}
                disabled={v.stock <= 0}
                color="primary"
                sx={{
                  minWidth: 46,
                  height: 44,
                  px: 1.75,
                  fontSize: 14,
                  textTransform: "none",
                  letterSpacing: 0,
                  transition: "background-color 300ms, color 300ms, border-color 300ms",
                  textDecoration: v.stock <= 0 ? "line-through" : "none",
                  "&.Mui-selected, &.Mui-selected:hover": { backgroundColor: "#0e3b22", color: "#fff" },
                }}
              >
                {v.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Collapse in={needSize}>
            <p role="alert" className="mt-3 text-sm text-terracotta">
              Please choose a size.
            </p>
          </Collapse>
        </div>
      ) : null}

      <Button
        fullWidth
        size="large"
        variant="contained"
        color={added ? "secondary" : "primary"}
        disabled={hasVariants && variant ? !canAddMore : !hasVariants && !canAddMore}
        startIcon={added ? <CheckIcon /> : undefined}
        onClick={() => {
          if (hasVariants && !variant) {
            setNeedSize(true);
            return;
          }
          addItem({ ...product, variantId: variant?.id ?? null, variantLabel: variant?.label ?? null });
          setAdded(true);
          window.setTimeout(() => setAdded(false), 2200);
        }}
      >
        {added ? "Added to bag" : canAddMore || (hasVariants && !variant) ? "Add to bag" : "All available stock is in your bag"}
      </Button>
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
