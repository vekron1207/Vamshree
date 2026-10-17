"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { cartKey, useCart } from "@/lib/cart-context";
import { usePriceSync } from "../use-price-sync";
import { useShippingRule } from "../use-shipping-rule";
import { amountToFreeShipping, shippingFor } from "@/lib/shipping";
import { formatINR } from "@/lib/format";
import {
  createCheckoutOrder,
  loadCheckoutPrefill,
  previewDiscount,
  type DiscountPreview,
  verifyCheckoutPayment,
  type CheckoutPrefill,
  type ShippingDetails,
} from "./actions";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const emptyForm: ShippingDetails = {
  name: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  usePriceSync();
  const router = useRouter();
  const [form, setForm] = useState<ShippingDetails>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<CheckoutPrefill>(null);
  const [prefillLoaded, setPrefillLoaded] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null); // saved address id, or null = new
  const [saveAddress, setSaveAddress] = useState(true);
  const { rule } = useShippingRule();
  const [codeInput, setCodeInput] = useState("");
  const [appliedDiscount, setDiscount] = useState<(Extract<DiscountPreview, { ok: true }> & { bagKey: string }) | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeBusy, setCodeBusy] = useState(false);
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");

  // Any bag change can invalidate an applied code (minimum spend, amount)
  const bagKey = items.map((i) => cartKey(i) + "x" + i.quantity + "@" + i.price).join("|");
  const discount = appliedDiscount?.bagKey === bagKey ? appliedDiscount : null;
  const discountAmount = discount?.amount ?? 0;
  const afterDiscount = subtotal - discountAmount;
  const shippingFee = shippingFor(afterDiscount, rule);
  const total = afterDiscount + shippingFee;
  const toFree = amountToFreeShipping(afterDiscount, rule);

  async function applyCode() {
    setCodeError(null);
    setCodeBusy(true);
    try {
      const res = await previewDiscount(
        codeInput,
        items.map((i) => ({ productId: i.productId, variantId: i.variantId ?? null, quantity: i.quantity }))
      );
      if (res.ok) setDiscount({ ...res, bagKey });
      else setCodeError(res.error);
    } catch {
      setCodeError("Couldn't check that code. Try again.");
    } finally {
      setCodeBusy(false);
    }
  }

  // Signed-in customers: fill in their details and default address once
  useEffect(() => {
    let cancelled = false;
    loadCheckoutPrefill()
      .then((data) => {
        if (cancelled) return;
        setPrefill(data);
        if (data) {
          const def = data.addresses.find((a) => a.isDefault) ?? data.addresses[0];
          setForm((f) => ({
            ...f,
            name: def?.name || data.customer.name,
            email: data.customer.email,
            phone: def?.phone || data.customer.phone,
            ...(def ? { line1: def.line1, line2: def.line2, city: def.city, state: def.state, postalCode: def.postalCode } : {}),
          }));
          setSelectedAddress(def?.id ?? null);
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setPrefillLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  function chooseAddress(id: string | null) {
    setSelectedAddress(id);
    const a = prefill?.addresses.find((x) => x.id === id);
    setForm((f) =>
      a
        ? { ...f, name: a.name, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, state: a.state, postalCode: a.postalCode }
        : { ...f, line1: '', line2: '', city: '', state: '', postalCode: '' }
    );
  }

  function update<K extends keyof ShippingDetails>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const cartLines = items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId ?? null,
        quantity: i.quantity,
      }));
      const order = await createCheckoutOrder(form, cartLines, {
        saveAddress: Boolean(prefill) && selectedAddress === null && saveAddress,
        discountCode: discount?.code,
        isGift,
        giftMessage: isGift ? giftMessage : undefined,
      });
      if (!order.ok) {
        setError(order.error);
        setSubmitting(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "Vaamshri",
        theme: { color: "#0e3b22" },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const result = await verifyCheckoutPayment({
            orderId: order.orderId,
            ...response,
          });
          if (!result.ok) {
            // The money has moved: don't invite a retry that could charge twice.
            setError(
              `Your payment went through, but we couldn't confirm the order here. Don't pay again - contact us with order ${order.orderNumber} and we'll sort it out.`
            );
            setSubmitting(false);
            return;
          }
          clear();
          router.push(`/order-confirmation/${order.orderNumber}`);
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be started. Try again.");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="font-tagline text-xl italic text-ink/70">Your bag is empty.</p>
        <Link
          href="/products"
          className="mt-8 inline-block rounded-full bg-forest px-9 py-3.5 text-[12px] uppercase tracking-[0.18em] text-cream"
        >
          Shop jewellery
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-6 sm:pt-14">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <h1 className="text-center font-display text-4xl text-forest">Checkout</h1>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
        <form onSubmit={handleSubmit} className="animate-rise-in">
          {prefillLoaded && !prefill ? (
            <p className="mb-8 border border-gold/30 bg-paper px-5 py-4 text-sm text-ink/70">
              Have an account?{" "}
              <Link href="/account/login?next=/checkout" className="text-forest underline underline-offset-4">
                Sign in
              </Link>{" "}
              to use your saved addresses and track this order, or{" "}
              <Link href="/account/signup?next=/checkout" className="text-forest underline underline-offset-4">
                create an account
              </Link>
              . You can also check out as a guest.
            </p>
          ) : null}
          {prefill ? (
            <p className="mb-8 text-sm text-ink/60">
              Signed in as <span className="text-ink">{prefill.customer.email}</span>
            </p>
          ) : null}

          <fieldset>
            <legend className="text-[11px] uppercase tracking-[0.22em] text-gold">Contact</legend>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" className="sm:col-span-2">
                <input required autoComplete="name" value={form.name} onChange={(e) => update("name", e.target.value)} />
              </Field>
              <Field label="Email">
                <input required type="email" autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </Field>
              <Field label="Mobile number">
                <input required type="tel" autoComplete="tel" inputMode="tel" placeholder="98765 43210" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </Field>
            </div>
          </fieldset>

          <fieldset className="mt-10">
            <legend className="text-[11px] uppercase tracking-[0.22em] text-gold">Delivery address</legend>
            {prefill && prefill.addresses.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Saved addresses">
                {prefill.addresses.map((a) => (
                  <label
                    key={a.id}
                    className={`cursor-pointer border p-4 text-sm leading-relaxed transition-colors ${
                      selectedAddress === a.id ? "border-forest bg-paper" : "border-gold/30 hover:border-gold"
                    }`}
                  >
                    <input type="radio" name="savedAddress" className="sr-only" checked={selectedAddress === a.id} onChange={() => chooseAddress(a.id)} />
                    <span className="block text-[11px] uppercase tracking-[0.18em] text-gold">{a.label}</span>
                    <span className="mt-1 block text-ink">{a.name}</span>
                    <span className="block text-ink/65">
                      {a.line1}, {a.city} {a.postalCode}
                    </span>
                  </label>
                ))}
                <label
                  className={`cursor-pointer border p-4 text-sm transition-colors ${
                    selectedAddress === null ? "border-forest bg-paper" : "border-gold/30 hover:border-gold"
                  }`}
                >
                  <input type="radio" name="savedAddress" className="sr-only" checked={selectedAddress === null} onChange={() => chooseAddress(null)} />
                  <span className="block text-ink">+ Use a new address</span>
                </label>
              </div>
            ) : null}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Address" className="sm:col-span-2">
                <input required autoComplete="address-line1" value={form.line1} onChange={(e) => update("line1", e.target.value)} />
              </Field>
              <Field label="Apartment, landmark (optional)" className="sm:col-span-2">
                <input autoComplete="address-line2" value={form.line2} onChange={(e) => update("line2", e.target.value)} />
              </Field>
              <Field label="City">
                <input required autoComplete="address-level2" value={form.city} onChange={(e) => update("city", e.target.value)} />
              </Field>
              <Field label="State">
                <input required autoComplete="address-level1" value={form.state} onChange={(e) => update("state", e.target.value)} />
              </Field>
              <Field label="PIN code">
                <input required inputMode="numeric" autoComplete="postal-code" value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
              </Field>
              <Field label="Country">
                <input readOnly aria-readonly="true" autoComplete="country-name" value="India" className="text-ink/60" />
              </Field>
            </div>
            {prefill && selectedAddress === null ? (
              <label className="mt-5 flex items-center gap-2.5 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="h-4 w-4 accent-forest"
                />
                Save this address to my account
              </label>
            ) : null}
          </fieldset>

          <fieldset className="mt-10">
            <legend className="text-[11px] uppercase tracking-[0.22em] text-gold">Gift options</legend>
            <label className="mt-5 flex items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={isGift}
                onChange={(e) => setIsGift(e.target.checked)}
                className="h-4 w-4 accent-forest"
              />
              This is a gift (no prices on the packing slip, gift-wrapped)
            </label>
            {isGift ? (
              <label className="mt-4 block border-b border-ink/20 pb-1 focus-within:border-forest">
                <span className="block text-[11px] uppercase tracking-[0.12em] text-ink/50">Gift message (optional)</span>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  className="w-full resize-none bg-transparent py-1.5 text-ink outline-none"
                />
              </label>
            ) : null}
          </fieldset>

          {error ? (
            <p role="alert" className="mt-6 border-l-2 border-terracotta bg-terracotta/5 px-4 py-3 text-sm text-terracotta">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-10 w-full rounded-full bg-forest px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-cream transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-forest-deep disabled:translate-y-0 disabled:opacity-60"
          >
            {submitting ? "Opening secure payment..." : `Pay ${formatINR(total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-ink/50">
            Payment is processed securely by Razorpay.
          </p>
        </form>

        <aside className="h-fit border border-gold/30 bg-paper p-6 sm:p-8 lg:sticky lg:top-24">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Your bag</p>
          <ul className="mt-6 space-y-5">
            {items.map((item) => (
              <li key={cartKey(item)} className="flex items-center gap-4">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-t-[999px] bg-cream">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  ) : null}
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-forest text-[10px] text-cream">
                    {item.quantity}
                  </span>
                </div>
                <p className="flex-1 text-sm leading-snug">
                  {item.name}
                  {item.variantLabel ? <span className="block text-xs text-ink/55">Size {item.variantLabel}</span> : null}
                </p>
                <p className="text-sm text-ink/70">{formatINR(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 border-t border-gold/30 pt-5">
            {discount ? (
              <p className="flex items-center justify-between text-sm text-forest">
                <span>
                  Code <strong>{discount.code}</strong> applied ({discount.description})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDiscount(null);
                    setCodeInput("");
                  }}
                  className="text-[11px] uppercase tracking-[0.14em] text-ink/50 hover:text-terracotta"
                >
                  Remove
                </button>
              </p>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (codeInput.trim()) void applyCode();
                      }
                    }}
                    placeholder="Discount code"
                    aria-label="Discount code"
                    autoCapitalize="characters"
                    className="min-w-0 flex-1 border-b border-ink/20 bg-transparent py-2 text-sm uppercase outline-none focus:border-forest"
                  />
                  <button
                    type="button"
                    disabled={codeBusy || !codeInput.trim()}
                    onClick={applyCode}
                    className="rounded-full border border-forest px-5 py-2 text-[11px] uppercase tracking-[0.16em] text-forest transition-colors hover:bg-forest hover:text-cream disabled:opacity-40"
                  >
                    {codeBusy ? "..." : "Apply"}
                  </button>
                </div>
                {codeError ? (
                  <p role="alert" className="mt-2 text-sm text-terracotta">
                    {codeError}
                  </p>
                ) : null}
              </div>
            )}
          </div>
          <dl className="mt-5 space-y-2 border-t border-gold/30 pt-5 text-sm">
            <div className="flex justify-between text-ink/70">
              <dt>Subtotal</dt>
              <dd>{formatINR(subtotal)}</dd>
            </div>
            {discount ? (
              <div className="flex justify-between text-forest">
                <dt>Discount</dt>
                <dd>&minus;{formatINR(discountAmount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between text-ink/70">
              <dt>Shipping</dt>
              <dd>{shippingFee === 0 ? "Free" : formatINR(shippingFee)}</dd>
            </div>
            <div className="flex justify-between pt-3 font-display text-lg text-forest">
              <dt>Total</dt>
              <dd>{formatINR(total)}</dd>
            </div>
          </dl>
          {toFree ? <p className="mt-4 text-sm text-gold">Add {formatINR(toFree)} more for free shipping.</p> : null}
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactElement;
}) {
  return (
    <label
      className={`block border-b border-ink/20 pb-1 transition-colors focus-within:border-forest ${className}`}
    >
      <span className="block text-[11px] uppercase tracking-[0.12em] text-ink/50">{label}</span>
      <span className="block [&>input]:w-full [&>input]:bg-transparent [&>input]:py-1.5 [&>input]:text-ink [&>input]:outline-none">
        {children}
      </span>
    </label>
  );
}
