"use client";

import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddIcon from "@mui/icons-material/AddRounded";
import RemoveIcon from "@mui/icons-material/RemoveRounded";
import { LinkButton } from "@/components/ui/link-button";
import { cartKey, useCart } from "@/lib/cart-context";
import { usePriceSync } from "../use-price-sync";
import { formatINR } from "@/lib/format";
import { amountToFreeShipping, shippingFor } from "@/lib/shipping";
import { useShippingRule } from "../use-shipping-rule";

export default function CartPage() {
  const { items, setQuantity, removeItem, subtotal, itemCount } = useCart();
  usePriceSync();
  const { rule } = useShippingRule();
  const shippingFee = shippingFor(subtotal, rule);
  const toFree = amountToFreeShipping(subtotal, rule);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-4xl text-forest">Your bag</h1>
        <p className="mt-6 font-tagline text-xl italic text-ink/70">Nothing here yet.</p>
        <LinkButton href="/products" variant="contained" size="large" sx={{ mt: 5 }}>
          Shop jewellery
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-6 sm:pt-14">
      <h1 className="text-center font-display text-4xl text-forest">Your bag</h1>
      <p className="mt-3 text-center text-[11px] uppercase tracking-[0.22em] text-gold">
        {itemCount} {itemCount === 1 ? "piece" : "pieces"}
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <ul className="divide-y divide-gold/25 border-y border-gold/25">
          {items.map((item) => (
            <li key={cartKey(item)} className="flex gap-5 py-6">
              <div className="h-28 w-24 shrink-0 overflow-hidden rounded-t-[999px] bg-paper">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="leading-snug text-ink">{item.name}</p>
                    {item.variantLabel ? <p className="mt-0.5 text-sm text-ink/55">Size {item.variantLabel}</p> : null}
                  </div>
                  <p className="shrink-0 text-ink/80">{formatINR(item.price * item.quantity)}</p>
                </div>
                <p className="mt-1 text-sm text-ink/50">{formatINR(item.price)} each</p>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <ButtonGroup variant="outlined" size="small" aria-label="Quantity" sx={{ "& .MuiButton-root": { minWidth: 36, px: 0, py: 0.75, borderColor: "rgba(14,59,34,0.25)" } }}>
                    <Button aria-label={`Decrease quantity of ${item.name}`} onClick={() => setQuantity(cartKey(item), item.quantity - 1)}>
                      <RemoveIcon fontSize="small" />
                    </Button>
                    <Button disableRipple tabIndex={-1} aria-live="polite" sx={{ pointerEvents: "none", color: "text.primary", fontVariantNumeric: "tabular-nums" }}>
                      {item.quantity}
                    </Button>
                    <Button aria-label={`Increase quantity of ${item.name}`} onClick={() => setQuantity(cartKey(item), item.quantity + 1)}>
                      <AddIcon fontSize="small" />
                    </Button>
                  </ButtonGroup>
                  <IconButton aria-label={`Remove ${item.name}`} onClick={() => removeItem(cartKey(item))} size="small" sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit border border-gold/30 bg-paper p-6 sm:p-8 lg:sticky lg:top-24">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between text-ink/70">
              <dt>Subtotal</dt>
              <dd>{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-ink/70">
              <dt>Shipping</dt>
              <dd>{shippingFee === 0 ? "Free" : formatINR(shippingFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-gold/30 pt-4 font-display text-lg text-forest">
              <dt>Total</dt>
              <dd>{formatINR(subtotal + shippingFee)}</dd>
            </div>
          </dl>
          {toFree ? (
            <p className="mt-4 text-sm text-gold">Add {formatINR(toFree)} more for free shipping.</p>
          ) : null}
          <p className="mt-3 text-xs text-ink/50">Discount codes can be applied at checkout.</p>
          <LinkButton href="/checkout" variant="contained" size="large" fullWidth sx={{ mt: 4 }}>
            Checkout
          </LinkButton>
          <LinkButton href="/products" variant="text" size="small" fullWidth sx={{ mt: 1.5 }}>
            Continue shopping
          </LinkButton>
        </aside>
      </div>
    </div>
  );
}
