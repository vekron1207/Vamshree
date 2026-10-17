import { Suspense } from "react";
import { safeNext } from "@/lib/account-utils";
import { SignupForm } from "./signup-form";

export default function SignupPage(props: PageProps<"/account/signup">) {
  return (
    <div className="mx-auto max-w-md px-6 pb-24 pt-14">
      <h1 className="text-center font-display text-4xl text-forest">Create account</h1>
      <p className="mt-3 text-center font-tagline text-lg italic text-ink/70">
        Track orders and check out faster.
      </p>
      <Suspense fallback={<div className="mt-10 h-96 animate-pulse bg-ink/5" />}>
        <Form searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/account/signup">["searchParams"] }) {
  const { next: rawNext } = await searchParams;
  const next = safeNext(typeof rawNext === "string" ? rawNext : null);
  return <SignupForm next={next} />;
}
