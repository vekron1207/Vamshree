"use client";

import { useState, useTransition } from "react";
import Button from "@mui/material/Button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteEnquiry, setEnquiryReplied } from "./actions";

export function EnquiryActions({ id, isReplied }: { id: string; isReplied: boolean }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  return (
    <span className="flex items-center gap-1">
      <Button
        size="small"
        variant="text"
        disabled={pending}
        onClick={() => startTransition(async () => void (await setEnquiryReplied(id, !isReplied)))}
      >
        {isReplied ? "Mark as new" : "Mark as replied"}
      </Button>
      <Button size="small" variant="text" color="error" disabled={pending} onClick={() => setConfirming(true)}>
        Delete
      </Button>
      <ConfirmDialog
        open={confirming}
        title="Delete this message for good?"
        confirmLabel="Delete"
        danger
        onClose={() => setConfirming(false)}
        onConfirm={() => startTransition(async () => void (await deleteEnquiry(id)))}
      />
    </span>
  );
}
