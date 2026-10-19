"use client";

import { useTransition } from "react";
import { deleteEnquiry, setEnquiryReplied } from "./actions";

export function EnquiryActions({ id, isReplied }: { id: string; isReplied: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <span className="flex items-center gap-4 text-xs">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => void (await setEnquiryReplied(id, !isReplied)))}
        className="text-forest hover:underline disabled:opacity-50"
      >
        {isReplied ? "Mark as new" : "Mark as replied"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm("Delete this message for good?")) {
            startTransition(async () => void (await deleteEnquiry(id)));
          }
        }}
        className="text-rose-700 hover:underline disabled:opacity-50"
      >
        Delete
      </button>
    </span>
  );
}
