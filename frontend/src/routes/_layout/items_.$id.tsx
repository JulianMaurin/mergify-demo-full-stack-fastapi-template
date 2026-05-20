import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { Suspense } from "react"

import { ItemsService } from "@/client"
import Comments from "@/components/Items/Comments"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function itemQueryOptions(id: string) {
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

function ItemHeader({ id }: { id: string }) {
  const { data: item } = useSuspenseQuery(itemQueryOptions(id))
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{item.title}</CardTitle>
        <CardDescription>
          {item.description || "No description"}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground font-mono">
        {item.id}
      </CardContent>
    </Card>
  )
}

function ItemHeaderSkeleton() {
  return (
    <Card>
      <CardHeader className="gap-2">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-64" />
      </CardContent>
    </Card>
  )
}

function ItemDetail() {
  const { id } = Route.useParams()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/items">
            <ChevronLeft />
            Back to items
          </Link>
        </Button>
      </div>
      <Suspense fallback={<ItemHeaderSkeleton />}>
        <ItemHeader id={id} />
      </Suspense>
      <Comments itemId={id} />
    </div>
  )
}
