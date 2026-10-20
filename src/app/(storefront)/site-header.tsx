"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { CATEGORIES } from "@/lib/site-content";
import { BrandMark, BrandWordmark } from "@/components/brand";

const NAV: { href: string; label: string; match?: string }[] = [
  { href: "/products", label: "Shop" },
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

// usePathname() is runtime URL data; keeping it in small Suspense-wrapped
// leaves lets the rest of the header prerender into the static shell.
function NavLinks({ pathname }: { pathname: string | null }) {
  return NAV.map((item) => {
    const active = pathname !== null && pathname.startsWith(item.match ?? item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className="group relative py-1 transition-colors hover:text-gold"
      >
        {item.label}
        <span
          className={`absolute inset-x-0 -bottom-0.5 h-px origin-left bg-gold transition-transform duration-500 ${
            active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
          }`}
        />
      </Link>
    );
  });
}

function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

function CloseOnNavigate({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  useEffect(() => {
    onNavigate();
    // Only route changes should close the menu, not a new callback identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  return null;
}

export function SiteHeader({ drawerCollections }: { drawerCollections: ReactNode }) {
  const { itemCount } = useCart();
  const { ids: wishIds } = useWishlist();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,box-shadow] duration-500 ${
        scrolled
          ? "bg-cream/90 shadow-[0_1px_0_rgba(201,163,85,0.35)] backdrop-blur-md"
          : "bg-cream"
      }`}
    >
      {/* Height must stay constant: changing it on scroll shifts the page,
          which flips `scrolled` back and forth and makes the page shake. */}
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between px-5 sm:h-20 sm:px-6">
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="-ml-2 p-2 text-forest sm:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
            <path d="M3 7h16M3 15h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <Link href="/" aria-label="Vaamshri home" className="shrink-0">
          <BrandWordmark
            priority
            className={`h-12 origin-center transition-transform duration-500 sm:h-14 ${scrolled ? "scale-90" : "scale-100"}`}
          />
        </Link>

        <nav className="hidden items-center gap-9 text-[12px] uppercase tracking-[0.16em] text-forest sm:flex">
          <Suspense fallback={<NavLinks pathname={null} />}>
            <ActiveNavLinks />
          </Suspense>
        </nav>
        <Suspense fallback={null}>
          <CloseOnNavigate onNavigate={() => setMenuOpen(false)} />
        </Suspense>

        <div className="flex items-center gap-5 sm:gap-7">
        <Link
          href="/account"
          aria-label="My account"
          className="flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-forest transition-colors hover:text-gold"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
            <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.3" />
            <path d="M3.5 17c.8-3.2 3.3-4.8 6.5-4.8s5.7 1.6 6.5 4.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span className="hidden lg:inline">Account</span>
        </Link>
        <Link
          href="/wishlist"
          aria-label={`Wishlist, ${wishIds.length} saved`}
          className="relative flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-forest transition-colors hover:text-gold"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden fill={wishIds.length > 0 ? "currentColor" : "none"}>
            <path d="M10 17s-6.5-4.1-6.5-8.6A3.6 3.6 0 0 1 10 6.3a3.6 3.6 0 0 1 6.5 2.1C16.5 12.9 10 17 10 17Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
          <span className="hidden lg:inline">Wishlist</span>
        </Link>
        <Link
          href="/cart"
          className="relative flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-forest transition-colors hover:text-gold"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M4 7h12l-1 10H5L4 7Zm3 0V5.5a3 3 0 0 1 6 0V7"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
          <span className="hidden lg:inline">Bag</span>
          {itemCount > 0 ? (
            <span
              key={itemCount}
              className="animate-bloom-in flex h-5 min-w-5 items-center justify-center rounded-full bg-forest px-1 text-[10px] tracking-normal text-cream"
            >
              {itemCount}
            </span>
          ) : null}
        </Link>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 sm:hidden ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-forest-deep/40 transition-opacity duration-500 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-[84%] max-w-sm flex-col overflow-y-auto bg-cream px-7 pb-10 pt-6 transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            menuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full shadow-none"
          }`}
        >
          <div className="flex items-center justify-between">
            <BrandMark size="sm" />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="-mr-2 p-2 text-forest"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <p className="mt-10 text-[11px] uppercase tracking-[0.2em] text-gold">Shop by category</p>
          <ul className="mt-3 space-y-1">
            <li>
              <Link href="/products" className="block py-1.5 font-display text-xl text-forest">
                All jewellery
              </Link>
            </li>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/products?category=${c.slug}`} className="block py-1.5 font-display text-xl text-forest">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-gold">Collections</p>
          {drawerCollections}

          <div className="mt-auto flex gap-6 pt-10 text-[12px] uppercase tracking-[0.16em] text-forest">
            <Link href="/account">Account</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
