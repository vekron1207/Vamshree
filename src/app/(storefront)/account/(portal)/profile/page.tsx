import { connection } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { formatIndianPhone } from "@/lib/phone";
import { logoutAction } from "../../auth-actions";
import { PasswordForm, ProfileForm } from "./profile-forms";

// Per-customer data, always fresh: navigations may wait rather than needing a prerendered shell.
export const instant = false;


export default async function ProfilePage() {
  await connection();
  const me = await requireCustomer("/account/profile");

  return (
    <div className="space-y-14">
      <section>
        <h1 className="font-display text-3xl text-forest sm:text-4xl">Profile</h1>
        <ProfileForm name={me.name} email={me.email} phone={formatIndianPhone(me.phone)} />
      </section>

      <section className="border-t border-gold/30 pt-10">
        <h2 className="font-display text-2xl text-forest">Password</h2>
        <PasswordForm />
      </section>

      <form action={logoutAction} className="border-t border-gold/30 pt-8 lg:hidden">
        <button type="submit" className="text-sm text-ink/60 underline underline-offset-4 hover:text-terracotta">
          Sign out
        </button>
      </form>
    </div>
  );
}
