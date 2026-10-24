"use client";

import { useSubmit } from "@/lib/use-submit";
import { useActionState, useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import { AdminInput, AdminSelect, FormAlert, SubmitButton, SwitchRow } from "@/components/ui/fields";
import { LinkButton } from "@/components/ui/link-button";
import type { ProductFormState } from "./actions";
import { ImageUploader } from "../image-uploader";
import { VariantsEditor, type VariantRow } from "./variants-editor";

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
  discountPercent?: number | null;
  discountStartsOn?: string;
  discountEndsOn?: string;
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
            <AdminInput label="Name" name="name" defaultValue={initial?.name} required />
            <AdminInput
              label="Description"
              name="description"
              defaultValue={initial?.description ?? ""}
              multiline
              minRows={10}
              hint="Use the headings Product Description, Product Specification and Care Instructions on their own lines to get the formatted layout on the product page."
            />
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
          <SwitchRow name="isActive" defaultChecked={initial?.isActive} label="Live on storefront" description="Needs a price above ₹0." />
        </section>

        <section className={card}>
          <h2 className="font-medium text-ink">Pricing &amp; stock</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <AdminInput label="Price (₹)" name="price" type="number" defaultValue={initial?.price} required htmlInput={{ step: "0.01", min: "0" }} />
            {variantTotal !== null ? (
              <AdminInput label="Stock" name="stock" type="number" value={variantTotal} hint="Total of the sizes below." htmlInput={{ readOnly: true }} />
            ) : (
              <AdminInput label="Stock" name="stock" type="number" defaultValue={initial?.stock} required htmlInput={{ min: "0" }} />
            )}
            <div className="col-span-2">
              <AdminInput label="SKU" name="sku" defaultValue={initial?.sku ?? ""} />
            </div>
          </div>
        </section>

        <section className={card}>
          <h2 className="font-medium text-ink">Discount</h2>
          <p className="mb-4 mt-1 text-xs text-ink/50">
            Takes a percentage off this product. If its collection also has a sale running, the bigger of the two applies; they don&rsquo;t add up.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <AdminInput label="Percent off (blank for none)" name="discountPercent" type="number" defaultValue={initial?.discountPercent ?? ""} placeholder="e.g. 10" htmlInput={{ min: "1", max: "90", step: "1" }} />
            </div>
            <AdminInput label="Starts (optional)" name="discountStartsAt" type="date" defaultValue={initial?.discountStartsOn ?? ""} />
            <AdminInput label="Ends (optional)" name="discountEndsAt" type="date" defaultValue={initial?.discountEndsOn ?? ""} />
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
            <AdminSelect label="Category" name="categoryId" defaultValue={initial?.categoryId ?? ""} slotProps={{ select: { displayEmpty: true } }}>
              <MenuItem value="">None</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </AdminSelect>
            <AdminSelect label="Collection" name="collectionId" defaultValue={initial?.collectionId ?? ""} slotProps={{ select: { displayEmpty: true } }}>
              <MenuItem value="">None</MenuItem>
              {collections.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </AdminSelect>
            <AdminInput label="URL slug" name="slug" defaultValue={initial?.slug} hint="Leave blank to generate from the name." />
            <FormControlLabel control={<Checkbox name="isFeatured" defaultChecked={initial?.isFeatured} />} label="Featured product" />
          </div>
        </section>

        <FormAlert>{state.error}</FormAlert>

        <div className="flex items-center gap-3">
          <SubmitButton pending={pending} pendingText="Saving..." size="large" sx={{ flex: 1 }}>
            Save product
          </SubmitButton>
          <LinkButton href="/admin/products" variant="text" color="inherit">
            Cancel
          </LinkButton>
        </div>
      </div>
    </form>
  );
}
