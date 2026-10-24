"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/SearchRounded";
import CloseIcon from "@mui/icons-material/CloseRounded";

type Category = { slug: string; label: string };

const SORTS = [
  { value: "new", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A-Z" },
];

// Shop search, price range, sort and category chips. Everything applies as you go:
// pick a chip or a sort and the grid updates; typing waits a moment first.
export function ShopFilters({
  categories,
  initial,
}: {
  categories: Category[];
  initial: { q: string; min: string; max: string; sort: string; category: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(initial.q);
  const [min, setMin] = useState(initial.min);
  const [max, setMax] = useState(initial.max);
  const [sort, setSort] = useState(initial.sort || "new");
  const [category, setCategory] = useState(initial.category);
  const timer = useRef<number | null>(null);
  const first = useRef(true);

  function push(next: { q: string; min: string; max: string; sort: string; category: string }) {
    const params = new URLSearchParams();
    if (next.category) params.set("category", next.category);
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.min) params.set("min", next.min);
    if (next.max) params.set("max", next.max);
    if (next.sort && next.sort !== "new") params.set("sort", next.sort);
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  // Typing in the search or price boxes applies after a short pause
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    timer.current = window.setTimeout(() => push({ q, min, max, sort, category }), 450);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, min, max]);

  const dirty = Boolean(q || min || max || sort !== "new");

  function clearAll() {
    setQ("");
    setMin("");
    setMax("");
    setSort("new");
    push({ q: "", min: "", max: "", sort: "new", category });
  }

  const money = (v: string) => v.replace(/[^\d]/g, "").slice(0, 7);

  return (
    <Box sx={{ mx: "auto", mt: 5, maxWidth: 880 }}>
      <Box sx={{ height: 3, mb: 1.5 }}>
        {pending ? <LinearProgress color="secondary" sx={{ borderRadius: 2 }} /> : null}
      </Box>

      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", sm: "2fr 1fr 1fr 1.4fr" }, alignItems: "center" }}>
        <TextField
          variant="outlined"
          size="small"
          label="Search"
          placeholder="Necklace, pearl, ring..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ gridColumn: { xs: "1 / -1", sm: "auto" }, "& .MuiOutlinedInput-root": { borderRadius: 999 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: q ? (
                <InputAdornment position="end">
                  <CloseIcon fontSize="small" sx={{ cursor: "pointer", opacity: 0.6 }} onClick={() => setQ("")} aria-label="Clear search" />
                </InputAdornment>
              ) : null,
            },
          }}
        />
        <TextField
          variant="outlined"
          size="small"
          label="Min price"
          value={min}
          onChange={(e) => setMin(money(e.target.value))}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 999 } }}
          slotProps={{
            htmlInput: { inputMode: "numeric" },
            input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
          }}
        />
        <TextField
          variant="outlined"
          size="small"
          label="Max price"
          value={max}
          onChange={(e) => setMax(money(e.target.value))}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 999 } }}
          slotProps={{
            htmlInput: { inputMode: "numeric" },
            input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
          }}
        />
        <FormControl size="small" sx={{ gridColumn: { xs: "1 / -1", sm: "auto" } }}>
          <InputLabel id="shop-sort-label">Sort by</InputLabel>
          <Select
            labelId="shop-sort-label"
            label="Sort by"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              push({ q, min, max, sort: e.target.value, category });
            }}
            sx={{ borderRadius: 999 }}
          >
            {SORTS.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mt: 2.5, display: "flex", flexWrap: { sm: "wrap" }, justifyContent: { sm: "center" }, gap: 1, overflowX: { xs: "auto", sm: "visible" }, pb: 0.5, mx: { xs: -2.5, sm: 0 }, px: { xs: 2.5, sm: 0 }, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
        {[{ slug: "", label: "All" }, ...categories].map((c) => {
          const active = category === c.slug;
          return (
            <Chip
              key={c.slug || "all"}
              label={c.label}
              clickable
              color={active ? "primary" : "default"}
              variant={active ? "filled" : "outlined"}
              onClick={() => {
                setCategory(c.slug);
                push({ q, min, max, sort, category: c.slug });
              }}
              sx={{ flexShrink: 0, px: 0.5, ...(active ? {} : { borderColor: "rgba(14,59,34,0.25)", color: "primary.main" }) }}
            />
          );
        })}
      </Box>

      {dirty ? (
        <Box sx={{ mt: 1.5, textAlign: "center" }}>
          <Button size="small" onClick={clearAll} color="primary" variant="text">
            Clear filters
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
