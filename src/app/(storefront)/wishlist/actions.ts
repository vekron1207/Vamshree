"use server";

import { getProductsByIds } from "@/lib/products";

export async function loadWishlistProducts(ids: string[]) {
  return getProductsByIds(Array.isArray(ids) ? ids : []);
}
