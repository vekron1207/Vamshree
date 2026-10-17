"use client";

import { useSubmit } from "@/lib/use-submit";
import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import type { ProductFormState } from "./actions";
import { ImageUploader } from "../image-uploader";
import { VariantsEditor, type VariantRow } from "./variants-editor";

const inputClass =
  "w-full rounded-lg border border-ink/12 bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-forest/60 focus:ring-2 focus:ring-forest/10";

const card = "rounded-2xl bg-paper p-5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] sm:p-6";

type ProductInitial = {
  name?: string;
  slug?: string;
  description?: string | null;
  price?: number;
  stock?: number;
  sku?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
  images?: string[];
  categoryId?: string | null;
  collectionId?: string | null;
  variants?: VariantRow[];
};

type Option = { id: string; name: string };

export function ProductForm({
  action,
  initial,
  categories,
  collections,
}: {
  action: (
    prevState: ProductFormState,
    formData: FormData
  ) => Promise<ProductFormState>;
  initial?: ProductInitial;
  categories: Option[];
  collections: Option[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const onSubmit = useSubmit(formAction);
  const [variantTotal, setVariantTotal] = useState<number | null>(
    initial?.variants?.length ? initial.variants.reduce((s, v) => s + v.stock, 0) : null
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <section className={card}>
          <div className="space-y-5">
            <Field label="Name">
              <input name="name" defaultValue={initial?.name} required className={inputClass} />
            </Field>
            <Field label="Description" hint="Use the headings Product Description, Product Specification and Care Instructions on their own lines to get the formatted layout on the product page.">
              <textarea
                name="description"
                defaultValue={initial?.description ?? ""}
                rows={12}
                className={`${inputClass} leading-relaxed`}
              />
            </Field>
          </div>
        </section>

        <section className={card}>
          <h2 className="font-medium text-ink">Images</h2>
          <div className="mt-4">
            <ImageUploader
              name="images"
              kind="products"
              multiple
              initial={initial?.images ?? []}
              hint="The first image is the main photo shown in the shop. Use the arrows to reorder."
            />
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className={card}>
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span>
              <span className="block font-medium text-ink">Live on storefront</span>
              <span className="block text-xs text-ink/50">Needs a price above ₹0.</span>
            </span>
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initial?.isActive}
              className="peer sr-only"
            />
            <span className="relative h-6 w-11 shrink-0 rounded-full bg-ink/15 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-paper after:shadow after:transition-transform peer-checked:bg-forest peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold" />
          </label>
        </section>

        <section className={card}>
          <h2 className="font-medium text-ink">Pricing &amp; stock</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Price (₹)">
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initial?.price}
                required
                className={inputClass}
              />
            </Field>
            <Field label="Stock" hint={variantTotal !== null ? "Total of the sizes below." : undefined}>
              {variantTotal !== null ? (
                <input
                  name="stock"
                  type="number"
                  value={variantTotal}
                  readOnly
                  className={`${inputClass} bg-ink/[0.03]`}
                />
              ) : (
                <input
                  name="stock"
                  type="number"
                  min="0"
                  defaultValue={initial?.stock}
                  required
                  className={inputClass}
                />
              )}
            </Field>
            <div className="col-span-2">
              <Field label="SKU">
                <input name="sku" defaultValue={initial?.sku ?? ""} className={inputClass} />
              </Field>
            </div>
          </div>
        </section>

        <section className={card}>
          <h2 className="font-medium text-ink">Sizes</h2>
          <p className="mb-4 mt-1 text-xs text-ink/50">For rings and bangles. Each size has its own stock.</p>
          <VariantsEditor initial={initial?.variants ?? []} onTotalChange={setVariantTotal} />
        </section>

        <section className={card}>
          <h2 className="font-medium text-ink">Organisation</h2>
          <div className="mt-4 space-y-4">
            <Field label="Category">
              <select name="categoryId" defaultValue={initial?.categoryId ?? ""} className={inputClass}>
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Collection">
              <select name="collectionId" defaultValue={initial?.collectionId ?? ""} className={inputClass}>
                <option value="">None</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="URL slug" hint="Leave blank to generate from the name.">
              <input name="slug" defaultValue={initial?.slug} className={inputClass} />
            </Field>
            <label className="flex items-center gap-2.5 pt-1 text-sm text-ink">
              <input
                type="checkbox"
                name="isFeatured"
                defaultChecked={initial?.isFeatured}
                className="h-4 w-4 accent-forest"
              />
              Featured product
            </label>
          </div>
        </section>

        {state.error ? (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {state.error}
          </p>
        ) : null}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-full bg-forest px-6 py-3 text-sm text-cream transition-colors hover:bg-forest-deep disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save product"}
          </button>
          <Link
            href="/admin/products"
            className="rounded-full px-5 py-3 text-sm text-ink/60 transition-colors hover:text-ink"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-ink/55">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs leading-relaxed text-ink/45">{hint}</span> : null}
    </label>
  );
}
