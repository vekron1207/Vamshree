"use server";

import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";
import { checkPincode, type PincodeResult } from "@/lib/delhivery";
import { priceFor, SALE_FIELDS } from "@/lib/pricing";
import { updateTag } from "next/cache";
import { getCurrentCustomer } from "@/lib/customer-session";
import { isValidPincode, looksLikeEmail, normalizeIndianPhone } from "@/lib/phone";
import { allow, clientIp } from "@/lib/rate-limit";
import { evaluateDiscount, redeemDiscount } from "@/lib/discounts";
import { changeOrderStatus, expireStalePendingOrders, markOrderPaid } from "@/lib/orders";
import { getShippingRule } from "@/lib/settings";
import { shippingFor } from "@/lib/shipping";
import { reserveStock, StockError } from "@/lib/stock";

// Next.js hides the message of any error thrown from a server action in
// production, so problems the customer can fix are returned as results
// (see the wrappers below) rather than thrown to the browser.
class UserError extends Error {}

const GENERIC_FAILURE = "We couldn't complete that. Please try again in a moment.";

export type ShippingDetails = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type CartLine = { productId: string; variantId?: string | null; quantity: number };

const MAX_QTY_PER_LINE = 20;

// Cart contents come from the browser, so treat them as untrusted: merge
// duplicate lines and reject anything that isn't a small positive integer
// (a negative quantity would otherwise subtract from the order total).
function normaliseLines(cartItems: CartLine[]) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new UserError("Your bag is empty.");
  }
  const merged = new Map<string, { productId: string; variantId: string | null; quantity: number }>();
  for (const line of cartItems) {
    const qty = Number(line?.quantity);
    const variantId = typeof line?.variantId === "string" && line.variantId ? line.variantId : null;
    if (typeof line?.productId !== "string" || !Number.isInteger(qty) || qty < 1) {
      throw new UserError("Your bag has an invalid item. Remove it and try again.");
    }
    const key = `${line.productId}:${variantId ?? ""}`;
    const prev = merged.get(key);
    merged.set(key, { productId: line.productId, variantId, quantity: (prev?.quantity ?? 0) + qty });
  }
  for (const l of merged.values()) {
    if (l.quantity > MAX_QTY_PER_LINE) throw new UserError(`You can order up to ${MAX_QTY_PER_LINE} of each piece.`);
  }
  return [...merged.values()];
}

async function priceLines(lines: { productId: string; variantId: string | null; quantity: number }[]) {
  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) }, isActive: true },
    include: { collection: { select: SALE_FIELDS }, variants: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return lines.map((line) => {
    const product = byId.get(line.productId);
    const variant = product && line.variantId ? product.variants.find((v) => v.id === line.variantId) : undefined;
    const pricing = product
      ? priceFor(
          Number(product.price),
          product.compareAtPrice ? Number(product.compareAtPrice) : null,
          product.collection,
          product
        )
      : null;
    return { line, product, variant, pricing };
  });
}

export type CartQuote = {
  productId: string;
  variantId: string | null;
  price: number | null;
  available: boolean;
  stock: number;
}[];

