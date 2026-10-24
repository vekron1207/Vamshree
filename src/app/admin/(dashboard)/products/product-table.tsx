"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grow from "@mui/material/Grow";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Slide from "@mui/material/Slide";
import Snackbar from "@mui/material/Snackbar";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import CloseIcon from "@mui/icons-material/CloseRounded";
import SearchIcon from "@mui/icons-material/SearchRounded";
import { AdminInput, AdminSelect, FormAlert, SubmitButton } from "@/components/ui/fields";
import { formatINR } from "@/lib/format";
import { bulkSetProductDiscount, bulkSetProductPrice, bulkSetProductsActive } from "./actions";

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
  /** The product's own discount, if one is set (active = running right now) */
  discountPercent: number | null;
  discountActive: boolean;
};

type StatusFilter = "all" | "live" | "archived";
type StockFilter = "all" | "in" | "low" | "out";
type DiscountFilter = "all" | "on" | "off";
type SortKey = "newest" | "name" | "price-asc" | "price-desc" | "stock-asc" | "stock-desc";

const filterSx = { minWidth: 150, width: "auto", "& .MuiOutlinedInput-root": { borderRadius: 999 } } as const;

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
  const [category, setCategory] = useState("");
  const [collection, setCollection] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [discountFilter, setDiscountFilter] = useState<DiscountFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [discOpen, setDiscOpen] = useState(false);
  const [discPercent, setDiscPercent] = useState("");
  const [discStart, setDiscStart] = useState("");
  const [discEnd, setDiscEnd] = useState("");
  const [discError, setDiscError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [priceOpen, setPriceOpen] = useState(false);
  const [priceDraft, setPriceDraft] = useState("");
  const [priceLive, setPriceLive] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);
  // Close the panel whenever the selection empties, so it never reappears uninvited
  if (selected.size === 0 && priceOpen) setPriceOpen(false);
  if (selected.size === 0 && discOpen) setDiscOpen(false);
  const [pending, startTransition] = useTransition();

  const counts = useMemo(
    () => ({
      all: products.length,
      live: products.filter((p) => p.isActive).length,
      archived: products.filter((p) => !p.isActive).length,
    }),
    [products]
  );

  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c)))].sort(), [products]);
  const collections = useMemo(() => [...new Set(products.map((p) => p.collection).filter((c): c is string => Boolean(c)))].sort(), [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => {
      if (status === "live" && !p.isActive) return false;
      if (status === "archived" && p.isActive) return false;
      if (category && p.category !== category) return false;
      if (collection && p.collection !== collection) return false;
      if (stockFilter === "out" && p.stock !== 0) return false;
      if (stockFilter === "low" && !(p.stock > 0 && p.stock <= lowStockThreshold)) return false;
      if (stockFilter === "in" && p.stock <= 0) return false;
      if (discountFilter === "on" && !p.discountPercent) return false;
      if (discountFilter === "off" && p.discountPercent) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.collection?.toLowerCase().includes(q)
      );
    });
    const by: Record<SortKey, ((a: AdminProductRow, b: AdminProductRow) => number) | null> = {
      newest: null,
      name: (a, b) => a.name.localeCompare(b.name),
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      "stock-asc": (a, b) => a.stock - b.stock,
      "stock-desc": (a, b) => b.stock - a.stock,
    };
    const cmp = by[sort];
    return cmp ? [...list].sort(cmp) : list;
  }, [products, status, query, category, collection, stockFilter, discountFilter, sort, lowStockThreshold]);

  const filtersActive = Boolean(category || collection || stockFilter !== "all" || discountFilter !== "all" || query.trim());
  function clearFilters() {
    setCategory("");
    setCollection("");
    setStockFilter("all");
    setDiscountFilter("all");
    setQuery("");
  }

  const visibleSelected = visible.filter((p) => selected.has(p.id));
  const allVisibleSelected = visible.length > 0 && visibleSelected.length === visible.length;
  const someVisibleSelected = visibleSelected.length > 0 && !allVisibleSelected;

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

  function applyDiscount(remove: boolean) {
    let percent: number | null = null;
    if (!remove) {
      percent = Number(discPercent);
      if (!discPercent.trim() || !Number.isInteger(percent) || percent < 1 || percent > 90) {
        setDiscError("Enter a whole number from 1 to 90.");
        return;
      }
    }
    setDiscError(null);
    startTransition(async () => {
      const result = await bulkSetProductDiscount([...selected], percent, discStart, discEnd);
      if (!result.ok) {
        setDiscError(result.error);
        return;
      }
      setNotice(
        percent === null
          ? `Removed the discount from ${result.updated} ${result.updated === 1 ? "product" : "products"}.`
          : `${percent}% off set on ${result.updated} ${result.updated === 1 ? "product" : "products"}.`
      );
      setSelected(new Set());
      setDiscOpen(false);
      setDiscPercent("");
      setDiscStart("");
      setDiscEnd("");
      router.refresh();
    });
  }

  const selectedProducts = products.filter((p) => selected.has(p.id));
  const distinctPrices = [...new Set(selectedProducts.map((p) => p.price))];
  const canArchive = selectedProducts.some((p) => p.isActive);
  const unarchivable = selectedProducts.filter((p) => !p.isActive && p.price > 0).length;
  const unpricedSelected = selectedProducts.filter((p) => !p.isActive && p.price <= 0).length;
  const canUnarchive = unarchivable > 0;

  const barButton = { color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.12)", transform: "none" }, "&.Mui-disabled": { color: "rgba(255,255,255,0.35)" } } as const;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={status}
          onChange={(_, v: StatusFilter) => setStatus(v)}
          aria-label="Product status"
          sx={{ minHeight: 44, "& .MuiTabs-indicator": { backgroundColor: "#c9a355", height: 3, borderRadius: 3 } }}
        >
          {(["all", "live", "archived"] as const).map((s) => (
            <Tab
              key={s}
              value={s}
              label={
                <span>
                  {s} <span className="text-ink/40">{counts[s]}</span>
                </span>
              }
              sx={{ textTransform: "capitalize", letterSpacing: "0.04em", fontSize: 14 }}
            />
          ))}
        </Tabs>
        <TextField
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, category, collection"
          variant="outlined"
          size="small"
          hiddenLabel
          sx={{ maxWidth: { sm: 300 }, "& .MuiOutlinedInput-root": { borderRadius: 999 } }}
          slotProps={{
            htmlInput: { "aria-label": "Search products" },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filter products">
        <AdminSelect label="Category" value={category} onChange={(e) => setCategory(e.target.value)} sx={filterSx}>
          <MenuItem value="">All categories</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </AdminSelect>
        <AdminSelect label="Collection" value={collection} onChange={(e) => setCollection(e.target.value)} sx={filterSx}>
          <MenuItem value="">All collections</MenuItem>
          {collections.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </AdminSelect>
        <AdminSelect label="Stock" value={stockFilter} onChange={(e) => setStockFilter(e.target.value as StockFilter)} sx={filterSx}>
          <MenuItem value="all">Any stock</MenuItem>
          <MenuItem value="in">In stock</MenuItem>
          <MenuItem value="low">Low stock</MenuItem>
          <MenuItem value="out">Sold out</MenuItem>
        </AdminSelect>
        <AdminSelect label="Discount" value={discountFilter} onChange={(e) => setDiscountFilter(e.target.value as DiscountFilter)} sx={filterSx}>
          <MenuItem value="all">Any discount</MenuItem>
          <MenuItem value="on">With a discount</MenuItem>
          <MenuItem value="off">No discount</MenuItem>
        </AdminSelect>
        <AdminSelect label="Sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} sx={filterSx}>
          <MenuItem value="newest">Newest first</MenuItem>
          <MenuItem value="name">Name A to Z</MenuItem>
          <MenuItem value="price-asc">Price: low to high</MenuItem>
          <MenuItem value="price-desc">Price: high to low</MenuItem>
          <MenuItem value="stock-asc">Stock: low to high</MenuItem>
          <MenuItem value="stock-desc">Stock: high to low</MenuItem>
        </AdminSelect>
        {filtersActive ? (
          <Button size="small" variant="text" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
        <span className="ml-auto text-sm text-ink/50" aria-live="polite">
          {visible.length} of {products.length}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-paper shadow-[0_1px_2px_rgba(18,20,15,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-ink/[0.06] text-xs uppercase tracking-[0.08em] text-ink/50">
              <tr>
                <th className="w-12 py-1 pl-3">
                  <Checkbox
                    size="small"
                    slotProps={{ input: { "aria-label": "Select all shown products" } }}
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onChange={toggleAllVisible}
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
                    className={`cursor-pointer transition-colors duration-300 ${isSel ? "bg-gold-soft/25" : "hover:bg-cream/50"}`}
                  >
                    <td className="py-1 pl-3">
                      <Checkbox size="small" slotProps={{ input: { "aria-label": `Select ${p.name}` } }} checked={isSel} onChange={() => toggle(p.id)} />
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
                        <>
                          {formatINR(p.price)}{" "}
                          {p.discountPercent ? (
                            <Chip
                              size="small"
                              label={`${p.discountPercent}% off`}
                              title={p.discountActive ? "Discount running now" : "Discount scheduled or ended"}
                              color={p.discountActive ? "error" : "default"}
                              variant="outlined"
                              sx={{ ml: 1, height: 22, fontSize: 11, textTransform: "none", letterSpacing: 0 }}
                            />
                          ) : null}
                        </>
                      ) : (
                        <Chip
                          component={Link}
                          href={`/admin/products/${p.id}`}
                          clickable
                          size="small"
                          color="warning"
                          variant="outlined"
                          label="Set price"
                          sx={{ height: 24, fontSize: 12, textTransform: "none", letterSpacing: 0 }}
                        />
                      )}
                    </td>
                    <td className={`py-3 text-right tabular-nums ${p.stock === 0 ? "text-rose-700" : p.stock <= lowStockThreshold ? "text-amber-700" : ""}`}>
                      {p.stock}
                      {p.stock > 0 && p.stock <= lowStockThreshold ? <span className="ml-1.5 text-[10px] uppercase">low</span> : null}
                    </td>
                    <td className="py-3 pl-6">
                      <Chip
                        size="small"
                        label={p.isActive ? "Live" : "Archived"}
                        color={p.isActive ? "success" : "default"}
                        variant="outlined"
                        sx={{ height: 24, fontSize: 12, textTransform: "none", letterSpacing: 0 }}
                      />
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <Button component={Link} href={`/admin/products/${p.id}`} size="small" variant="text">
                        Edit
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visible.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-ink/50">
            {filtersActive ? "No products match these filters." : "No products in this view."}
          </p>
        ) : null}
      </div>

      {/* Set-price panel, sits just above the bulk bar */}
      <Grow in={selected.size > 0 && priceOpen} unmountOnExit>
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4">
          <Paper
            component="form"
            elevation={12}
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              applyPrice();
            }}
            className="pointer-events-auto w-full max-w-sm"
            sx={{ p: 2.5 }}
          >
            <p className="font-medium text-ink">
              Set one price for {selected.size} {selected.size === 1 ? "product" : "products"}
            </p>
            <p className="mt-1 text-xs text-ink/50">
              {distinctPrices.length === 1
                ? `Currently ${distinctPrices[0] > 0 ? formatINR(distinctPrices[0]) : "unpriced"}.`
                : `Currently ${distinctPrices.length} different prices. They'll all become the same.`}
            </p>
            <div className="mt-4">
              <AdminInput
                autoFocus
                label="Price in rupees"
                value={priceDraft}
                onChange={(e) => setPriceDraft(e.target.value)}
                placeholder="e.g. 2499"
                htmlInput={{ inputMode: "decimal" }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">&#8377;</InputAdornment> } }}
              />
            </div>
            <FormControlLabel
              sx={{ mt: 1 }}
              control={<Checkbox checked={priceLive} onChange={(e) => setPriceLive(e.target.checked)} />}
              label="Also put them live on the storefront"
            />
            <div className="mt-2">
              <FormAlert>{priceError}</FormAlert>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <SubmitButton pending={pending} pendingText="Saving..." size="small" sx={{ flex: 1 }}>
                {`Apply to ${selected.size}`}
              </SubmitButton>
              <Button type="button" variant="text" color="inherit" size="small" onClick={() => setPriceOpen(false)}>
                Cancel
              </Button>
            </div>
          </Paper>
        </div>
      </Grow>

      {/* Set-discount panel */}
      <Grow in={selected.size > 0 && discOpen} unmountOnExit>
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4">
          <Paper
            component="form"
            elevation={12}
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              applyDiscount(false);
            }}
            className="pointer-events-auto w-full max-w-sm"
            sx={{ p: 2.5 }}
          >
            <p className="font-medium text-ink">
              Discount for {selected.size} {selected.size === 1 ? "product" : "products"}
            </p>
            <p className="mt-1 text-xs text-ink/50">A percentage off each product&rsquo;s price. Dates are optional.</p>
            <div className="mt-4">
              <AdminInput autoFocus label="Percent off" value={discPercent} onChange={(e) => setDiscPercent(e.target.value)} placeholder="e.g. 10" htmlInput={{ inputMode: "numeric" }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <AdminInput label="Starts" type="date" value={discStart} onChange={(e) => setDiscStart(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <AdminInput label="Ends" type="date" value={discEnd} onChange={(e) => setDiscEnd(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            </div>
            <div className="mt-3">
              <FormAlert>{discError}</FormAlert>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <SubmitButton pending={pending} pendingText="Saving..." size="small" sx={{ flex: 1 }}>
                {`Apply to ${selected.size}`}
              </SubmitButton>
              <Button type="button" variant="text" color="error" size="small" disabled={pending} onClick={() => applyDiscount(true)}>
                Remove discount
              </Button>
              <Button type="button" variant="text" color="inherit" size="small" onClick={() => setDiscOpen(false)}>
                Cancel
              </Button>
            </div>
          </Paper>
        </div>
      </Grow>

      {/* Bulk action bar */}
      <Slide direction="up" in={selected.size > 0} mountOnEnter unmountOnExit>
        <div className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
          <div className="flex flex-wrap items-center gap-1 rounded-full bg-forest-deep py-2 pl-5 pr-2 text-sm text-cream shadow-2xl">
            <span className="mr-2 tabular-nums">{selected.size} selected</span>
            <Button
              size="small"
              variant="text"
              aria-expanded={priceOpen}
              onClick={() => {
                setPriceOpen((o) => !o);
                setDiscOpen(false);
                setPriceError(null);
              }}
              sx={{ ...barButton, backgroundColor: priceOpen ? "rgba(255,255,255,0.12)" : undefined }}
            >
              Set price
            </Button>
            <Button
              size="small"
              variant="text"
              aria-expanded={discOpen}
              onClick={() => {
                setDiscOpen((o) => !o);
                setPriceOpen(false);
                setDiscError(null);
              }}
              sx={{ ...barButton, backgroundColor: discOpen ? "rgba(255,255,255,0.12)" : undefined }}
            >
              Set discount
            </Button>
            <Button size="small" variant="text" disabled={pending || !canArchive} onClick={() => runBulk(false)} sx={barButton}>
              Archive
            </Button>
            <Button
              size="small"
              variant="contained"
              color="secondary"
              disabled={pending || !canUnarchive}
              onClick={() => runBulk(true)}
              title={!canUnarchive && unpricedSelected > 0 ? "Set a price on these products before unarchiving" : undefined}
            >
              {pending ? "Saving..." : unpricedSelected > 0 && canUnarchive ? `Unarchive ${unarchivable}` : "Unarchive"}
            </Button>
            {unpricedSelected > 0 ? <span className="px-2 text-xs text-gold-soft">{unpricedSelected} need a price first</span> : null}
            <IconButton onClick={() => setSelected(new Set())} aria-label="Clear selection" size="small" sx={{ color: "rgba(255,255,255,0.7)" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        </div>
      </Slide>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={5000}
        onClose={() => setNotice(null)}
        message={notice}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        slotProps={{ content: { role: "status" } }}
        sx={{ bottom: { xs: 96 } }}
      />
    </div>
  );
}
