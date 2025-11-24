"""add document fields to patients

Revision ID: 4b5f5b6c0c1c
Revises: d902393a116e
Create Date: 2025-02-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4b5f5b6c0c1c'
down_revision: Union[str, Sequence[str], None] = 'd902393a116e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'patients',
        sa.Column('document_type', sa.String(length=20), nullable=False, server_default='dni'),
    )
    op.add_column(
        'patients',
        sa.Column('document_number', sa.String(length=50), nullable=True),
    )
    op.add_column(
        'patients',
        sa.Column('address', sa.String(length=255), nullable=True),
    )
    op.add_column(
        'patients',
        sa.Column('phone', sa.String(length=50), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('patients', 'phone')
    op.drop_column('patients', 'address')
    op.drop_column('patients', 'document_number')
    op.drop_column('patients', 'document_type')

