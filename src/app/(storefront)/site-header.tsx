"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import Badge from "@mui/material/Badge";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/CloseRounded";
import FavoriteIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorderRounded";
import MenuIcon from "@mui/icons-material/MenuRounded";
import PersonIcon from "@mui/icons-material/PersonOutlineRounded";
import BagIcon from "@mui/icons-material/ShoppingBagOutlined";
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

const iconLink = "flex items-center gap-1 text-[12px] uppercase tracking-[0.16em] text-forest transition-colors hover:text-gold";

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
        <IconButton
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          color="primary"
          edge="start"
          sx={{ display: { sm: "none" } }}
        >
          <MenuIcon />
        </IconButton>

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

        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/account" aria-label="My account" className={iconLink}>
            <PersonIcon fontSize="small" />
            <span className="hidden lg:inline">Account</span>
          </Link>
          <Link href="/wishlist" aria-label={`Wishlist, ${wishIds.length} saved`} className={iconLink}>
            {wishIds.length > 0 ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
            <span className="hidden lg:inline">Wishlist</span>
          </Link>
          <Link href="/cart" aria-label={`Bag, ${itemCount} items`} className={iconLink}>
            <Badge badgeContent={itemCount} color="primary" max={99} sx={{ "& .MuiBadge-badge": { fontSize: 10, minWidth: 18, height: 18 } }}>
              <BagIcon fontSize="small" />
            </Badge>
            <span className="ml-1 hidden lg:inline">Bag</span>
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchor="left"
        sx={{ display: { sm: "none" } }}
        transitionDuration={{ enter: 420, exit: 300 }}
        slotProps={{
          paper: { sx: { width: "84%", maxWidth: 360, px: 3.5, pb: 5, pt: 3, display: "flex", flexDirection: "column" } },
          backdrop: { sx: { backgroundColor: "rgba(6, 20, 12, 0.4)" } },
        }}
      >
        <div className="flex items-center justify-between">
          <BrandMark size="sm" />
          <IconButton aria-label="Close menu" onClick={() => setMenuOpen(false)} color="primary" edge="end">
            <CloseIcon />
          </IconButton>
        </div>

        <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-gold">Shop by category</p>
        <ul className="mt-2 space-y-0.5">
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

        <Divider sx={{ mt: 3 }} />
        <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-gold">Collections</p>
        {drawerCollections}

        <div className="mt-auto flex gap-6 pt-10 text-[12px] uppercase tracking-[0.16em] text-forest">
          <Link href="/account">Account</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </Drawer>
    </header>
  );
}
