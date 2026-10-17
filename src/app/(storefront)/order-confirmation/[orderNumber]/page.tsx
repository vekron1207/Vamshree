import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";

export default function OrderConfirmationPage(
  props: PageProps<"/order-confirmation/[orderNumber]">
) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Suspense fallback={<p className="text-ink/60">Loading your order...</p>}>
        <OrderSummary paramsPromise={props.params} />
      </Suspense>
    </div>
  );
}

async function OrderSummary({
  paramsPromise,
}: {
  paramsPromise: PageProps<"/order-confirmation/[orderNumber]">["params"];
}) {
  await connection();
  const { orderNumber } = await paramsPromise;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div>
      <h1 className="font-display text-3xl text-forest">Thank you!</h1>
      <p className="mt-2 text-ink/60">
        Order {order.orderNumber} -{" "}
        {order.status === "PAID" ? "payment received" : order.status.toLowerCase()}
      </p>
      <ul className="mt-8 divide-y divide-gold/20">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between py-3 text-sm">
            <span>
              {item.nameSnapshot} &times; {item.quantity}
            </span>
            <span>{formatINR(Number(item.priceSnapshot) * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex justify-between border-t border-gold/30 pt-4 text-lg font-medium text-forest">
        <span>Total</span>
        <span>{formatINR(Number(order.total))}</span>
      </div>
    </div>
  );
}
