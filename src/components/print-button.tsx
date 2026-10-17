"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-forest px-6 py-2.5 text-xs uppercase tracking-[0.16em] text-cream hover:bg-forest-deep"
    >
      Print / Save as PDF
    </button>
  );
}
