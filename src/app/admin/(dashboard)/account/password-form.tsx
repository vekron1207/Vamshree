"use client";

import { useRef, useState, useTransition } from "react";
import { useSubmit } from "@/lib/use-submit";
import { changeAdminPassword } from "./actions";

const inputClass =
  "w-full rounded-lg border border-ink/12 bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-forest/60 focus:ring-2 focus:ring-forest/10";

export function PasswordForm() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const onSubmit = useSubmit((fd) =>
    startTransition(async () => {
      const res = await changeAdminPassword(fd);
      if (res.ok) {
        setMsg({ ok: true, text: "Password changed." });
        formRef.current?.reset();
      } else setMsg({ ok: false, text: res.error });
    })
  );
  const label = "mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-ink/55";

  return (
    <form ref={formRef} onSubmit={onSubmit} className="max-w-md space-y-4 rounded-2xl bg-paper p-5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] sm:p-6">
      <h2 className="font-medium text-ink">Change password</h2>
      <label className="block">
        <span className={label}>Current password</span>
        <input name="current" type="password" required autoComplete="current-password" className={inputClass} />
      </label>
      <label className="block">
        <span className={label}>New password</span>
        <input name="next" type="password" required minLength={10} autoComplete="new-password" className={inputClass} />
        <span className="mt-1.5 block text-xs text-ink/45">At least 10 characters.</span>
      </label>
      <label className="block">
        <span className={label}>Repeat new password</span>
        <input name="confirm" type="password" required minLength={10} autoComplete="new-password" className={inputClass} />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-forest px-6 py-2.5 text-sm text-cream hover:bg-forest-deep disabled:opacity-50"
        >
          {pending ? "Saving..." : "Change password"}
        </button>
        {msg ? (
          <span role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-forest" : "text-rose-700"}`}>
            {msg.text}
          </span>
        ) : null}
      </div>
    </form>
  );
}
