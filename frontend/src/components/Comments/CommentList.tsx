import { useSuspenseQuery } from "@tanstack/react-query"
import { MessageSquare } from "lucide-react"

import { type CommentPublic, CommentsService } from "@/client"

export function getCommentsQueryOptions(itemId: string) {
  return {
    queryFn: () =>
      CommentsService.readComments({ itemId, skip: 0, limit: 100 }),
    queryKey: ["comments", itemId],
  }
}

function formatTimestamp(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function CommentRow({ comment }: { comment: CommentPublic }) {
  return (
    <div className="border-b last:border-b-0 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium text-sm">
          {comment.author_name || "Anonymous"}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(comment.created_at)}
        </span>
      </div>
      <p className="text-sm mt-1 whitespace-pre-wrap break-words">
        {comment.content}
      </p>
    </div>
  )
}

export function CommentList({ itemId }: { itemId: string }) {
  const { data } = useSuspenseQuery(getCommentsQueryOptions(itemId))

  if (data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No comments yet</h3>
        <p className="text-muted-foreground text-sm">
          Be the first to leave a comment.
        </p>
      </div>
    )
  }

  return (
    <div>
      {data.data.map((comment) => (
        <CommentRow key={comment.id} comment={comment} />
      ))}
    </div>
  )
}
