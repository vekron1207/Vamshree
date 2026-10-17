import { Suspense } from "react";
import { safeNext } from "@/lib/account-utils";
import { LoginForm } from "./login-form";

export default function LoginPage(props: PageProps<"/account/login">) {
  return (
    <div className="mx-auto max-w-md px-6 pb-24 pt-14">
      <h1 className="text-center font-display text-4xl text-forest">Sign in</h1>
      <p className="mt-3 text-center font-tagline text-lg italic text-ink/70">
        See your orders and saved addresses.
      </p>
      <Suspense fallback={<div className="mt-10 h-64 animate-pulse bg-ink/5" />}>
        <Form searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/account/login">["searchParams"] }) {
  const { next: rawNext } = await searchParams;
  const next = safeNext(typeof rawNext === "string" ? rawNext : null);
  return <LoginForm next={next} />;
}
