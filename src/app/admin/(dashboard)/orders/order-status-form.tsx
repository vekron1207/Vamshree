"use client";

import { useState, useTransition } from "react";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { saveTracking, updateOrderStatus } from "./actions";
import type { OrderStatus } from "@/generated/prisma/client";
import { statusLabel } from "../status-badge";
import { AdminInput, FormAlert, SubmitButton } from "@/components/ui/fields";
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
      <Select
        size="small"
        value={status}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            setError(null);
            const res = await updateOrderStatus(orderId, e.target.value as OrderStatus);
            if (!res.ok) setError(res.error);
          })
        }
        inputProps={{ "aria-label": "Order status" }}
        sx={{ borderRadius: 999, minWidth: 160, fontSize: 14 }}
      >
        {STATUSES.map((s) => (
          <MenuItem key={s} value={s}>
            {statusLabel(s)}
          </MenuItem>
        ))}
      </Select>
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

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4 text-sm">
      <AdminInput label="Courier" name="courier" defaultValue={courier ?? ""} placeholder="e.g. Delhivery" />
      <AdminInput label="Tracking number" name="trackingNumber" defaultValue={trackingNumber ?? ""} />
      <AdminInput label="Tracking link (optional)" name="trackingUrl" defaultValue={trackingUrl ?? ""} placeholder="https://" />
      <AdminInput label="Internal note (not shown to customer)" name="adminNote" defaultValue={adminNote ?? ""} multiline minRows={2} />
      <div className="flex items-center gap-3">
        <SubmitButton pending={pending} pendingText="Saving..." size="small">
          Save
        </SubmitButton>
        {message ? <FormAlert severity={message.ok ? "success" : "error"}>{message.text}</FormAlert> : null}
      </div>
    </form>
  );
}
