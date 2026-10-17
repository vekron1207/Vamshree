// Pure helpers, safe to import from client and server code.
export type ShippingRule = {
  /** Flat charge in rupees. 0 means shipping is always free. */
  flatFee: number;
  /** Orders at or above this amount (after discounts) ship free. null = no threshold. */
  freeAbove: number | null;
};

export const DEFAULT_SHIPPING: ShippingRule = { flatFee: 0, freeAbove: null };

export function shippingFor(amountAfterDiscount: number, rule: ShippingRule) {
  if (rule.flatFee <= 0) return 0;
  if (rule.freeAbove !== null && amountAfterDiscount >= rule.freeAbove) return 0;
  return rule.flatFee;
}

// How much more to spend to unlock free shipping, or null when not applicable
export function amountToFreeShipping(amountAfterDiscount: number, rule: ShippingRule) {
  if (rule.flatFee <= 0 || rule.freeAbove === null) return null;
  const gap = rule.freeAbove - amountAfterDiscount;
  return gap > 0 ? gap : null;
}
