import { zodResolver } from "@hookform/resolvers/zod"
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, MessageSquare } from "lucide-react"
import { Suspense } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { type CommentCreate, CommentsService, ItemsService } from "@/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { Skeleton } from "@/components/ui/skeleton"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const formSchema = z.object({
  content: z
    .string()
    .min(1, { message: "Comment is required" })
    .max(1000, { message: "Comment is too long" }),
})

type FormData = z.infer<typeof formSchema>

function itemQueryOptions(id: string) {
  return {
    queryFn: () => ItemsService.readItem({ id }),
    queryKey: ["items", id],
  }
}

function commentsQueryOptions(itemId: string) {
  return {
    queryFn: () =>
      CommentsService.readComments({ itemId, skip: 0, limit: 100 }),
    queryKey: ["items", itemId, "comments"],
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

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return ""
  return new Date(value).toLocaleString()
}

function CommentList({ itemId }: { itemId: string }) {
  const { data: comments } = useSuspenseQuery(commentsQueryOptions(itemId))

  if (comments.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-8">
        <div className="rounded-full bg-muted p-3 mb-3">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No comments yet</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {comments.data.map((c) => (
        <li
          key={c.id}
          className="rounded-md border bg-card p-3 flex flex-col gap-1"
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {c.author_name || "Unknown"}
            </span>
            <span>{formatTimestamp(c.created_at)}</span>
          </div>
          <p className="whitespace-pre-wrap">{c.content}</p>
        </li>
      ))}
    </ul>
  )
}

function AddComment({ itemId }: { itemId: string }) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: { content: "" },
  })

  const mutation = useMutation({
    mutationFn: (data: CommentCreate) =>
      CommentsService.createComment({ itemId, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Comment posted")
      form.reset()
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["items", itemId, "comments"],
      })
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        className="flex flex-col gap-3"
      >
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Add a comment</FormLabel>
              <FormControl>
                <Input
                  placeholder="Write a comment..."
                  type="text"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <LoadingButton type="submit" loading={mutation.isPending}>
            Post
          </LoadingButton>
        </div>
      </form>
    </Form>
  )
}

function CommentsSection({ itemId }: { itemId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Suspense fallback={<Skeleton className="h-24 w-full" />}>
          <CommentList itemId={itemId} />
        </Suspense>
        <AddComment itemId={itemId} />
      </CardContent>
    </Card>
  )
}

function ItemDetail() {
  const { id } = Route.useParams()

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="self-start" asChild>
        <Link to="/items">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to items
        </Link>
      </Button>
      <Suspense fallback={<Skeleton className="h-16 w-1/2" />}>
        <ItemHeader id={id} />
      </Suspense>
      <CommentsSection itemId={id} />
    </div>
  )
}
