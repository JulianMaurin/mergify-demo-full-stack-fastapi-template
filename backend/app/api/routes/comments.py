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
)

router = APIRouter(prefix="/items/{item_id}/comments", tags=["comments"])


def _get_viewable_item(
    session: SessionDep, current_user: CurrentUser, item_id: uuid.UUID
) -> Item:
    item = session.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return item


@router.get("/", response_model=CommentsPublic)
def read_comments(
    session: SessionDep,
    current_user: CurrentUser,
    item_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    List comments on an item.
    """
    _get_viewable_item(session, current_user, item_id)
    count_statement = (
        select(func.count()).select_from(Comment).where(Comment.item_id == item_id)
    )
    count = session.exec(count_statement).one()
    statement = (
        select(Comment)
        .where(Comment.item_id == item_id)
        .order_by(col(Comment.created_at).asc())
        .offset(skip)
        .limit(limit)
    )
    comments = session.exec(statement).all()
    return CommentsPublic(
        data=[CommentPublic.model_validate(c) for c in comments], count=count
    )


@router.post("/", response_model=CommentPublic)
def create_comment(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    item_id: uuid.UUID,
    comment_in: CommentCreate,
) -> Any:
    """
    Post a new comment on an item.
    """
    _get_viewable_item(session, current_user, item_id)
    comment = Comment.model_validate(
        comment_in,
        update={
            "item_id": item_id,
            "author_id": current_user.id,
            "author_name": current_user.full_name,
        },
    )
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return comment
