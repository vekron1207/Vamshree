"use client";

import { useState } from "react";

export type VariantRow = { id?: string; label: string; stock: number };

const RING_SIZES = ["12", "13", "14", "15", "16", "17", "18", "19", "20"];

const inputClass =
  "rounded-lg border border-ink/12 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-forest/60";

// Sizes for rings and similar. Saved with the product as one hidden JSON field.
export function VariantsEditor({
  initial,
  onTotalChange,
}: {
  initial: VariantRow[];
  onTotalChange?: (total: number | null) => void;
}) {
  const [rows, setRows] = useState<VariantRow[]>(initial);

  function commit(next: VariantRow[]) {
    setRows(next);
    onTotalChange?.(next.length > 0 ? next.reduce((s, r) => s + (Number(r.stock) || 0), 0) : null);
  }

  function addPreset() {
    const have = new Set(rows.map((r) => r.label));
    commit([...rows, ...RING_SIZES.filter((s) => !have.has(s)).map((label) => ({ label, stock: 0 }))]);
  }

  return (
    <div>
      <input type="hidden" name="variants" value={JSON.stringify(rows)} />
      {rows.length === 0 ? (
        <p className="text-sm text-ink/50">
          No sizes. This product is sold as a single item using the Stock number above.
        </p>
      ) : (
        <>
        <div className="mb-1.5 flex items-center gap-2 pr-8 text-[11px] uppercase tracking-[0.08em] text-ink/45">
          <span className="flex-1">Size</span>
          <span className="w-24 shrink-0">Stock</span>
        </div>
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={r.id ?? `new-${i}`} className="flex items-center gap-2">
              <input
                aria-label="Size label"
                placeholder="Size, e.g. 14"
                value={r.label}
                maxLength={40}
                onChange={(e) => commit(rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                className={`${inputClass} min-w-0 flex-1`}
              />
              <input
                aria-label={`Stock for size ${r.label}`}
                type="number"
                min={0}
                value={r.stock}
                onChange={(e) =>
                  commit(rows.map((x, j) => (j === i ? { ...x, stock: Math.max(0, Math.floor(Number(e.target.value) || 0)) } : x)))
                }
                className={`${inputClass} w-24 shrink-0`}
              />
              <button
                type="button"
                aria-label={`Remove size ${r.label}`}
                onClick={() => commit(rows.filter((_, j) => j !== i))}
                className="rounded-full px-2 py-1 text-ink/45 hover:text-rose-700"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
        </>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => commit([...rows, { label: "", stock: 0 }])}
          className="rounded-full border border-forest/30 px-4 py-1.5 text-xs text-forest hover:bg-forest hover:text-cream"
        >
          + Add size
        </button>
        <button
          type="button"
          onClick={addPreset}
          className="rounded-full border border-ink/15 px-4 py-1.5 text-xs text-ink/70 hover:border-forest"
        >
          Add ring sizes 12 to 20
        </button>
      </div>
    </div>
  );
}
