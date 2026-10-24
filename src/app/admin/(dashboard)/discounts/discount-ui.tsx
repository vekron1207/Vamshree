"use client";

import { useRef, useState, useTransition } from "react";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import { AdminInput, AdminSelect, FormAlert, SubmitButton } from "@/components/ui/fields";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useSubmit } from "@/lib/use-submit";
import { createDiscount, deleteDiscount, setDiscountActive } from "./actions";

export function NewDiscountForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const onSubmit = useSubmit((fd) =>
    startTransition(async () => {
      const res = await createDiscount(fd);
      if (res.ok) {
        setError(null);
        formRef.current?.reset();
      } else setError(res.error);
    })
  );

  return (
    <form ref={formRef} onSubmit={onSubmit} className="rounded-2xl bg-paper p-5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] sm:p-6">
      <h2 className="font-medium text-ink">New discount code</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <AdminInput label="Code" name="code" required placeholder="WELCOME10" htmlInput={{ style: { textTransform: "uppercase" } }} />
        <AdminSelect label="Type" name="kind" defaultValue="PERCENT">
          <MenuItem value="PERCENT">Percent off</MenuItem>
          <MenuItem value="FLAT">Flat amount off (₹)</MenuItem>
        </AdminSelect>
        <AdminInput label="Value" name="value" type="number" required htmlInput={{ min: 1 }} />
        <AdminInput label="Minimum spend (₹)" name="minSubtotal" type="number" placeholder="None" htmlInput={{ min: 0 }} />
        <AdminInput label="Total uses allowed" name="maxUses" type="number" placeholder="Unlimited" htmlInput={{ min: 1 }} />
        <span />
        <AdminInput label="Starts (optional)" name="startsAt" type="date" />
        <AdminInput label="Ends (optional)" name="endsAt" type="date" />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <SubmitButton pending={pending} pendingText="Creating..." size="small">
          Create code
        </SubmitButton>
        <FormAlert>{error}</FormAlert>
      </div>
    </form>
  );
}

export function DiscountRowActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  return (
    <span className="flex items-center justify-end gap-1">
      <Button
        size="small"
        variant="text"
        disabled={pending}
        onClick={() => startTransition(async () => void (await setDiscountActive(id, !isActive)))}
      >
        {isActive ? "Disable" : "Enable"}
      </Button>
      <Button size="small" variant="text" color="error" disabled={pending} onClick={() => setConfirming(true)}>
        Delete
      </Button>
      <ConfirmDialog
        open={confirming}
        title="Delete this code?"
        confirmLabel="Delete"
        danger
        onClose={() => setConfirming(false)}
        onConfirm={() => startTransition(async () => void (await deleteDiscount(id)))}
      >
        Past orders keep their discount.
      </ConfirmDialog>
    </span>
  );
}
