import Link from "next/link";
import { CollectionForm } from "../collection-form";
import { createCollection } from "../actions";

export default function NewCollectionPage() {
  return (
    <div className="space-y-6">
      <Link href="/admin/collections" className="text-sm text-ink/50 hover:text-forest">
        &larr; Collections
      </Link>
      <h1 className="font-display text-3xl text-forest">New collection</h1>
      <CollectionForm action={createCollection} />
    </div>
  );
}
