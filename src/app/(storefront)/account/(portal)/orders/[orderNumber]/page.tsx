import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { formatINR } from "@/lib/format";
import { isDelhivery, trackShipment } from "@/lib/delhivery";
import { formatIndianPhone } from "@/lib/phone";
import { CustomerStatusBadge, PROGRESS_STEPS, progressIndex } from "@/lib/order-display";

// Per-customer data, always fresh: navigations may wait rather than needing a prerendered shell.
export const instant = false;


export default async function AccountOrderDetailPage(props: PageProps<"/account/orders/[orderNumber]">) {
  await connection();
  const { orderNumber } = await props.params;
  const me = await requireCustomer(`/account/orders/${orderNumber}`);

  // Matching on customerId as well as orderNumber is what stops one customer
  // reading another's order by typing a different number into the URL.
  const order = await prisma.order.findFirst({
    where: { orderNumber, customerId: me.id },
    include: {
      items: {
        include: { product: { select: { slug: true, isActive: true, images: { orderBy: { position: "asc" }, take: 1 } } } },
      },
    },
  });
  if (!order) notFound();

  const address = order.shippingAddress as {
    name?: string;
    phone?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  const live = order.trackingNumber && isDelhivery(order.courier) ? await trackShipment(order.trackingNumber) : null;
  const step = progressIndex(order.status);
  const showProgress = step >= 0;
  const terminal = order.status === "CANCELLED" || order.status === "REFUNDED";

  return (
    <div className="space-y-10">
      <div>
        <Link href="/account/orders" className="text-sm text-ink/50 hover:text-forest">
          &larr; All orders
        </Link>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-mono text-2xl text-forest">{order.orderNumber}</h1>
          <CustomerStatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-ink/55">
          Placed {order.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {showProgress ? (
        <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
          {PROGRESS_STEPS.map((s, i) => {
            const done = i <= step;
            return (
              <li key={s.status} className="text-center">
                <div className={`h-1 rounded-full ${done ? "bg-forest" : "bg-ink/10"}`} />
                <p className={`mt-2 text-[11px] uppercase tracking-[0.12em] ${done ? "text-forest" : "text-ink/40"}`}>{s.label}</p>
              </li>
            );
          })}
        </ol>
      ) : terminal ? (
        <p className="border-l-2 border-ink/20 bg-ink/[0.03] px-4 py-3 text-sm text-ink/70">
          {order.status === "CANCELLED"
            ? "This order was cancelled."
            : "This order was refunded. It can take 5-7 working days to reach your account."}{" "}
          <Link href="/contact" className="text-forest underline underline-offset-4">Contact us</Link> if you have questions.
        </p>
      ) : null}

      <section>
        <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">Items</h2>
        <ul className="mt-4 divide-y divide-gold/20 border-y border-gold/25">
          {order.items.map((item) => {
            const img = item.product.images[0]?.url;
            const row = (
              <>
                <span className="h-20 w-16 shrink-0 overflow-hidden rounded-t-full bg-paper">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <span className="flex-1">
                  <span className="block text-ink">{item.nameSnapshot}</span>
                  {item.variantLabel ? <span className="block text-sm text-ink/55">Size {item.variantLabel}</span> : null}
                  <span className="mt-1 block text-sm text-ink/50">
                    {formatINR(Number(item.priceSnapshot))} &times; {item.quantity}
                  </span>
                </span>
                <span className="tabular-nums">{formatINR(Number(item.priceSnapshot) * item.quantity)}</span>
              </>
            );
            return (
              <li key={item.id}>
                {item.product.isActive ? (
                  <Link href={`/products/${item.product.slug}`} className="flex items-center gap-4 py-4 transition-colors hover:bg-paper/60">
                    {row}
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 py-4">{row}</div>
                )}
              </li>
            );
          })}
        </ul>
        <dl className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-ink/65">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatINR(Number(order.subtotal))}</dd>
          </div>
          {Number(order.discountAmount) > 0 ? (
            <div className="flex justify-between text-forest">
              <dt>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</dt>
              <dd className="tabular-nums">&minus;{formatINR(Number(order.discountAmount))}</dd>
            </div>
          ) : null}
          <div className="flex justify-between text-ink/65">
            <dt>Shipping</dt>
            <dd>{Number(order.shippingFee) > 0 ? formatINR(Number(order.shippingFee)) : "Free"}</dd>
          </div>
          <div className="flex justify-between border-t border-gold/30 pt-2 font-display text-lg text-forest">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatINR(Number(order.total))}</dd>
          </div>
        </dl>
      </section>

      {order.courier || order.trackingNumber ? (
        <section className="border border-gold/30 bg-paper p-5">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">Tracking</h2>
          <p className="mt-3 text-sm text-ink/75">
            {order.courier ? <>Shipped with <strong className="font-medium text-ink">{order.courier}</strong>. </> : null}
            {order.trackingNumber ? <>Tracking number <span className="font-mono">{order.trackingNumber}</span>.</> : null}
          </p>
          {live?.ok ? (
            <div className="mt-4 border-t border-gold/25 pt-4">
              <p className="text-sm text-ink">
                <strong className="font-medium">{live.status}</strong>
                {live.location ? <span className="text-ink/60"> &middot; {live.location}</span> : null}
              </p>
              {live.expectedDelivery ? (
                <p className="mt-1 text-sm text-ink/60">
                  Expected by {new Date(live.expectedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
                </p>
              ) : null}
              {live.events.length > 0 ? (
                <ol className="mt-4 space-y-3 border-l border-gold/40 pl-4">
                  {live.events.map((ev, i) => (
                    <li key={i} className="relative text-sm">
                      <span className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${i === 0 ? "bg-forest" : "bg-gold/60"}`} aria-hidden />
                      <span className="block text-ink">{ev.status}</span>
                      <span className="block text-xs text-ink/50">
                        {[ev.location, ev.at ? new Date(ev.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : ""].filter(Boolean).join(" · ")}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}
          {order.trackingUrl ? (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm text-forest underline underline-offset-4"
            >
              Track your parcel
            </a>
          ) : null}
        </section>
      ) : null}

      {order.isGift ? (
        <p className="text-sm text-ink/65">
          Sent as a gift{order.giftMessage ? <>: &ldquo;{order.giftMessage}&rdquo;</> : "."}
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="border border-gold/30 bg-paper p-5">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">Delivering to</h2>
          <address className="mt-3 text-sm not-italic leading-relaxed text-ink/75">
            <strong className="font-medium text-ink">{address.name ?? order.guestName}</strong>
            <br />
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
            <br />
            {address.city}, {address.state} {address.postalCode}
            <br />
            {formatIndianPhone(address.phone ?? order.guestPhone)}
          </address>
        </section>
        <section className="border border-gold/30 bg-paper p-5">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">Payment</h2>
          <p className="mt-3 text-sm text-ink/75">
            {order.paidAt
              ? `Paid on ${order.paidAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
              : "Not paid"}
          </p>
          <p className="mt-1 text-xs text-ink/50">Processed securely by Razorpay.</p>
        </section>
      </div>

      <p className="text-sm">
        <a href={`/invoice/${order.orderNumber}`} target="_blank" className="text-forest underline underline-offset-4">
          View invoice
        </a>
      </p>

      <p className="text-sm text-ink/55">
        Need help with this order?{" "}
        <Link href="/contact" className="text-forest underline underline-offset-4">Contact us</Link> and quote{" "}
        <span className="font-mono">{order.orderNumber}</span>.
      </p>
    </div>
  );
}
