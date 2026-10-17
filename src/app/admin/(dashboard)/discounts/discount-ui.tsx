"use client";

import { useRef, useState, useTransition } from "react";
import { useSubmit } from "@/lib/use-submit";
import { createDiscount, deleteDiscount, setDiscountActive } from "./actions";

const inputClass =
  "w-full rounded-lg border border-ink/12 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-forest/60";

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
  const label = "mb-1 block text-xs font-medium uppercase tracking-[0.08em] text-ink/55";

  return (
    <form ref={formRef} onSubmit={onSubmit} className="rounded-2xl bg-paper p-5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] sm:p-6">
      <h2 className="font-medium text-ink">New discount code</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label>
          <span className={label}>Code</span>
          <input name="code" required placeholder="WELCOME10" className={`${inputClass} uppercase`} />
        </label>
        <label>
          <span className={label}>Type</span>
          <select name="kind" className={inputClass} defaultValue="PERCENT">
            <option value="PERCENT">Percent off</option>
            <option value="FLAT">Flat amount off (₹)</option>
          </select>
        </label>
        <label>
          <span className={label}>Value</span>
          <input name="value" type="number" min={1} required className={inputClass} />
        </label>
        <label>
          <span className={label}>Minimum spend (₹)</span>
          <input name="minSubtotal" type="number" min={0} placeholder="None" className={inputClass} />
        </label>
        <label>
          <span className={label}>Total uses allowed</span>
          <input name="maxUses" type="number" min={1} placeholder="Unlimited" className={inputClass} />
        </label>
        <span />
        <label>
          <span className={label}>Starts (optional)</span>
          <input name="startsAt" type="date" className={inputClass} />
        </label>
        <label>
          <span className={label}>Ends (optional)</span>
          <input name="endsAt" type="date" className={inputClass} />
        </label>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-forest px-6 py-2.5 text-sm text-cream hover:bg-forest-deep disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create code"}
        </button>
        {error ? (
          <span role="alert" className="text-sm text-rose-700">
            {error}
          </span>
        ) : null}
      </div>
    </form>
  );
}

export function DiscountRowActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <span className="flex items-center justify-end gap-4 text-xs">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => void (await setDiscountActive(id, !isActive)))}
        className="text-forest hover:underline disabled:opacity-50"
      >
        {isActive ? "Disable" : "Enable"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm("Delete this code? Past orders keep their discount.")) {
            startTransition(async () => void (await deleteDiscount(id)));
          }
        }}
        className="text-rose-700 hover:underline disabled:opacity-50"
      >
        Delete
      </button>
    </span>
  );
}
