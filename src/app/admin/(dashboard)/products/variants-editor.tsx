"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/AddRounded";
import CloseIcon from "@mui/icons-material/CloseRounded";
import { AdminInput } from "@/components/ui/fields";

export type VariantRow = { id?: string; label: string; stock: number };

const RING_SIZES = ["12", "13", "14", "15", "16", "17", "18", "19", "20"];

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
        <ul className="space-y-3">
          {rows.map((r, i) => (
            <li key={r.id ?? `new-${i}`} className="flex items-center gap-2">
              <AdminInput
                label="Size"
                placeholder="e.g. 14"
                value={r.label}
                onChange={(e) => commit(rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                htmlInput={{ "aria-label": "Size label", maxLength: 40 }}
                sx={{ flex: 1, minWidth: 0 }}
              />
              <AdminInput
                label="Stock"
                type="number"
                value={r.stock}
                onChange={(e) =>
                  commit(rows.map((x, j) => (j === i ? { ...x, stock: Math.max(0, Math.floor(Number(e.target.value) || 0)) } : x)))
                }
                htmlInput={{ "aria-label": `Stock for size ${r.label}`, min: 0 }}
                sx={{ width: 100, flexShrink: 0 }}
              />
              <IconButton aria-label={`Remove size ${r.label}`} onClick={() => commit(rows.filter((_, j) => j !== i))} size="small" sx={{ "&:hover": { color: "error.main" } }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => commit([...rows, { label: "", stock: 0 }])}>
          Add size
        </Button>
        <Button size="small" variant="text" color="inherit" onClick={addPreset}>
          Add ring sizes 12 to 20
        </Button>
      </div>
    </div>
  );
}
