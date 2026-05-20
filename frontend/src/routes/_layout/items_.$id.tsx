import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Suspense } from "react"

import { ItemsService } from "@/client"
import ItemComments from "@/components/Items/ItemComments"
import { Skeleton } from "@/components/ui/skeleton"

function getItemQueryOptions(id: string) {
  return {
    queryFn: () => ItemsService.readItem({ id }),
    queryKey: ["items", id],
  }
}

export const Route = createFileRoute("/_layout/items_/$id")({
  component: ItemDetail,
  head: () => ({
    meta: [{ title: "Item - FastAPI Template" }],
  }),
})

function ItemDetailContent() {
  const { id } = Route.useParams()
  const { data: item } = useSuspenseQuery(getItemQueryOptions(id))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{item.title}</h1>
        <p className="text-muted-foreground">
          {item.description || "No description"}
        </p>
      </div>
      <ItemComments itemId={item.id} />
    </div>
  )
}

function ItemDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

function ItemDetail() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/items"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to items
      </Link>
      <Suspense fallback={<ItemDetailSkeleton />}>
        <ItemDetailContent />
      </Suspense>
    </div>
  )
}
