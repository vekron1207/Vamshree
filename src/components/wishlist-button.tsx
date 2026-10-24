"use client";

import IconButton from "@mui/material/IconButton";
import FavoriteIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorderRounded";
import { useWishlist } from "@/lib/wishlist-context";

export function WishlistButton({ productId, name, className = "" }: { productId: string; name: string; className?: string }) {
  const { has, toggle } = useWishlist();
  const saved = has(productId);
  return (
    <IconButton
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      onClick={() => toggle(productId)}
      color="primary"
      size="small"
      className={className}
      sx={{
        width: 38,
        height: 38,
        backgroundColor: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(6px)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
        "&:hover": { backgroundColor: "#fff", transform: "scale(1.1)" },
        "& svg": { transition: "transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)", transform: saved ? "scale(1.12)" : "scale(1)" },
      }}
    >
      {saved ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
    </IconButton>
  );
}
