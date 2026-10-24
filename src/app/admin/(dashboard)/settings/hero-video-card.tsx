"use client";

import { useState, useTransition } from "react";
import { saveHeroVideos } from "./actions";

type Slot = { url: string; custom: boolean };

const card = "rounded-2xl bg-paper p-5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] sm:p-6";

function VideoSlot({
  title,
  spec,
  value,
  fallback,
  onChange,
  portrait,
}: {
  title: string;
  spec: string;
  value: string;
  fallback: string;
  onChange: (url: string) => void;
  portrait?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shown = value || fallback;

  async function upload(file: File) {
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/admin/upload-video", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as { ok: boolean; url?: string; error?: string } | null;
      if (!data?.ok || !data.url) setError(data?.error ?? "The upload failed. Try a smaller file.");
      else onChange(data.url);
    } catch {
      setError("The upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-ink/10 p-4">
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1 text-xs text-ink/50">{spec}</p>
      <div className={`mt-3 overflow-hidden rounded-lg bg-forest-deep ${portrait ? "mx-auto aspect-[9/16] max-w-[9rem]" : "aspect-video"}`}>
        {/* key: reload the preview when the file changes */}
        <video key={shown} src={shown} muted loop playsInline autoPlay className="h-full w-full object-cover" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <label className="cursor-pointer rounded-full border border-forest/30 px-4 py-1.5 text-xs text-forest hover:bg-forest hover:text-cream">
          {busy ? "Uploading..." : "Choose a video"}
          <input
            type="file"
            accept="video/mp4,video/webm"
            disabled={busy}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void upload(f);
            }}
          />
        </label>
        {value ? (
          <button type="button" onClick={() => onChange("")} className="text-xs text-ink/60 hover:text-rose-700">
            Use the original video
          </button>
        ) : (
          <span className="text-xs text-ink/45">Using the original video</span>
        )}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function HeroVideoCard({
  desktop,
  mobile,
  defaults,
}: {
  desktop: Slot;
  mobile: Slot;
  defaults: { desktop: string; mobile: string };
}) {
  const [d, setD] = useState(desktop.custom ? desktop.url : "");
  const [m, setM] = useState(mobile.custom ? mobile.url : "");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <section className={card}>
      <h2 className="font-medium text-ink">Homepage video</h2>
      <p className="mt-1 text-xs text-ink/50">
        The film at the top of the homepage. Laptops and desktops (screens 900 pixels wide and up) show the
        desktop video; phones and small tablets show the mobile one. Pick a file, check the preview, then Save.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <VideoSlot
          title="Desktop video"
          spec="Landscape, 16:9, 1920 × 1080. MP4 (H.264), up to 40 MB; a few MB loads fastest."
          value={d}
          fallback={defaults.desktop}
          onChange={setD}
        />
        <VideoSlot
          title="Mobile video"
          spec="Portrait, 9:16, 1080 × 1920. MP4 (H.264), up to 40 MB; a few MB loads fastest."
          value={m}
          fallback={defaults.mobile}
          onChange={setM}
          portrait
        />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const fd = new FormData();
              fd.set("desktop", d);
              fd.set("mobile", m);
              const res = await saveHeroVideos(fd);
              setMsg(res.ok ? { ok: true, text: "Saved. The homepage now uses these videos." } : { ok: false, text: res.error });
            })
          }
          className="rounded-full bg-forest px-6 py-2.5 text-sm text-cream hover:bg-forest-deep disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        {msg ? (
          <span role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-forest" : "text-rose-700"}`}>
            {msg.text}
          </span>
        ) : null}
      </div>
    </section>
  );
}
