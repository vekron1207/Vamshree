"use client";

import Image from "next/image";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import { BrandMark } from "@/components/brand";
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
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-ink/55">
                Email
              </span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-ink/12 bg-paper px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-forest/60 focus:ring-2 focus:ring-forest/10"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-ink/55">
                Password
              </span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-ink/12 bg-paper px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-forest/60 focus:ring-2 focus:ring-forest/10"
              />
            </label>
            {state.error ? (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {state.error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-forest px-6 py-3 text-sm text-cream transition-colors hover:bg-forest-deep disabled:opacity-50"
            >
              {pending ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
