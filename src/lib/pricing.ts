export type CollectionSale = {
  saleEnabled: boolean;
  salePercent: number;
  saleLabel: string | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
};

export const SALE_FIELDS = {
  saleEnabled: true,
  salePercent: true,
  saleLabel: true,
  saleStartsAt: true,
  saleEndsAt: true,
} as const;

// Percent off currently in effect for a collection, or 0 when no sale is live.
export function activeSalePercent(sale: CollectionSale | null | undefined, now = new Date()) {
  if (!sale || !sale.saleEnabled) return 0;
  const pct = Math.round(sale.salePercent);
  if (pct <= 0 || pct >= 100) return 0;
  if (sale.saleStartsAt && now < sale.saleStartsAt) return 0;
  if (sale.saleEndsAt && now > sale.saleEndsAt) return 0;
  return pct;
}

export type ProductDiscount = {
  discountPercent: number | null;
  discountStartsAt: Date | null;
  discountEndsAt: Date | null;
};

// Percent off currently in effect for one product (0 when none, or outside its dates).
export function activeProductDiscount(d: ProductDiscount | null | undefined, now = new Date()) {
  if (!d || !d.discountPercent) return 0;
  const pct = Math.round(d.discountPercent);
  if (pct <= 0 || pct >= 100) return 0;
  if (d.discountStartsAt && now < d.discountStartsAt) return 0;
  if (d.discountEndsAt && now > d.discountEndsAt) return 0;
  return pct;
}

export function applyDiscount(price: number, percent: number) {
  if (percent <= 0) return price;
  // Round to the whole rupee so displayed and charged amounts always match
  return Math.round(price * (1 - percent / 100));
}

export type PriceInfo = {
  price: number;
  originalPrice: number | null;
  salePercent: number;
  saleLabel: string | null;
};

// A collection sale and a product's own discount never stack: whichever is bigger applies.
export function priceFor(
  basePrice: number,
  compareAtPrice: number | null,
  sale: CollectionSale | null | undefined,
  productDiscount?: ProductDiscount | null,
  now = new Date()
): PriceInfo {
  const collectionPct = activeSalePercent(sale, now);
  const productPct = activeProductDiscount(productDiscount, now);
  const pct = Math.max(collectionPct, productPct);
  if (pct > 0) {
    return {
      price: applyDiscount(basePrice, pct),
      originalPrice: basePrice,
      salePercent: pct,
      saleLabel: collectionPct >= productPct ? sale?.saleLabel || `${pct}% off` : `${pct}% off`,
    };
  }
  return {
    price: basePrice,
    originalPrice: compareAtPrice && compareAtPrice > basePrice ? compareAtPrice : null,
    salePercent: 0,
    saleLabel: null,
  };
}
