import type { OrderStatus } from "@/generated/prisma/client";

// Customer-facing wording (the admin sees operational labels instead)
export const CUSTOMER_STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  PENDING: { label: "Awaiting payment", tone: "bg-amber-50 text-amber-800 ring-amber-200" },
  PAID: { label: "Order confirmed", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  PROCESSING: { label: "Being prepared", tone: "bg-sky-50 text-sky-800 ring-sky-200" },
  SHIPPED: { label: "On its way", tone: "bg-indigo-50 text-indigo-800 ring-indigo-200" },
  DELIVERED: { label: "Delivered", tone: "bg-forest/10 text-forest ring-forest/20" },
  CANCELLED: { label: "Cancelled", tone: "bg-ink/5 text-ink/60 ring-ink/10" },
  REFUNDED: { label: "Refunded", tone: "bg-rose-50 text-rose-800 ring-rose-200" },
};

export const PROGRESS_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PAID", label: "Confirmed" },
  { status: "PROCESSING", label: "Prepared" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "DELIVERED", label: "Delivered" },
];

export function progressIndex(status: OrderStatus) {
  return PROGRESS_STEPS.findIndex((s) => s.status === status);
}

export function CustomerStatusBadge({ status }: { status: OrderStatus }) {
  const s = CUSTOMER_STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs ring-1 ring-inset ${s.tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {s.label}
    </span>
  );
}
