import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { PasswordForm } from "./password-form";

export const instant = false;

export default async function AdminAccountPage() {
  await connection();
  const session = await requireAdmin();
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Signed in as</p>
        <h1 className="mt-1 font-display text-3xl text-forest">My account</h1>
        <p className="mt-1 text-sm text-ink/55">{session.email}</p>
      </header>
      <PasswordForm />
    </div>
  );
}
