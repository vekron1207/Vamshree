"use client";

import { startTransition, type FormEvent } from "react";

// React 19 resets uncontrolled fields after a <form action={...}> completes,
// even when the action returned a validation error - which wipes what the
// person typed. Submitting through onSubmit with the same action keeps pending
// state and results but leaves the form's values alone.
export function useSubmit(formAction: (formData: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => formAction(data));
  };
}
