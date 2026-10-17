"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/slugify";
import { isAllowedImageUrl } from "@/lib/uploads";

export type CollectionFormState = { error?: string };

function parseInstant(raw: FormDataEntryValue | null, label: string): Date | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} isn't a valid date.`);
  return date;
}

function parseCollectionForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const isVisible = formData.get("isVisible") === "on";

  const saleEnabled = formData.get("saleEnabled") === "on";
  const salePercent = Number(formData.get("salePercent") ?? 0);
  const saleLabel = String(formData.get("saleLabel") ?? "").trim();
  const saleStartsAt = parseInstant(formData.get("saleStartsAt"), "Sale start");
  const saleEndsAt = parseInstant(formData.get("saleEndsAt"), "Sale end");

  if (!name) throw new Error("Name is required.");
  if (imageUrl && !isAllowedImageUrl(imageUrl)) throw new Error("Banner image links must start with https://");
  if (!Number.isInteger(sortOrder)) throw new Error("Display order must be a whole number.");
  if (saleLabel.length > 40) throw new Error("Keep the sale label to 40 characters or fewer.");

  if (saleEnabled) {
    if (!Number.isInteger(salePercent) || salePercent < 1 || salePercent > 90) {
      throw new Error("Sale discount must be a whole number between 1 and 90.");
    }
    if (saleStartsAt && saleEndsAt && saleEndsAt <= saleStartsAt) {
      throw new Error("The sale must end after it starts.");
    }
  }

  return {
    name,
    slug: slugify(slugInput || name),
    tagline: tagline || null,
    description: description || null,
    imageUrl: imageUrl || null,
    sortOrder,
    isVisible,
    saleEnabled,
    salePercent: saleEnabled ? salePercent : 0,
    saleLabel: saleLabel || null,
    saleStartsAt,
    saleEndsAt,
  };
}

function refresh() {
  // Sales change product prices, so storefront product data is stale too
  updateTag("products");
  revalidatePath("/admin/collections");
}

export async function createCollection(
  _prev: CollectionFormState,
  formData: FormData
): Promise<CollectionFormState> {
  await requireAdmin();
  let data;
  try {
    data = parseCollectionForm(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid input" };
  }
  try {
    await prisma.collection.create({ data });
  } catch {
    return { error: "A collection with that URL slug already exists." };
  }
  refresh();
  redirect("/admin/collections");
}

export async function updateCollection(
  id: string,
  _prev: CollectionFormState,
  formData: FormData
): Promise<CollectionFormState> {
  await requireAdmin();
  let data;
  try {
    data = parseCollectionForm(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid input" };
  }
  try {
    await prisma.collection.update({ where: { id }, data });
  } catch {
    return { error: "A collection with that URL slug already exists." };
  }
  refresh();
  redirect("/admin/collections");
}

export async function deleteCollection(id: string) {
  await requireAdmin();
  // Products stay in the catalogue; they just stop belonging to a collection
  await prisma.$transaction([
    prisma.product.updateMany({ where: { collectionId: id }, data: { collectionId: null } }),
    prisma.collection.delete({ where: { id } }),
  ]);
  refresh();
  redirect("/admin/collections");
}

export async function endCollectionSale(id: string) {
  await requireAdmin();
  await prisma.collection.update({ where: { id }, data: { saleEnabled: false } });
  refresh();
}
