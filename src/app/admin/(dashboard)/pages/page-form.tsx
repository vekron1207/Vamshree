"use client";

import type { EditablePageSlug } from "@/lib/site-pages";
import { useSubmit } from "@/lib/use-submit";
import { useActionState, useState, type ReactNode } from "react";
import { ImageUploader } from "../image-uploader";
import type { PageFormState } from "./actions";

const inputClass =
  "w-full rounded-lg border border-ink/12 bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-forest/60 focus:ring-2 focus:ring-forest/10";
const card = "rounded-2xl bg-paper p-5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] sm:p-6";

export type PageFormInitial = {
  slug: EditablePageSlug;
  title: string;
  intro: string;
  body: string;
  imageUrl: string | null;
  contact: { email: string; phone: string; whatsapp: string; address: string; hours: string };
};

export function PageForm({
  action,
  initial,
}: {
  action: (prev: PageFormState, formData: FormData) => Promise<PageFormState>;
  initial: PageFormInitial;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const onSubmit = useSubmit(formAction);
  const [title, setTitle] = useState(initial.title);
  const [intro, setIntro] = useState(initial.intro);
  const [body, setBody] = useState(initial.body);
  const isContact = initial.slug === "contact";

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <section className={card}>
          <div className="space-y-5">
            <Field label="Page title">
              <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} className={inputClass} />
            </Field>
            <Field label="Opening line" hint="Shown large, in italics, under the title.">
              <textarea name="intro" value={intro} onChange={(e) => setIntro(e.target.value)} rows={3} maxLength={600} className={`${inputClass} leading-relaxed`} />
            </Field>
            <Field label="Body" hint="Leave a blank line between paragraphs.">
              <textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} rows={10} className={`${inputClass} leading-relaxed`} />
            </Field>
          </div>
        </section>

        {isContact ? (
          <section className={card}>
            <h2 className="font-medium text-ink">Contact details</h2>
            <p className="mt-1 text-xs text-ink/50">Leave a field blank to hide it on the page.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <input name="email" type="email" defaultValue={initial.contact.email} className={inputClass} />
              </Field>
              <Field label="Phone">
                <input name="phone" type="tel" defaultValue={initial.contact.phone} placeholder="+91 98765 43210" className={inputClass} />
              </Field>
              <Field label="WhatsApp">
                <input name="whatsapp" type="tel" defaultValue={initial.contact.whatsapp} placeholder="+91 98765 43210" className={inputClass} />
              </Field>
              <Field label="Hours">
                <input name="hours" defaultValue={initial.contact.hours} placeholder="Mon-Sat, 10am-7pm" className={inputClass} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address">
                  <textarea name="address" defaultValue={initial.contact.address} rows={3} className={inputClass} />
                </Field>
              </div>
            </div>
          </section>
        ) : null}

        <section className={card}>
          <h2 className="font-medium text-ink">Image (optional)</h2>
          <div className="mt-4">
            <ImageUploader
              name="imageUrl"
              kind="pages"
              initial={initial.imageUrl ? [initial.imageUrl] : []}
              aspect="aspect-[16/9]"
              hint="Shown at the top of the page."
            />
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-forest px-8 py-3 text-sm text-cream transition-colors hover:bg-forest-deep disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save page"}
          </button>
          <a href={`/${initial.slug}`} target="_blank" rel="noreferrer" className="text-sm text-forest hover:underline">
            View page &#8599;
          </a>
          {state.savedAt && !pending ? (
            <span key={state.savedAt} role="status" className="animate-rise-in text-sm text-emerald-700">
              Saved &#10003;
            </span>
          ) : null}
        </div>
        {state.error ? (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {state.error}
          </p>
        ) : null}
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-6 rounded-2xl bg-cream p-8 ring-1 ring-ink/5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40">Preview</p>
          <h3 className="mt-6 text-center font-display text-3xl text-forest">{title || "Untitled"}</h3>
          {intro ? (
            <p className="mt-6 text-center font-tagline text-lg italic leading-relaxed text-ink/70">{intro}</p>
          ) : null}
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink/70">
            {body
              .split(/\n\s*\n/)
              .filter((p) => p.trim())
              .map((p, i) => (
                <p key={i}>{p.trim()}</p>
              ))}
          </div>
        </div>
      </aside>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-ink/55">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs leading-relaxed text-ink/45">{hint}</span> : null}
    </label>
  );
}
