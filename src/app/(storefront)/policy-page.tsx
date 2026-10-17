export function PolicyPage({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl text-forest">{title}</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-ink/70">
        {children ?? (
          <p>
            This page is a placeholder. Final {title.toLowerCase()} content
            will go here before launch - contact Vaamshri directly with any
            questions in the meantime.
          </p>
        )}
      </div>
    </div>
  );
}
