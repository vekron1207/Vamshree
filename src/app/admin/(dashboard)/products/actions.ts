"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/slugify";
import { isAllowedImageUrl } from "@/lib/uploads";

export type ProductFormState = { error?: string };

const MAX_IMAGES = 12;

function parseImages(raw: FormDataEntryValue | null): string[] {
  if (!raw) return [];
  let list: unknown;
  try {
    list = JSON.parse(String(raw));
  } catch {
    throw new Error("The image list could not be read. Reload the page and try again.");
  }
  if (!Array.isArray(list)) throw new Error("The image list could not be read.");
  const urls = [...new Set(list.map((u) => String(u).trim()).filter(Boolean))];
  if (urls.length > MAX_IMAGES) throw new Error(`A product can have up to ${MAX_IMAGES} images.`);
  for (const url of urls) {
    if (!isAllowedImageUrl(url)) throw new Error(`Image links must start with https:// (got "${url}").`);
  }
  return urls;
}

type VariantInput = { id?: string; label: string; stock: number };

function parseVariants(raw: FormDataEntryValue | null): VariantInput[] {
  if (!raw) return [];
  let list: unknown;
  try {
    list = JSON.parse(String(raw));
  } catch {
    throw new Error("The sizes could not be read. Reload the page and try again.");
  }
  if (!Array.isArray(list)) throw new Error("The sizes could not be read.");
  if (list.length > 40) throw new Error("A product can have up to 40 sizes.");
  const seen = new Set<string>();
  return list.map((v) => {
    const label = String(v?.label ?? "").trim().slice(0, 40);
    const stock = Number(v?.stock);
    if (!label) throw new Error("Every size needs a label (or remove the empty row).");
    if (seen.has(label.toLowerCase())) throw new Error(`Size "${label}" is listed twice.`);
    seen.add(label.toLowerCase());
    if (!Number.isInteger(stock) || stock < 0) throw new Error(`Stock for size "${label}" must be a whole number, 0 or more.`);
    return { id: typeof v?.id === "string" ? v.id : undefined, label, stock };
  });
}

function parseProductForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const sku = String(formData.get("sku") ?? "").trim();
  const images = parseImages(formData.get("images"));
  const variants = parseVariants(formData.get("variants"));
  const isFeatured = formData.get("isFeatured") === "on";
  const isActive = formData.get("isActive") === "on";
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const collectionId = String(formData.get("collectionId") ?? "").trim();

  if (!name) throw new Error("Name is required");
  if (!Number.isFinite(price) || price < 0) throw new Error("Price must be a positive number");
  if (variants.length === 0 && (!Number.isInteger(stock) || stock < 0)) throw new Error("Stock must be a whole number, 0 or more");
  if (isActive && price <= 0) throw new Error("Set a price above ₹0 to put this product live.");

  return {
    fields: {
      name,
      slug: slugify(slugInput || name),
      description: description || null,
      price,
      // With sizes, the product's stock is always the sum of its sizes
      stock: variants.length > 0 ? variants.reduce((s, v) => s + v.stock, 0) : stock,
      sku: sku || null,
      isFeatured,
      isActive,
      categoryId: categoryId || null,
      collectionId: collectionId || null,
    },
    images,
    variants,
  };
}

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin();

  let data;
  try {
    data = parseProductForm(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid input" };
  }

  try {
    await prisma.product.create({
      data: {
        ...data.fields,
        images: { create: data.images.map((url, position) => ({ url, position })) },
        variants: { create: data.variants.map((v, position) => ({ label: v.label, stock: v.stock, position })) },
      },
    });
  } catch {
    return { error: "A product with that slug or SKU already exists" };
  }

  updateTag("products");
  redirect("/admin/products");
}

export async function updateProduct(
  id: string,
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin();

  let data;
  try {
    data = parseProductForm(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid input" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: data.fields });
      // Replace the gallery wholesale so order and removals match the form
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (data.images.length > 0) {
        await tx.productImage.createMany({
          data: data.images.map((url, position) => ({ productId: id, url, position })),
        });
      }
      // Keep existing sizes (and their ids) so past orders still line up
      const keep = data.variants.filter((v) => v.id).map((v) => v.id as string);
      await tx.productVariant.deleteMany({ where: { productId: id, id: { notIn: keep } } });
      for (const [position, v] of data.variants.entries()) {
        if (v.id) {
          const res = await tx.productVariant.updateMany({
            where: { id: v.id, productId: id },
            data: { label: v.label, stock: v.stock, position },
          });
          if (res.count === 1) continue;
        }
        await tx.productVariant.create({ data: { productId: id, label: v.label, stock: v.stock, position } });
      }
    });
  } catch {
    return { error: "A product with that slug or SKU already exists" };
  }

  updateTag("products");
  redirect("/admin/products");
}

export type BulkResult = { updated: number; skipped: number };

export async function bulkSetProductsActive(
  ids: string[],
  isActive: boolean
): Promise<BulkResult> {
  await requireAdmin();
  if (ids.length === 0) return { updated: 0, skipped: 0 };

  // A product with no price can't go live - publishing it would sell at ₹0.
  const where = isActive
    ? { id: { in: ids }, price: { gt: 0 } }
    : { id: { in: ids } };

  const { count } = await prisma.product.updateMany({ where, data: { isActive } });
  updateTag("products");
  revalidatePath("/admin/products");
  return { updated: count, skipped: ids.length - count };
}

export type BulkPriceResult = { ok: true; updated: number; madeLive: number } | { ok: false; error: string };

const MAX_PRICE = 10_000_000; // column is DECIMAL(10,2); this keeps well inside it
const MAX_BULK = 500;

export async function bulkSetProductPrice(
  ids: string[],
  rawPrice: number,
  makeLive: boolean
): Promise<BulkPriceResult> {
  await requireAdmin();

  if (!Array.isArray(ids) || ids.length === 0) return { ok: false, error: "Select at least one product." };
  if (ids.length > MAX_BULK) return { ok: false, error: `Select ${MAX_BULK} products or fewer at a time.` };

  const price = Math.round(Number(rawPrice) * 100) / 100;
  if (!Number.isFinite(price) || price <= 0) return { ok: false, error: "Enter a price above ₹0." };
  if (price > MAX_PRICE) return { ok: false, error: "That price is too high. Check for an extra zero." };

  const where = { id: { in: ids } };
  const [{ count }, live] = await prisma.$transaction([
    prisma.product.updateMany({ where, data: { price } }),
    makeLive
      ? prisma.product.updateMany({ where: { ...where, isActive: false }, data: { isActive: true } })
      : prisma.product.updateMany({ where: { id: { in: [] } }, data: {} }),
  ]);

  updateTag("products");
  revalidatePath("/admin/products");
  return { ok: true, updated: count, madeLive: live.count };
}
