"use client";

import { useWishlist } from "@/lib/wishlist-context";

export function WishlistButton({ productId, name, className = "" }: { productId: string; name: string; className?: string }) {
  const { has, toggle } = useWishlist();
  const saved = has(productId);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      onClick={() => toggle(productId)}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-cream/90 text-forest shadow-sm backdrop-blur transition-transform hover:scale-110 ${className}`}
    >
      <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden fill={saved ? "currentColor" : "none"}>
        <path
          d="M10 17s-6.5-4.1-6.5-8.6A3.6 3.6 0 0 1 10 6.3a3.6 3.6 0 0 1 6.5 2.1C16.5 12.9 10 17 10 17Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
