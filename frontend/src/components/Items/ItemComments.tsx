import { zodResolver } from "@hookform/resolvers/zod"
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { Suspense } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { type CommentCreate, CommentsService } from "@/client"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { Skeleton } from "@/components/ui/skeleton"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const commentsQueryKey = (itemId: string) => ["items", itemId, "comments"]

function getCommentsQueryOptions(itemId: string) {
  return {
    queryFn: () =>
      CommentsService.readComments({ itemId, skip: 0, limit: 100 }),
    queryKey: commentsQueryKey(itemId),
  }
}

const formSchema = z.object({
  content: z
    .string()
    .min(1, { message: "Comment cannot be empty" })
    .max(1000, { message: "Comment must be 1000 characters or fewer" }),
})

type FormData = z.infer<typeof formSchema>

function CommentForm({ itemId }: { itemId: string }) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
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
      queryClient.invalidateQueries({ queryKey: commentsQueryKey(itemId) })
    },
  })

  const onSubmit = (data: FormData) => mutation.mutate(data)

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex items-start gap-2"
      >
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem className="flex-1">
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
        <LoadingButton type="submit" loading={mutation.isPending}>
          Post
        </LoadingButton>
      </form>
    </Form>
  )
}

function CommentList({ itemId }: { itemId: string }) {
  const { data } = useSuspenseQuery(getCommentsQueryOptions(itemId))

  if (data.data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">No comments yet.</p>
    )
  }

  return (
    <ul className="flex flex-col gap-4">
      {data.data.map((comment) => {
        const author = comment.author_full_name || comment.author_email
        const timestamp = comment.created_at
          ? new Date(comment.created_at).toLocaleString()
          : ""
        return (
          <li key={comment.id} className="rounded-md border p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium text-sm">{author}</span>
              <span className="text-xs text-muted-foreground">{timestamp}</span>
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap">
              {comment.content}
            </p>
          </li>
        )
      })}
    </ul>
  )
}

function CommentListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-md border p-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-4 w-full" />
        </div>
      ))}
    </div>
  )
}

export function ItemComments({ itemId }: { itemId: string }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Comments</h2>
      <CommentForm itemId={itemId} />
      <Suspense fallback={<CommentListSkeleton />}>
        <CommentList itemId={itemId} />
      </Suspense>
    </section>
  )
}

export default ItemComments
