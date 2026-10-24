"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import CheckIcon from "@mui/icons-material/CheckRounded";
import { cartKey, useCart } from "@/lib/cart-context";
import { LinkButton } from "@/components/ui/link-button";

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
  const sx = { mt: 1.5, py: 1.1 } as const;

  if (stock <= 0) {
    return (
      <Button fullWidth size="small" variant="outlined" color="inherit" disabled sx={sx}>
        Sold out
      </Button>
    );
  }

  if (hasSizes) {
    return (
      <LinkButton href={`/products/${slug}`} fullWidth size="small" variant="outlined" sx={sx}>
        Choose size
      </LinkButton>
    );
  }

  const inBag = items.find((i) => cartKey(i) === cartKey({ productId }))?.quantity ?? 0;
  const canAdd = inBag < stock;

  return (
    <Button
      fullWidth
      size="small"
      variant="contained"
      disabled={!canAdd}
      color={added ? "secondary" : "primary"}
      startIcon={added ? <CheckIcon fontSize="small" /> : undefined}
      onClick={() => {
        addItem({ productId, name, price, image });
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
      }}
      sx={sx}
    >
      {added ? "Added" : canAdd ? "Add to bag" : "All in your bag"}
    </Button>
  );
}
