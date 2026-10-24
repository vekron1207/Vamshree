import Button from "@mui/material/Button";
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
            <Button type="submit" size="small" variant="text" color="inherit">
              Sign out
            </Button>
          </form>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
