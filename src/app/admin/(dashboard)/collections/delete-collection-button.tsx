"use client";

import { useState, useTransition } from "react";
import Button from "@mui/material/Button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteCollectionButton({
  action,
  name,
  productCount,
}: {
  action: () => Promise<void>;
  name: string;
  productCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <Button type="button" fullWidth color="error" variant="text" disabled={pending} onClick={() => setOpen(true)}>
        Delete collection
      </Button>
      <ConfirmDialog
        open={open}
        title={`Delete the "${name}" collection?`}
        confirmLabel="Delete"
        danger
        onClose={() => setOpen(false)}
        onConfirm={() => startTransition(async () => void (await action()))}
      >
        {productCount > 0
          ? `Its ${productCount} products stay in your catalogue but will no longer belong to a collection.`
          : "This can't be undone."}
      </ConfirmDialog>
    </>
  );
}
