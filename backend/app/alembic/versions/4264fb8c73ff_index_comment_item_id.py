"""Index comment.item_id

Revision ID: 4264fb8c73ff
Revises: 7a6ba84f6811
Create Date: 2026-05-13 12:15:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '4264fb8c73ff'
down_revision = '7a6ba84f6811'
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(op.f('ix_comment_item_id'), 'comment', ['item_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_comment_item_id'), table_name='comment')
