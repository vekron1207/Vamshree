import { logoutAction } from "../auth-actions";
import { AccountNav } from "./account-nav";

// Per-customer, always fresh: nothing here can be prerendered.
export const instant = false;

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-6 sm:pt-14">
      <div className="grid gap-10 lg:grid-cols-[13rem_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-[11px] uppercase tracking-[0.24em] text-gold">My account</p>
          <div className="mt-4">
            <AccountNav />
          </div>
          <form action={logoutAction} className="mt-4 hidden lg:block">
            <button type="submit" className="py-2.5 text-[12px] uppercase tracking-[0.14em] text-ink/50 transition-colors hover:text-terracotta">
              Sign out
            </button>
          </form>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
