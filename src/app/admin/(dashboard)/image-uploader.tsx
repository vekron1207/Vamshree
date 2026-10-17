"use client";

import { useRef, useState } from "react";
import { uploadImageAction } from "./upload-actions";

type Kind = "products" | "collections" | "pages";

type PendingUpload = { id: string; name: string; preview: string };

export function ImageUploader({
  name,
  kind,
  initial,
  multiple = false,
  aspect = "aspect-[4/5]",
  hint,
}: {
  /** Hidden input name; value is a JSON array of URLs (multiple) or a single URL */
  name: string;
  kind: Kind;
  initial: string[];
  multiple?: boolean;
  aspect?: string;
  hint?: string;
}) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | File[]) {
    setError(null);
    const list = [...files].filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      setError("Choose a JPG, PNG or WebP image.");
      return;
    }
    const batch = multiple ? list : list.slice(0, 1);
    const items = batch.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      preview: URL.createObjectURL(f),
      file: f,
    }));
    setPending((p) => [...p, ...items]);

    // Upload sequentially so a large batch can't exceed the request limit
    for (const item of items) {
      const fd = new FormData();
      fd.append("file", item.file);
      fd.append("kind", kind);
      const result = await uploadImageAction(fd);
      setPending((p) => p.filter((x) => x.id !== item.id));
      URL.revokeObjectURL(item.preview);
      if ("error" in result) {
        setError(`${item.name}: ${result.error}`);
      } else {
        setUrls((prev) => (multiple ? [...prev, result.url] : [result.url]));
      }
    }
  }

  function move(index: number, delta: number) {
    setUrls((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    if (!/^https:\/\//.test(url) && !url.startsWith("/")) {
      setError("Image links must start with https://");
      return;
    }
    setUrls((prev) => (multiple ? [...prev, url] : [url]));
    setUrlDraft("");
    setError(null);
  }

  const busy = pending.length > 0;
  const showDropzone = multiple || (urls.length === 0 && pending.length === 0);

  return (
    <div>
      <input type="hidden" name={name} value={multiple ? JSON.stringify(urls) : (urls[0] ?? "")} />

      {urls.length > 0 || pending.length > 0 ? (
        <ul className={`grid gap-3 ${multiple ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-1"}`}>
          {urls.map((url, i) => (
            <li key={url} className="group relative">
              <div className={`${aspect} overflow-hidden rounded-xl bg-cream ring-1 ring-ink/10`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </div>
              {multiple && i === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-forest px-2 py-0.5 text-[10px] uppercase tracking-wider text-cream">
                  Main
                </span>
              ) : null}
              <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                {multiple ? (
                  <span className="flex gap-1">
                    <IconButton label="Move earlier" disabled={i === 0} onClick={() => move(i, -1)}>
                      &larr;
                    </IconButton>
                    <IconButton label="Move later" disabled={i === urls.length - 1} onClick={() => move(i, 1)}>
                      &rarr;
                    </IconButton>
                  </span>
                ) : (
                  <IconButton label="Replace image" onClick={() => inputRef.current?.click()}>
                    Replace
                  </IconButton>
                )}
                <IconButton label="Remove image" onClick={() => setUrls((prev) => prev.filter((u) => u !== url))}>
                  &#10005;
                </IconButton>
              </div>
            </li>
          ))}
          {pending.map((p) => (
            <li key={p.id} className="relative">
              <div className={`${aspect} overflow-hidden rounded-xl bg-cream ring-1 ring-ink/10`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview} alt="" className="h-full w-full object-cover opacity-40" />
              </div>
              <span className="absolute inset-0 flex items-center justify-center text-xs text-forest">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-forest/30 border-t-forest" aria-hidden />
                <span className="sr-only">Uploading {p.name}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {showDropzone ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
          }}
          className={`mt-3 flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragging ? "border-forest bg-forest/5" : "border-ink/15 hover:border-forest/50 hover:bg-cream/60"
          }`}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-forest" aria-hidden>
            <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm text-ink">
            {busy ? "Uploading..." : multiple ? "Upload images" : "Upload an image"}
          </span>
          <span className="text-xs text-ink/50">Drag and drop, or click to choose. JPG, PNG or WebP, up to 10 MB.</span>
        </button>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files?.length) upload(e.target.files);
          e.target.value = "";
        }}
      />

      {hint ? <p className="mt-2 text-xs text-ink/45">{hint}</p> : null}

      <details className="mt-3 text-xs text-ink/55">
        <summary className="cursor-pointer select-none hover:text-ink">Use an image link instead</summary>
        <div className="mt-2 flex gap-2">
          <input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="https://..."
            className="min-w-0 flex-1 rounded-lg border border-ink/12 bg-paper px-3 py-2 text-sm outline-none focus:border-forest/60"
          />
          <button type="button" onClick={addUrl} className="rounded-lg bg-ink/5 px-3 text-sm text-ink hover:bg-ink/10">
            Add
          </button>
        </div>
      </details>

      {error ? (
        <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="min-w-7 rounded-full bg-paper/95 px-2 py-1 text-xs text-ink shadow ring-1 ring-ink/10 transition-colors hover:bg-paper disabled:opacity-30"
    >
      {children}
    </button>
  );
}
