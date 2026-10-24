"use client";

import Image from "next/image";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import { BrandMark } from "@/components/brand";
import { AdminInput, FormAlert, SubmitButton } from "@/components/ui/fields";
import { useSubmit } from "@/lib/use-submit";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const onSubmit = useSubmit(formAction);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-forest-deep lg:block">
        <Image
          src="/brand/category-earring.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest-deep/30 to-transparent" />
        <p className="absolute bottom-12 left-12 right-12 font-tagline text-2xl italic leading-relaxed text-cream/90">
          Every story deserves more than to be told.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="animate-rise-in w-full max-w-sm">
          <BrandMark size="md" />
          <h1 className="mt-6 font-display text-3xl text-forest">Studio sign in</h1>
          <p className="mt-2 text-sm text-ink/60">Manage products, stock and orders.</p>

          <form onSubmit={onSubmit} className="mt-10 space-y-5">
            <AdminInput label="Email" name="email" type="email" required htmlInput={{ autoComplete: "email" }} />
            <AdminInput label="Password" name="password" type="password" required htmlInput={{ autoComplete: "current-password" }} />
            <FormAlert>{state.error}</FormAlert>
            <SubmitButton pending={pending} pendingText="Signing in..." size="large" fullWidth>
              Sign in
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
