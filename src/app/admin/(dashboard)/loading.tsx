export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
      <div>
        <div className="h-3 w-20 rounded bg-ink/[0.06]" />
        <div className="mt-3 h-8 w-48 rounded bg-ink/[0.08]" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-paper" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-paper" />
    </div>
  );
}
