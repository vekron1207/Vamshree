"use client";

export function DeleteCollectionButton({
  action,
  name,
  productCount,
}: {
  action: () => Promise<void>;
  name: string;
  productCount: number;
}) {
  return (
    <button
      type="submit"
      formAction={action}
      formNoValidate
      onClick={(e) => {
        const detail =
          productCount > 0
            ? `Its ${productCount} products stay in your catalogue but will no longer belong to a collection.`
            : "";
        if (!window.confirm(`Delete the "${name}" collection? ${detail}`.trim())) e.preventDefault();
      }}
      className="w-full rounded-full px-5 py-2.5 text-sm text-rose-700 transition-colors hover:bg-rose-50"
    >
      Delete collection
    </button>
  );
}
