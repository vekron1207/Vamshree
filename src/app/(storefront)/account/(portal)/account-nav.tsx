"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const LINKS = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile" },
];

function Links() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-full px-5 py-2 text-[12px] uppercase tracking-[0.14em] transition-colors lg:rounded-none lg:px-0 lg:py-2.5 ${
              active ? "bg-forest text-cream lg:bg-transparent lg:text-forest lg:underline lg:decoration-gold lg:underline-offset-8" : "text-forest/70 hover:text-forest"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </>
  );
}

export function AccountNav() {
  return (
    <nav
      aria-label="Account"
      className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:flex-col lg:gap-1 lg:overflow-visible"
    >
      <Suspense fallback={null}>
        <Links />
      </Suspense>
    </nav>
  );
}
