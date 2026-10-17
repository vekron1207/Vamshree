import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { CollectionForm } from "../collection-form";
import { deleteCollection, updateCollection } from "../actions";
import { DeleteCollectionButton } from "../delete-collection-button";

// Authenticated admin views always render fresh per request; navigations are
// allowed to wait for data rather than requiring a prerendered shell.
export const instant = false;

export default async function EditCollectionPage(props: PageProps<"/admin/collections/[id]">) {
  await connection();
  const { id } = await props.params;
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!collection) notFound();

  // A real price from this collection makes the sale preview concrete
  const sample = await prisma.product.findFirst({
    where: { collectionId: id, price: { gt: 0 } },
    orderBy: { price: "desc" },
    select: { price: true },
  });

  return (
    <div className="space-y-6">
      <Link href="/admin/collections" className="text-sm text-ink/50 hover:text-forest">
        &larr; Collections
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-forest">{collection.name}</h1>
        {collection.isVisible ? (
          <Link href={`/collections/${collection.slug}`} target="_blank" className="text-sm text-forest hover:underline">
            View on storefront &#8599;
          </Link>
        ) : (
          <span className="rounded-full bg-ink/5 px-3 py-1 text-xs text-ink/60">Hidden from storefront</span>
        )}
      </div>
      <CollectionForm
        action={updateCollection.bind(null, collection.id)}
        productCount={collection._count.products}
        samplePrice={sample ? Number(sample.price) : null}
        initial={{
          name: collection.name,
          slug: collection.slug,
          tagline: collection.tagline,
          description: collection.description,
          imageUrl: collection.imageUrl,
          sortOrder: collection.sortOrder,
          isVisible: collection.isVisible,
          saleEnabled: collection.saleEnabled,
          salePercent: collection.salePercent,
          saleLabel: collection.saleLabel,
          saleStartsAt: collection.saleStartsAt?.toISOString() ?? null,
          saleEndsAt: collection.saleEndsAt?.toISOString() ?? null,
        }}
        deleteSlot={
          <DeleteCollectionButton
            action={deleteCollection.bind(null, collection.id)}
            name={collection.name}
            productCount={collection._count.products}
          />
        }
      />
    </div>
  );
}
