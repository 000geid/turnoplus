"""add_obra_social_fields

Revision ID: c8d8decece9a
Revises: 4b5f5b6c0c1c
Create Date: 2025-11-25 10:50:58.448433

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8d8decece9a'
down_revision: Union[str, Sequence[str], None] = '4b5f5b6c0c1c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'patients',
        sa.Column('obra_social_name', sa.String(length=100), nullable=True),
    )
    op.add_column(
        'patients',
        sa.Column('obra_social_number', sa.String(length=50), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('patients', 'obra_social_number')
    op.drop_column('patients', 'obra_social_name')
