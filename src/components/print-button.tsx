"use client";

import Button from "@mui/material/Button";

export function PrintButton() {
  return (
    <Button variant="contained" size="small" onClick={() => window.print()}>
      Print / Save as PDF
    </Button>
  );
}
