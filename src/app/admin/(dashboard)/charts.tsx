"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatINR } from "@/lib/format";

type DailyPoint = { date: string; revenue: number; orders: number };

const PAD = { top: 16, right: 12, bottom: 28, left: 56 };
const HEIGHT = 240;

function niceMax(value: number) {
  if (value <= 0) return 1000;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * exp;
}

function shortINR(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(v % 100000 === 0 ? 0 : 1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return `₹${v}`;
}

function formatDay(iso: string, opts: Intl.DateTimeFormatOptions) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", opts);
}

export function RevenueChart({ data }: { data: DailyPoint[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const max = niceMax(Math.max(...data.map((d) => d.revenue)));
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const { line, area } = useMemo(() => {
    const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.revenue).toFixed(1)}`);
    const linePath = `M${pts.join("L")}`;
    const areaPath = `${linePath}L${x(data.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;
    return { line: linePath, area: areaPath };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, width, max]);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const labelEvery = Math.ceil(data.length / (width < 500 ? 4 : 7));
  const allZero = data.every((d) => d.revenue === 0);

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    setHover(Math.round(rel * (data.length - 1)));
  }

  const h = hover !== null ? data[hover] : null;

  return (
    <div ref={wrapRef} className="relative">
      <svg width={width} height={HEIGHT} role="img" aria-label="Paid revenue per day">
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="currentColor"
              className="text-ink/10"
              strokeDasharray={t === 0 ? undefined : "2 4"}
            />
            <text x={PAD.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink/45 text-[11px] tabular-nums">
              {shortINR(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % labelEvery === 0 || i === data.length - 1 ? (
            <text
              key={d.date}
              x={x(i)}
              y={HEIGHT - 8}
              textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
              className="fill-ink/45 text-[11px]"
            >
              {formatDay(d.date, { day: "numeric", month: "short" })}
            </text>
          ) : null
        )}

        <path d={area} className="fill-forest/10" />
        <path d={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" className="text-forest" />

        {h && hover !== null ? (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} stroke="currentColor" className="text-ink/30" />
            <circle cx={x(hover)} cy={y(h.revenue)} r={5} className="fill-forest stroke-paper" strokeWidth={2} />
          </g>
        ) : null}

        <rect
          x={PAD.left}
          y={PAD.top}
          width={innerW}
          height={innerH}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>

      {allZero ? (
        <p className="pointer-events-none absolute inset-x-0 top-[38%] text-center text-sm text-ink/50">
          No paid orders in this period yet
        </p>
      ) : null}

      {h && hover !== null ? (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-md border border-ink/10 bg-paper px-3 py-2 text-xs shadow-lg"
          style={{
            left: Math.min(Math.max(x(hover) - 72, 0), width - 150),
          }}
        >
          <p className="text-ink/55">{formatDay(h.date, { weekday: "short", day: "numeric", month: "short" })}</p>
          <p className="mt-1 text-sm font-medium text-ink tabular-nums">{formatINR(h.revenue)}</p>
          <p className="text-ink/55">
            {h.orders} {h.orders === 1 ? "order" : "orders"}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function BarList({
  rows,
  format = "number",
  emptyText,
}: {
  rows: { label: string; value: number; hint?: string }[];
  format?: "number" | "currency";
  emptyText: string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 0);
  if (max === 0) {
    return <p className="py-10 text-center text-sm text-ink/50">{emptyText}</p>;
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const pct = (row.value / max) * 100;
        const value = format === "currency" ? formatINR(row.value) : row.value.toLocaleString("en-IN");
        return (
          <li key={row.label} className="group" title={`${row.label}: ${value}`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink/75">{row.label}</span>
              <span className="tabular-nums text-ink">{value}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-ink/[0.06]">
              <div
                className="h-full rounded-full bg-forest transition-[width,background-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-gold"
                style={{ width: `${Math.max(pct, row.value > 0 ? 2 : 0)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
