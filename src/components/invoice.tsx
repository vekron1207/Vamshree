import { formatINR } from "@/lib/format";
import type { BusinessInfo } from "@/lib/settings";
import { PrintButton } from "./print-button";

export type InvoiceOrder = {
  orderNumber: string;
  createdAt: Date;
  paidAt: Date | null;
  status: string;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  shippingAddress: unknown;
  subtotal: unknown;
  shippingFee: unknown;
  discountAmount: unknown;
  discountCode: string | null;
  total: unknown;
  isGift: boolean;
  items: { id: string; nameSnapshot: string; variantLabel: string | null; priceSnapshot: unknown; quantity: number }[];
};

const date = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

// Printable invoice. Gift orders hide prices from the customer copy.
export function Invoice({
  order,
  business,
  hidePricesIfGift = false,
}: {
  order: InvoiceOrder;
  business: BusinessInfo;
  hidePricesIfGift?: boolean;
}) {
  const a = order.shippingAddress as {
    name?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  const hidePrices = hidePricesIfGift && order.isGift;
  const invoiceNo = `${business.invoicePrefix}-${order.orderNumber}`;
  const discount = Number(order.discountAmount);

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-sm text-ink print:p-0 sm:p-12">
      <div className="mb-8 flex justify-end gap-3 print:hidden">
        <PrintButton />
      </div>

      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-ink/15 pb-6">
        <div>
          <h1 className="font-display text-3xl text-forest">{business.legalName}</h1>
          {business.address ? <p className="mt-2 max-w-xs whitespace-pre-line text-ink/70">{business.address}</p> : null}
          {business.gstin ? <p className="mt-1 text-ink/70">GSTIN: {business.gstin}</p> : null}
          {business.phone ? <p className="text-ink/70">{business.phone}</p> : null}
          {business.email ? <p className="text-ink/70">{business.email}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Invoice</p>
          <p className="mt-1 font-mono text-lg">{invoiceNo}</p>
          <p className="mt-2 text-ink/70">Date: {date(order.createdAt)}</p>
          {order.paidAt ? <p className="text-ink/70">Paid: {date(order.paidAt)}</p> : <p className="text-ink/70">Unpaid</p>}
        </div>
      </header>

      <section className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Billed &amp; shipped to</p>
          <address className="mt-2 not-italic leading-relaxed text-ink/80">
            <strong className="font-medium text-ink">{a.name ?? order.guestName}</strong>
            <br />
            {a.line1}
            {a.line2 ? `, ${a.line2}` : ""}
            <br />
            {a.city}, {a.state} {a.postalCode}
            <br />
            India
            {order.guestPhone ? (
              <>
                <br />
                {order.guestPhone}
              </>
            ) : null}
          </address>
        </div>
      </section>

      <table className="mt-8 w-full border-collapse">
        <thead>
          <tr className="border-b border-ink/20 text-left text-[11px] uppercase tracking-[0.14em] text-ink/55">
            <th className="py-2 font-normal">Item</th>
            <th className="py-2 text-right font-normal">Qty</th>
            {hidePrices ? null : <th className="py-2 text-right font-normal">Price</th>}
            {hidePrices ? null : <th className="py-2 text-right font-normal">Amount</th>}
          </tr>
        </thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id} className="border-b border-ink/10">
              <td className="py-3">
                {i.nameSnapshot}
                {i.variantLabel ? <span className="text-ink/55"> (Size {i.variantLabel})</span> : null}
              </td>
              <td className="py-3 text-right tabular-nums">{i.quantity}</td>
              {hidePrices ? null : <td className="py-3 text-right tabular-nums">{formatINR(Number(i.priceSnapshot))}</td>}
              {hidePrices ? null : (
                <td className="py-3 text-right tabular-nums">{formatINR(Number(i.priceSnapshot) * i.quantity)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {hidePrices ? (
        <p className="mt-6 text-ink/60">Packing slip for a gift. Prices are not shown.</p>
      ) : (
        <dl className="ml-auto mt-6 max-w-xs space-y-1.5">
          <div className="flex justify-between text-ink/70">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatINR(Number(order.subtotal))}</dd>
          </div>
          {discount > 0 ? (
            <div className="flex justify-between text-ink/70">
              <dt>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</dt>
              <dd className="tabular-nums">&minus;{formatINR(discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between text-ink/70">
            <dt>Shipping</dt>
            <dd className="tabular-nums">{Number(order.shippingFee) > 0 ? formatINR(Number(order.shippingFee)) : "Free"}</dd>
          </div>
          <div className="flex justify-between border-t border-ink/20 pt-2 text-base font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatINR(Number(order.total))}</dd>
          </div>
          <p className="pt-1 text-xs text-ink/50">Inclusive of all taxes.</p>
        </dl>
      )}

      <p className="mt-12 text-center font-tagline italic text-ink/60">Thank you for choosing Vaamshri. Adorne your story.</p>
    </div>
  );
}
