"use client";

import Link from "next/link";
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
        <Link
          href="/products"
          className="mt-10 inline-block rounded-full bg-forest px-9 py-3.5 text-[12px] uppercase tracking-[0.18em] text-cream transition-colors hover:bg-forest-deep"
        >
          Shop jewellery
        </Link>
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
                  <div className="flex items-center rounded-full border border-forest/25">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${item.name}`}
                      onClick={() => setQuantity(cartKey(item), item.quantity - 1)}
                      className="h-9 w-9 text-forest transition-colors hover:text-gold"
                    >
                      &minus;
                    </button>
                    <span className="w-6 text-center text-sm tabular-nums" aria-live="polite">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${item.name}`}
                      onClick={() => setQuantity(cartKey(item), item.quantity + 1)}
                      className="h-9 w-9 text-forest transition-colors hover:text-gold"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(cartKey(item))}
                    className="text-[11px] uppercase tracking-[0.14em] text-ink/50 transition-colors hover:text-terracotta"
                  >
                    Remove
                  </button>
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
          <Link
            href="/checkout"
            className="mt-8 block rounded-full bg-forest px-8 py-4 text-center text-[12px] uppercase tracking-[0.18em] text-cream transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-forest-deep"
          >
            Checkout
          </Link>
          <Link
            href="/products"
            className="mt-4 block text-center text-[11px] uppercase tracking-[0.16em] text-forest/70 hover:text-forest"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
