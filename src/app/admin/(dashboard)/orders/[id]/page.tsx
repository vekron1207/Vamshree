import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { OrderStatusForm, TrackingForm } from "../order-status-form";
import { expireStalePendingOrders } from "@/lib/orders";
import { StatusBadge } from "../../status-badge";

// Authenticated admin views always render fresh per request; navigations are
// allowed to wait for data rather than requiring a prerendered shell.
export const instant = false;

export default async function AdminOrderDetailPage(props: PageProps<"/admin/orders/[id]">) {
  await connection();
  const { id } = await props.params;
  await expireStalePendingOrders();
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: { select: { images: { orderBy: { position: "asc" }, take: 1 } } } },
      },
    },
  });
  if (!order) notFound();

  const address = order.shippingAddress as {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  const card = "rounded-2xl bg-paper p-5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] sm:p-6";

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="text-sm text-ink/50 hover:text-forest">
        &larr; All orders
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl text-forest">{order.orderNumber}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink/60">
            <StatusBadge status={order.status} />
            <span>
              Placed{" "}
              {order.createdAt.toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-ink/60">
          <Link
            href={`/admin/invoice/${order.id}`}
            target="_blank"
            className="rounded-full border border-forest/30 px-4 py-2 text-forest hover:bg-forest hover:text-cream"
          >
            Print invoice
          </Link>
          <label className="flex items-center gap-3">
            Update status
            <OrderStatusForm orderId={order.id} status={order.status} />
          </label>
        </div>
      </header>

      {order.adminNote?.startsWith("NEEDS ATTENTION") ? (
        <p role="alert" className="rounded-xl border border-terracotta/40 bg-terracotta/5 px-5 py-4 text-sm text-terracotta">
          {order.adminNote}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className={card}>
          <h2 className="font-medium text-ink">Items</h2>
          <ul className="mt-4 divide-y divide-ink/[0.06]">
            {order.items.map((item) => {
              const img = item.product.images[0]?.url;
              return (
                <li key={item.id} className="flex items-center gap-4 py-3 text-sm">
                  <div className="h-12 w-10 shrink-0 overflow-hidden rounded-t-full bg-cream">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <span className="flex-1 text-ink">
                    {item.nameSnapshot}
                    {item.variantLabel ? <span className="block text-xs text-ink/50">Size {item.variantLabel}</span> : null}
                  </span>
                  <span className="text-ink/50 tabular-nums">
                    {formatINR(Number(item.priceSnapshot))} &times; {item.quantity}
                  </span>
                  <span className="w-24 text-right tabular-nums">
                    {formatINR(Number(item.priceSnapshot) * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-ink/[0.06] pt-4 text-sm">
            <div className="flex justify-between text-ink/60">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatINR(Number(order.subtotal))}</dd>
            </div>
            {Number(order.discountAmount) > 0 ? (
              <div className="flex justify-between text-forest">
                <dt>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</dt>
                <dd className="tabular-nums">&minus;{formatINR(Number(order.discountAmount))}</dd>
              </div>
            ) : null}
            <div className="flex justify-between text-ink/60">
              <dt>Shipping</dt>
              <dd className="tabular-nums">{formatINR(Number(order.shippingFee))}</dd>
            </div>
            <div className="flex justify-between pt-1 font-medium text-ink">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatINR(Number(order.total))}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-6">
          <section className={card}>
            <h2 className="font-medium text-ink">Customer</h2>
            <p className="mt-3 text-sm text-ink">{order.guestName}</p>
            {order.customerId ? (
              <Link href={`/admin/customers/${order.customerId}`} className="mt-1 inline-block text-xs text-forest underline underline-offset-4">
                View account
              </Link>
            ) : (
              <p className="mt-1 text-xs text-ink/45">Guest checkout</p>
            )}
            {order.guestEmail ? (
              <a href={`mailto:${order.guestEmail}`} className="block text-sm text-forest hover:underline">
                {order.guestEmail}
              </a>
            ) : null}
            {order.guestPhone ? (
              <a href={`tel:${order.guestPhone}`} className="block text-sm text-forest hover:underline">
                {order.guestPhone}
              </a>
            ) : null}
          </section>

          <section className={card}>
            <h2 className="font-medium text-ink">Ship to</h2>
            <address className="mt-3 text-sm not-italic leading-relaxed text-ink/75">
              {address.line1}
              {address.line2 ? (
                <>
                  <br />
                  {address.line2}
                </>
              ) : null}
              <br />
              {address.city}, {address.state} {address.postalCode}
              <br />
              {address.country}
            </address>
          </section>

          {order.isGift ? (
            <section className={card}>
              <h2 className="font-medium text-ink">Gift order</h2>
              <p className="mt-3 text-sm text-ink/75">
                {order.giftMessage ? <>&ldquo;{order.giftMessage}&rdquo;</> : "No message. Gift-wrap please."}
              </p>
            </section>
          ) : null}

          <section className={card}>
            <h2 className="font-medium text-ink">Shipping &amp; tracking</h2>
            {order.shippedAt ? (
              <p className="mt-1 text-xs text-ink/50">Shipped {order.shippedAt.toLocaleDateString("en-IN")}</p>
            ) : null}
            <TrackingForm
              key={`${order.courier}|${order.trackingNumber}|${order.trackingUrl}|${order.adminNote}`}
              orderId={order.id}
              courier={order.courier}
              trackingNumber={order.trackingNumber}
              trackingUrl={order.trackingUrl}
              adminNote={order.adminNote?.startsWith("NEEDS ATTENTION") ? null : order.adminNote}
            />
          </section>

          <section className={card}>
            <h2 className="font-medium text-ink">Payment</h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink/50">Paid at</dt>
                <dd>{order.paidAt ? order.paidAt.toLocaleString("en-IN") : "Not paid"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink/50">Razorpay payment</dt>
                <dd className="truncate font-mono text-xs">{order.razorpayPaymentId ?? "-"}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
