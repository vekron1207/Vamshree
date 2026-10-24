"use client";

import { useRef, useState, useTransition } from "react";
import { AdminInput, FormAlert, SubmitButton } from "@/components/ui/fields";
import { useSubmit } from "@/lib/use-submit";
import { changeAdminPassword } from "./actions";

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

  return (
    <form ref={formRef} onSubmit={onSubmit} className="max-w-md space-y-5 rounded-2xl bg-paper p-5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] sm:p-6">
      <h2 className="font-medium text-ink">Change password</h2>
      <AdminInput label="Current password" name="current" type="password" required htmlInput={{ autoComplete: "current-password" }} />
      <AdminInput label="New password" name="next" type="password" required hint="At least 10 characters." htmlInput={{ minLength: 10, autoComplete: "new-password" }} />
      <AdminInput label="Repeat new password" name="confirm" type="password" required htmlInput={{ minLength: 10, autoComplete: "new-password" }} />
      <div className="flex items-center gap-3">
        <SubmitButton pending={pending} pendingText="Saving..." size="small">
          Change password
        </SubmitButton>
        {msg ? <FormAlert severity={msg.ok ? "success" : "error"}>{msg.text}</FormAlert> : null}
      </div>
    </form>
  );
}
