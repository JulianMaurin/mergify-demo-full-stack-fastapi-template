import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Suspense } from "react"

import { ItemsService } from "@/client"
import { AddComment } from "@/components/Comments/AddComment"
import { CommentList } from "@/components/Comments/CommentList"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{item.title}</CardTitle>
        {item.description ? (
          <CardDescription>{item.description}</CardDescription>
        ) : null}
      </CardHeader>
    </Card>
  )
}

function CommentsSection({ id }: { id: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AddComment itemId={id} />
        <Suspense
          fallback={
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          }
        >
          <CommentList itemId={id} />
        </Suspense>
      </CardContent>
    </Card>
  )
}

function ItemDetail() {
  const { id } = Route.useParams()
  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/items"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="size-4" />
        Back to items
      </Link>
      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
          </Card>
        }
      >
        <ItemHeader id={id} />
      </Suspense>
      <CommentsSection id={id} />
    </div>
  )
}