// Current prices for the bag, so it reflects sales that started or ended
// after an item was added. Checkout re-prices on the server regardless.
export async function quoteCart(items: { productId: string; variantId?: string | null }[]): Promise<CartQuote> {
  const seen = new Set<string>();
  const lines: { productId: string; variantId: string | null; quantity: number }[] = [];
  for (const it of Array.isArray(items) ? items.slice(0, 50) : []) {
    if (typeof it?.productId !== "string") continue;
    const variantId = typeof it.variantId === "string" && it.variantId ? it.variantId : null;
    const key = `${it.productId}:${variantId ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push({ productId: it.productId, variantId, quantity: 1 });
  }
  if (lines.length === 0) return [];
  const priced = await priceLines(lines);
  return priced.map(({ line, product, variant, pricing }) => {
    const variantMissing = Boolean(line.variantId) && !variant;
    return {
      productId: line.productId,
      variantId: line.variantId,
      price: pricing?.price ?? null,
      available: Boolean(product) && !variantMissing,
      stock: line.variantId ? (variant?.stock ?? 0) : (product?.stock ?? 0),
    };
  });
}

// Checkout settings the bag page needs (shipping rule)
export async function getCheckoutConfig() {
  return { shipping: await getShippingRule() };
}

export type DiscountPreview = { ok: true; code: string; amount: number; description: string } | { ok: false; error: string };

// Lets the checkout tell the customer straight away whether we can deliver to a PIN code
export async function checkDeliveryPincode(pin: string): Promise<PincodeResult> {
  if (!allow(`pincode:${await clientIp()}`, 60, 10 * 60 * 1000)) return { status: "unknown" };
  return checkPincode(String(pin ?? "").trim());
}

// Previews a code against the current bag. Nothing is used up until checkout.
export async function previewDiscount(code: string, items: CartLine[]): Promise<DiscountPreview> {
  try {
    if (!allow(`discount:${await clientIp()}`, 20, 10 * 60 * 1000)) {
      return { ok: false, error: "Too many attempts. Try again in a few minutes." };
    }
    const priced = await priceLines(normaliseLines(items));
    let subtotal = 0;
    for (const { line, pricing } of priced) subtotal += (pricing?.price ?? 0) * line.quantity;
    return await evaluateDiscount(String(code ?? ""), subtotal);
  } catch (err) {
    if (err instanceof UserError) return { ok: false, error: err.message };
    console.error("previewDiscount failed:", err);
    return { ok: false, error: GENERIC_FAILURE };
  }
}

// Delivery details come from the browser: validate and normalise them here so
// guests can't submit junk, and every stored order has a callable Indian number.
function validateShipping(input: ShippingDetails): ShippingDetails {
  const clean = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);
  const phone = normalizeIndianPhone(clean(input?.phone, 30));
  const email = clean(input?.email, 120).toLowerCase();
  const out = {
    name: clean(input?.name, 80),
    email,
    phone: phone ?? '',
    line1: clean(input?.line1),
    line2: clean(input?.line2) || undefined,
    city: clean(input?.city, 80),
    state: clean(input?.state, 80),
    postalCode: clean(input?.postalCode, 6),
    country: 'India',
  };
  if (out.name.length < 2) throw new UserError("Enter the recipient's full name.");
  if (!looksLikeEmail(email)) throw new UserError('Enter a valid email address.');
  if (!phone) throw new UserError('Enter a valid 10-digit Indian mobile number.');
  if (out.line1.length < 3) throw new UserError('Enter the street address.');
  if (out.city.length < 2) throw new UserError('Enter the city.');
  if (out.state.length < 2) throw new UserError('Enter the state.');
  if (!isValidPincode(out.postalCode)) throw new UserError('Enter a valid 6-digit PIN code.');
  return out;
}

export type CheckoutPrefill = {
  customer: { name: string; email: string; phone: string };
  addresses: {
    id: string;
    label: string;
    isDefault: boolean;
    name: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
  }[];
} | null;

// Signed-in customers get their details and saved addresses pre-filled
export async function loadCheckoutPrefill(): Promise<CheckoutPrefill> {
  const me = await getCurrentCustomer();
  if (!me) return null;
  const addresses = await prisma.address.findMany({
    where: { customerId: me.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });
  return {
    customer: { name: me.name, email: me.email, phone: me.phone ?? '' },
    addresses: addresses.map((a) => ({
      id: a.id,
      label: a.label,
      isDefault: a.isDefault,
      name: a.fullName,
      phone: a.phone ?? '',
      line1: a.line1,
      line2: a.line2 ?? '',
      city: a.city,
      state: a.state,
      postalCode: a.postalCode,
    })),
  };
}

type CheckoutOptions = { saveAddress?: boolean; discountCode?: string; isGift?: boolean; giftMessage?: string };

async function createCheckoutOrderImpl(
  rawShipping: ShippingDetails,
  cartItems: CartLine[],
  options: CheckoutOptions = {}
) {
  const shipping = validateShipping(rawShipping);
  if ((await checkPincode(shipping.postalCode)).status === "unserviceable") {
    throw new UserError("Sorry, we can't deliver to that PIN code yet. Please check it, or contact us.");
  }
  // From the session cookie, never from the request body
  const customer = await getCurrentCustomer();
  const lines = normaliseLines(cartItems);
  const priced = await priceLines(lines);

  // Hand back stock from abandoned checkouts before we try to take any
  await expireStalePendingOrders();

  let subtotal = 0;
  const stockLines: { productId: string; variantId: string | null; quantity: number; label: string }[] = [];
  const orderItemsData = priced.map(({ line, product, variant, pricing }) => {
    if (!product || !pricing) throw new UserError("A product in your bag is no longer available");
    if (line.variantId && !variant) throw new UserError(`${product.name} is no longer available in that size`);
    if (!line.variantId && product.variants.length > 0) {
      throw new UserError(`Choose a size for ${product.name}`);
    }
    if (pricing.price <= 0) throw new UserError(`${product.name} is not available for purchase right now`);
    const label = variant ? `${product.name} (${variant.label})` : product.name;
    subtotal += pricing.price * line.quantity;
    stockLines.push({ productId: product.id, variantId: variant?.id ?? null, quantity: line.quantity, label });
    return {
      productId: product.id,
      variantId: variant?.id ?? null,
      variantLabel: variant?.label ?? null,
      nameSnapshot: product.name,
      priceSnapshot: pricing.price,
      quantity: line.quantity,
    };
  });

  let discountCode: string | null = null;
  let discountAmount = 0;
  if (options.discountCode?.trim()) {
    const d = await evaluateDiscount(options.discountCode, subtotal);
    if (!d.ok) throw new UserError(d.error);
    discountCode = d.code;
    discountAmount = d.amount;
  }

  const shippingFee = shippingFor(subtotal - discountAmount, await getShippingRule());
  const total = subtotal - discountAmount + shippingFee;
  const orderNumber = `VA${Date.now().toString(36).toUpperCase()}`;
  const isGift = Boolean(options.isGift);
  const giftMessage = isGift ? String(options.giftMessage ?? "").trim().slice(0, 300) || null : null;

  // Take the stock and the discount use together with the order, or not at all
  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      await reserveStock(tx, stockLines);
      if (discountCode && !(await redeemDiscount(tx, discountCode))) {
        throw new UserError("That code has just been fully used.");
      }
      return tx.order.create({
        data: {
          orderNumber,
          customerId: customer?.id,
          guestName: shipping.name,
          guestEmail: shipping.email,
          guestPhone: shipping.phone,
          shippingAddress: shipping,
          subtotal,
          shippingFee,
          discountCode,
          discountAmount,
          total,
          stockHeld: true,
          isGift,
          giftMessage,
          items: { create: orderItemsData },
        },
      });
    });
  } catch (err) {
    if (err instanceof StockError) throw new UserError(err.message);
    throw err;
  }
  updateTag("products");

  let razorpayOrder;
  try {
    razorpayOrder = await getRazorpay().orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: orderNumber,
    });
    await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: razorpayOrder.id } });
  } catch (err) {
    // Payment couldn't start: give the stock back straight away
    await changeOrderStatus(order.id, "CANCELLED").catch(() => {});
    updateTag("products");
    throw err;
  }

  if (customer && options.saveAddress) {
    const exists = await prisma.address.findFirst({
      where: { customerId: customer.id, line1: shipping.line1, postalCode: shipping.postalCode },
      select: { id: true },
    });
    const count = await prisma.address.count({ where: { customerId: customer.id } });
    if (!exists && count < 10) {
      await prisma.address.create({
        data: {
          customerId: customer.id,
          label: count === 0 ? "Home" : "Saved at checkout",
          fullName: shipping.name,
          phone: shipping.phone,
          line1: shipping.line1,
          line2: shipping.line2 ?? null,
          city: shipping.city,
          state: shipping.state,
          postalCode: shipping.postalCode,
          country: "India",
          isDefault: count === 0,
        },
      });
    }
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    razorpayOrderId: razorpayOrder.id,
    amount: Math.round(total * 100),
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
  };
}

async function verifyCheckoutPaymentImpl(input: {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("RAZORPAY_KEY_SECRET is not set");

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== input.razorpay_signature) {
    throw new UserError("Payment verification failed");
  }

  const existing = await prisma.order.findUnique({ where: { id: input.orderId } });
  // The signed Razorpay order id must belong to this order
  if (!existing || existing.razorpayOrderId !== input.razorpay_order_id) throw new UserError("Order not found");

  const order = await markOrderPaid(existing.id, input.razorpay_payment_id);
  updateTag("products");
  return { orderNumber: (order ?? existing).orderNumber };
}

export type CheckoutOrderResult =
  | ({ ok: true } & Awaited<ReturnType<typeof createCheckoutOrderImpl>>)
  | { ok: false; error: string };

export async function createCheckoutOrder(
  shipping: ShippingDetails,
  cartItems: CartLine[],
  options: CheckoutOptions = {}
): Promise<CheckoutOrderResult> {
  try {
    return { ok: true, ...(await createCheckoutOrderImpl(shipping, cartItems, options)) };
  } catch (err) {
    if (err instanceof UserError) return { ok: false, error: err.message };
    console.error("createCheckoutOrder failed:", err);
    return { ok: false, error: "We couldn't start the payment. Please try again in a moment." };
  }
}

export type VerifyPaymentResult = { ok: true; orderNumber: string } | { ok: false; error: string };

export async function verifyCheckoutPayment(
  input: Parameters<typeof verifyCheckoutPaymentImpl>[0]
): Promise<VerifyPaymentResult> {
  try {
    const { orderNumber } = await verifyCheckoutPaymentImpl(input);
    return { ok: true, orderNumber };
  } catch (err) {
    if (err instanceof UserError) return { ok: false, error: err.message };
    console.error("verifyCheckoutPayment failed:", err);
    return { ok: false, error: GENERIC_FAILURE };
  }
}
