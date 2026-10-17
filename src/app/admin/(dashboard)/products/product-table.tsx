"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { formatINR } from "@/lib/format";
import { bulkSetProductPrice, bulkSetProductsActive } from "./actions";

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  isActive: boolean;
  image: string | null;
  category: string | null;
  collection: string | null;
};

type StatusFilter = "all" | "live" | "archived";

export function ProductTable({
  products,
  initialStatus,
  lowStockThreshold,
}: {
  products: AdminProductRow[];
  initialStatus: StatusFilter;
  lowStockThreshold: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [priceOpen, setPriceOpen] = useState(false);
  const [priceDraft, setPriceDraft] = useState("");
  const [priceLive, setPriceLive] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);
  // Close the panel whenever the selection empties, so it never reappears uninvited
  if (selected.size === 0 && priceOpen) setPriceOpen(false);
  const [pending, startTransition] = useTransition();
  const selectAllRef = useRef<HTMLInputElement>(null);

  const counts = useMemo(
    () => ({
      all: products.length,
      live: products.filter((p) => p.isActive).length,
      archived: products.filter((p) => !p.isActive).length,
    }),
    [products]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (status === "live" && !p.isActive) return false;
      if (status === "archived" && p.isActive) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.collection?.toLowerCase().includes(q)
      );
    });
  }, [products, status, query]);

  const visibleSelected = visible.filter((p) => selected.has(p.id));
  const allVisibleSelected = visible.length > 0 && visibleSelected.length === visible.length;
  const someVisibleSelected = visibleSelected.length > 0 && !allVisibleSelected;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someVisibleSelected;
  }, [someVisibleSelected]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(t);
  }, [notice]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((p) => next.delete(p.id));
      else visible.forEach((p) => next.add(p.id));
      return next;
    });
  }

  function runBulk(isActive: boolean, ids = [...selected]) {
    startTransition(async () => {
      const { updated, skipped } = await bulkSetProductsActive(ids, isActive);
      const verb = isActive ? "Unarchived" : "Archived";
      setNotice(
        `${verb} ${updated} ${updated === 1 ? "product" : "products"}.` +
          (skipped > 0 ? ` ${skipped} skipped - set a price before unarchiving.` : "")
      );
      setSelected(new Set());
      router.refresh();
    });
  }

  function applyPrice() {
    const value = Number(priceDraft.replace(/,/g, ""));
    if (!priceDraft.trim() || !Number.isFinite(value) || value <= 0) {
      setPriceError("Enter a price above ₹0.");
      return;
    }
    setPriceError(null);
    startTransition(async () => {
      const result = await bulkSetProductPrice([...selected], value, priceLive);
      if (!result.ok) {
        setPriceError(result.error);
        return;
      }
      setNotice(
        `Set ${formatINR(value)} on ${result.updated} ${result.updated === 1 ? "product" : "products"}` +
          (result.madeLive > 0 ? `, ${result.madeLive} now live.` : ".")
      );
      setSelected(new Set());
      setPriceOpen(false);
      setPriceDraft("");
      router.refresh();
    });
  }

  const selectedProducts = products.filter((p) => selected.has(p.id));
  const distinctPrices = [...new Set(selectedProducts.map((p) => p.price))];
  const canArchive = selectedProducts.some((p) => p.isActive);
  const unarchivable = selectedProducts.filter((p) => !p.isActive && p.price > 0).length;
  const unpricedSelected = selectedProducts.filter((p) => !p.isActive && p.price <= 0).length;
  const canUnarchive = unarchivable > 0;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-full bg-paper p-1 shadow-[0_1px_2px_rgba(18,20,15,0.06)]" role="tablist">
          {(["all", "live", "archived"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={status === s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${
                status === s ? "bg-forest text-cream" : "text-ink/60 hover:text-ink"
              }`}
            >
              {s} <span className={status === s ? "text-cream/60" : "text-ink/40"}>{counts[s]}</span>
            </button>
          ))}
        </div>
        <label className="relative block sm:w-72">
          <span className="sr-only">Search products</span>
          <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, category, collection"
            className="w-full rounded-full border border-ink/10 bg-paper py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-forest/50"
          />
        </label>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-paper shadow-[0_1px_2px_rgba(18,20,15,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-ink/[0.06] text-xs uppercase tracking-[0.08em] text-ink/50">
              <tr>
                <th className="w-12 py-3 pl-5">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    aria-label="Select all shown products"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    className="h-4 w-4 accent-forest"
                  />
                </th>
                <th className="py-3 font-normal">Product</th>
                <th className="py-3 font-normal">Collection</th>
                <th className="py-3 text-right font-normal">Price</th>
                <th className="py-3 text-right font-normal">Stock</th>
                <th className="py-3 pl-6 font-normal">Status</th>
                <th className="py-3 pr-5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.05]">
              {visible.map((p) => {
                const isSel = selected.has(p.id);
                return (
                  <tr
                    key={p.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("a,button,input")) return;
                      toggle(p.id);
                    }}
                    className={`cursor-pointer transition-colors ${isSel ? "bg-gold-soft/25" : "hover:bg-cream/50"}`}
                  >
                    <td className="py-3 pl-5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.name}`}
                        checked={isSel}
                        onChange={() => toggle(p.id)}
                        className="h-4 w-4 accent-forest"
                      />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-9 shrink-0 overflow-hidden rounded-t-full bg-cream">
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-ink">{p.name}</p>
                          <p className="text-xs text-ink/50">{p.category ?? "No category"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-ink/70">{p.collection ?? "-"}</td>
                    <td className="py-3 text-right tabular-nums">
                      {p.price > 0 ? (
                        formatINR(p.price)
                      ) : (
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-800 ring-1 ring-inset ring-amber-200 hover:bg-amber-100"
                        >
                          Set price
                        </Link>
                      )}
                    </td>
                    <td className={`py-3 text-right tabular-nums ${p.stock === 0 ? "text-rose-700" : p.stock <= lowStockThreshold ? "text-amber-700" : ""}`}>
                      {p.stock}
                      {p.stock > 0 && p.stock <= lowStockThreshold ? <span className="ml-1.5 text-[10px] uppercase">low</span> : null}
                    </td>
                    <td className="py-3 pl-6">
                      {p.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-800 ring-1 ring-inset ring-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden /> Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-0.5 text-xs text-ink/60 ring-1 ring-inset ring-ink/10">
                          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden /> Archived
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <Link href={`/admin/products/${p.id}`} className="text-forest hover:underline">
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visible.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-ink/50">
            {query ? `No products match "${query}".` : "No products in this view."}
          </p>
        ) : null}
      </div>

      {/* Set-price panel, sits just above the bulk bar */}
      {selected.size > 0 && priceOpen ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyPrice();
            }}
            className="animate-rise-in pointer-events-auto w-full max-w-sm rounded-2xl bg-paper p-5 shadow-2xl ring-1 ring-ink/10"
          >
            <p className="font-medium text-ink">
              Set one price for {selected.size} {selected.size === 1 ? "product" : "products"}
            </p>
            <p className="mt-1 text-xs text-ink/50">
              {distinctPrices.length === 1
                ? `Currently ${distinctPrices[0] > 0 ? formatINR(distinctPrices[0]) : "unpriced"}.`
                : `Currently ${distinctPrices.length} different prices. They'll all become the same.`}
            </p>
            <label className="mt-4 block">
              <span className="sr-only">Price in rupees</span>
              <span className="flex items-center rounded-lg border border-ink/15 bg-paper px-3.5 focus-within:border-forest/60 focus-within:ring-2 focus-within:ring-forest/10">
                <span className="text-ink/50">&#8377;</span>
                <input
                  autoFocus
                  inputMode="decimal"
                  value={priceDraft}
                  onChange={(e) => setPriceDraft(e.target.value)}
                  placeholder="e.g. 2499"
                  className="w-full bg-transparent px-2 py-2.5 text-ink outline-none"
                />
              </span>
            </label>
            <label className="mt-3 flex items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={priceLive}
                onChange={(e) => setPriceLive(e.target.checked)}
                className="h-4 w-4 accent-forest"
              />
              Also put them live on the storefront
            </label>
            {priceError ? (
              <p role="alert" className="mt-3 text-sm text-rose-700">
                {priceError}
              </p>
            ) : null}
            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-full bg-forest px-5 py-2.5 text-sm text-cream transition-colors hover:bg-forest-deep disabled:opacity-50"
              >
                {pending ? "Saving..." : `Apply to ${selected.size}`}
              </button>
              <button type="button" onClick={() => setPriceOpen(false)} className="text-sm text-ink/55 hover:text-ink">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Bulk action bar */}
      <div
        className={`fixed inset-x-0 bottom-6 z-30 flex justify-center px-4 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          selected.size > 0 ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 rounded-full bg-forest-deep py-2 pl-5 pr-2 text-sm text-cream shadow-2xl">
          <span className="mr-2 tabular-nums">
            {selected.size} selected
          </span>
          <button
            type="button"
            aria-expanded={priceOpen}
            onClick={() => {
              setPriceOpen((o) => !o);
              setPriceError(null);
            }}
            className={`rounded-full px-4 py-1.5 transition-colors hover:bg-cream/10 ${priceOpen ? "bg-cream/10" : ""}`}
          >
            Set price
          </button>
          <button
            type="button"
            disabled={pending || !canArchive}
            onClick={() => runBulk(false)}
            className="rounded-full px-4 py-1.5 transition-colors hover:bg-cream/10 disabled:opacity-40"
          >
            Archive
          </button>
          <button
            type="button"
            disabled={pending || !canUnarchive}
            onClick={() => runBulk(true)}
            title={!canUnarchive && unpricedSelected > 0 ? "Set a price on these products before unarchiving" : undefined}
            className="rounded-full bg-gold px-4 py-1.5 text-forest-deep transition-colors hover:bg-gold-soft disabled:opacity-40"
          >
            {pending ? "Saving..." : unpricedSelected > 0 && canUnarchive ? `Unarchive ${unarchivable}` : "Unarchive"}
          </button>
          {unpricedSelected > 0 ? (
            <span className="px-2 text-xs text-gold-soft">
              {unpricedSelected} need a price first
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            aria-label="Clear selection"
            className="rounded-full px-3 py-1.5 text-cream/60 transition-colors hover:text-cream"
          >
            &#10005;
          </button>
        </div>
      </div>

      {notice ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4">
          <div
            role="status"
            className="animate-rise-in rounded-full bg-paper px-5 py-2.5 text-sm text-ink shadow-lg ring-1 ring-ink/10"
          >
            {notice}
          </div>
        </div>
      ) : null}
    </div>
  );
}
