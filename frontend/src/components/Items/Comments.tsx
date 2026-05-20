import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { MessageSquare } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { type CommentCreate, ItemsService } from "@/client"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

const formSchema = z.object({
  content: z
    .string()
    .min(1, { message: "Comment is required" })
    .max(1000, { message: "Comment is too long" }),
})

type FormData = z.infer<typeof formSchema>

function commentsQueryOptions(itemId: string) {
  return {
    queryFn: () => ItemsService.readItemComments({ id: itemId }),
    queryKey: ["items", itemId, "comments"],
  }
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString()
}

interface CommentsProps {
  itemId: string
}

export function Comments({ itemId }: CommentsProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const { data, isLoading } = useQuery(commentsQueryOptions(itemId))

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: { content: "" },
  })

  const mutation = useMutation({
    mutationFn: (body: CommentCreate) =>
      ItemsService.createItemComment({ id: itemId, requestBody: body }),
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

  const onSubmit = (values: FormData) => mutation.mutate(values)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="size-5" />
          Comments
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-2 sm:flex-row sm:items-start"
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
                      autoComplete="off"
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

        <div className="flex flex-col gap-4">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))
          ) : !data || data.data.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No comments yet.
            </p>
          ) : (
            data.data.map((comment) => (
              <div
                key={comment.id}
                className="flex flex-col gap-1 border-l-2 border-muted pl-3"
              >
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">
                    {comment.author_name || "Unknown"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default Comments
