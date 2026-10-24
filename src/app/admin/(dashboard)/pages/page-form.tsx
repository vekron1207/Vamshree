"use client";

import type { EditablePageSlug } from "@/lib/site-pages";
import { useSubmit } from "@/lib/use-submit";
import { useActionState, useState } from "react";
import { AdminInput, FormAlert, SubmitButton } from "@/components/ui/fields";
import { LinkButton } from "@/components/ui/link-button";
import { ImageUploader } from "../image-uploader";
import type { PageFormState } from "./actions";

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
            <AdminInput label="Page title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required htmlInput={{ maxLength: 120 }} />
            <AdminInput label="Opening line" name="intro" value={intro} onChange={(e) => setIntro(e.target.value)} multiline minRows={3} hint="Shown large, in italics, under the title." htmlInput={{ maxLength: 600 }} />
            <AdminInput label="Body" name="body" value={body} onChange={(e) => setBody(e.target.value)} multiline minRows={10} hint="Leave a blank line between paragraphs." />
          </div>
        </section>

        {isContact ? (
          <section className={card}>
            <h2 className="font-medium text-ink">Contact details</h2>
            <p className="mt-1 text-xs text-ink/50">Leave a field blank to hide it on the page.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <AdminInput label="Email" name="email" type="email" defaultValue={initial.contact.email} />
              <AdminInput label="Phone" name="phone" type="tel" defaultValue={initial.contact.phone} placeholder="+91 98765 43210" />
              <AdminInput label="WhatsApp" name="whatsapp" type="tel" defaultValue={initial.contact.whatsapp} placeholder="+91 98765 43210" />
              <AdminInput label="Hours" name="hours" defaultValue={initial.contact.hours} placeholder="Mon-Sat, 10am-7pm" />
              <AdminInput label="Address" name="address" defaultValue={initial.contact.address} multiline minRows={3} sx={{ gridColumn: { sm: "1 / -1" } }} />
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
          <SubmitButton pending={pending} pendingText="Saving..." size="large">
            Save page
          </SubmitButton>
          <LinkButton href={`/${initial.slug}`} target="_blank" rel="noreferrer" variant="text">
            View page &#8599;
          </LinkButton>
          {state.savedAt && !pending ? (
            <span key={state.savedAt} role="status" className="animate-rise-in text-sm text-emerald-700">
              Saved &#10003;
            </span>
          ) : null}
        </div>
        <FormAlert>{state.error}</FormAlert>
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
