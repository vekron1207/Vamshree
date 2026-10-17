"use client";

import { useState, useTransition } from "react";
import { saveTracking, updateOrderStatus } from "./actions";
import type { OrderStatus } from "@/generated/prisma/client";
import { statusLabel } from "../status-badge";
import { useSubmit } from "@/lib/use-submit";

const STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export function OrderStatusForm({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <select
        value={status}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            setError(null);
            const res = await updateOrderStatus(orderId, e.target.value as OrderStatus);
            if (!res.ok) setError(res.error);
          })
        }
        className="rounded-full border border-ink/15 bg-paper px-4 py-2 text-sm text-ink outline-none transition-colors focus:border-forest/50 disabled:opacity-50"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {statusLabel(s)}
          </option>
        ))}
      </select>
      {error ? (
        <span role="alert" className="max-w-xs text-right text-xs text-terracotta">
          {error}
        </span>
      ) : null}
    </span>
  );
}

export function TrackingForm({
  orderId,
  courier,
  trackingNumber,
  trackingUrl,
  adminNote,
}: {
  orderId: string;
  courier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  adminNote: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const onSubmit = useSubmit((fd) =>
    startTransition(async () => {
      const res = await saveTracking(orderId, fd);
      setMessage(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: res.error });
    })
  );
  const input =
    "mt-1 w-full rounded-lg border border-ink/15 bg-cream/40 px-3 py-2 text-sm outline-none focus:border-forest/50";

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3 text-sm">
      <label className="block">
        <span className="text-ink/50">Courier</span>
        <input name="courier" defaultValue={courier ?? ""} placeholder="e.g. Delhivery" className={input} />
      </label>
      <label className="block">
        <span className="text-ink/50">Tracking number</span>
        <input name="trackingNumber" defaultValue={trackingNumber ?? ""} className={input} />
      </label>
      <label className="block">
        <span className="text-ink/50">Tracking link (optional)</span>
        <input name="trackingUrl" defaultValue={trackingUrl ?? ""} placeholder="https://" className={input} />
      </label>
      <label className="block">
        <span className="text-ink/50">Internal note (not shown to customer)</span>
        <textarea name="adminNote" rows={2} defaultValue={adminNote ?? ""} className={input} />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-forest px-5 py-2 text-xs uppercase tracking-[0.14em] text-cream disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        {message ? (
          <span role={message.ok ? "status" : "alert"} className={message.ok ? "text-forest" : "text-terracotta"}>
            {message.text}
          </span>
        ) : null}
      </div>
    </form>
  );
}
