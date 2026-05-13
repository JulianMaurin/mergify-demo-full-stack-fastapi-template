import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Suspense } from "react"

import { ItemsService } from "@/client"
import AddComment from "@/components/Items/AddComment"
import CommentList from "@/components/Items/CommentList"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

function getItemQueryOptions(id: string) {
  return {
    queryFn: () => ItemsService.readItem({ id }),
    queryKey: ["item", id],
  }
}

export const Route = createFileRoute("/_layout/items_/$id")({
  component: ItemDetail,
  head: () => ({
    meta: [{ title: "Item - FastAPI Template" }],
  }),
})

function ItemHeader({ id }: { id: string }) {
  const { data: item } = useSuspenseQuery(getItemQueryOptions(id))
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{item.title}</h1>
      {item.description ? (
        <p className="text-muted-foreground">{item.description}</p>
      ) : (
        <p className="text-muted-foreground italic">No description</p>
      )}
    </div>
  )
}

function CommentsSection({ id }: { id: string }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Comments</h2>
      <Suspense
        fallback={
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        }
      >
        <CommentList itemId={id} />
      </Suspense>
      <AddComment itemId={id} />
    </section>
  )
}

function ItemDetail() {
  const { id } = Route.useParams()
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/items">
          <Button variant="ghost" size="sm" className="-ml-3">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to items
          </Button>
        </Link>
      </div>
      <Suspense fallback={<Skeleton className="h-12 w-1/3" />}>
        <ItemHeader id={id} />
      </Suspense>
      <CommentsSection id={id} />
    </div>
  )
}
