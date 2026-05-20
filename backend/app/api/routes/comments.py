import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Comment,
    CommentCreate,
    CommentPublic,
    CommentsPublic,
    Item,
    User,
)

router = APIRouter(prefix="/items/{item_id}/comments", tags=["comments"])


def _get_item_or_403(
    session: SessionDep, current_user: CurrentUser, item_id: uuid.UUID
) -> Item:
    item = session.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return item


def _to_public(comment: Comment, author: User) -> CommentPublic:
    return CommentPublic(
        id=comment.id,
        item_id=comment.item_id,
        author_id=comment.author_id,
        author_email=author.email,
        author_full_name=author.full_name,
        content=comment.content,
        created_at=comment.created_at,
    )


@router.get("/", response_model=CommentsPublic)
def read_comments(
    session: SessionDep,
    current_user: CurrentUser,
    item_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve comments for an item.
    """
    _get_item_or_403(session, current_user, item_id)

    count_statement = (
        select(func.count()).select_from(Comment).where(Comment.item_id == item_id)
    )
    count = session.exec(count_statement).one()
    statement = (
        select(Comment, User)
        .join(User, col(Comment.author_id) == col(User.id))
        .where(Comment.item_id == item_id)
        .order_by(col(Comment.created_at).desc())
        .offset(skip)
        .limit(limit)
    )
    rows = session.exec(statement).all()
    data = [_to_public(comment, author) for comment, author in rows]
    return CommentsPublic(data=data, count=count)


@router.post("/", response_model=CommentPublic)
def create_comment(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    item_id: uuid.UUID,
    comment_in: CommentCreate,
) -> Any:
    """
    Post a comment on an item.
    """
    _get_item_or_403(session, current_user, item_id)
    comment = Comment.model_validate(
        comment_in, update={"item_id": item_id, "author_id": current_user.id}
    )
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return _to_public(comment, current_user)
