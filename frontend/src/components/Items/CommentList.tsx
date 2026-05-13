import { useSuspenseQuery } from "@tanstack/react-query"

import { type CommentPublic, ItemsService } from "@/client"

function authorName(comment: CommentPublic): string {
  return comment.author_full_name?.trim() || comment.author_email
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString()
}

export function getItemCommentsQueryOptions(itemId: string) {
  return {
    queryFn: () => ItemsService.readItemComments({ id: itemId }),
    queryKey: ["item-comments", itemId],
  }
}

const CommentList = ({ itemId }: { itemId: string }) => {
  const { data: comments } = useSuspenseQuery(
    getItemCommentsQueryOptions(itemId),
  )

  if (comments.data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No comments yet. Be the first to comment.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-4">
      {comments.data.map((comment) => (
        <li
          key={comment.id}
          className="rounded-md border border-border bg-muted/30 p-3"
        >
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className="text-sm font-medium">{authorName(comment)}</span>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(comment.created_at)}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </li>
      ))}
    </ul>
  )
}

export default CommentList
