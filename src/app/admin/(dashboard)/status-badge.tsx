import type { OrderStatus } from "@/generated/prisma/client";

const STYLES: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: "Awaiting payment", className: "bg-amber-50 text-amber-800 ring-amber-200" },
  PAID: { label: "Paid", className: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  PROCESSING: { label: "Processing", className: "bg-sky-50 text-sky-800 ring-sky-200" },
  SHIPPED: { label: "Shipped", className: "bg-indigo-50 text-indigo-800 ring-indigo-200" },
  DELIVERED: { label: "Delivered", className: "bg-forest/10 text-forest ring-forest/20" },
  CANCELLED: { label: "Cancelled", className: "bg-ink/5 text-ink/60 ring-ink/10" },
  REFUNDED: { label: "Refunded", className: "bg-rose-50 text-rose-800 ring-rose-200" },
};

export function statusLabel(status: OrderStatus) {
  return STYLES[status].label;
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs ring-1 ring-inset ${s.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {s.label}
    </span>
  );
}
