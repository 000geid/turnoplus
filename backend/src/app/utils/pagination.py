from __future__ import annotations

from typing import Tuple, Any, List
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from sqlalchemy.sql import Selectable


def paginate_query(
    session: Session, 
    query: Selectable, 
    page: int, 
    size: int
) -> Tuple[List[Any], int]:
    """
    Apply pagination to a SQLAlchemy query and return items and total count.
    
    Args:
        session: SQLAlchemy session
        query: Base query to paginate
        page: Page number (1-based)
        size: Items per page
        
    Returns:
        Tuple of (items_list, total_count)
    """
    # Get total count using a subquery
    if query.cte is not None:
        # If query has CTEs, we need to get the count differently
        count_query = select(func.count()).select_from(query.subquery())
    else:
        count_query = select(func.count()).select_from(query.subquery())
    
    total = session.scalar(count_query) or 0
    
    # Apply pagination
    offset = (page - 1) * size
    paginated_query = query.offset(offset).limit(size)
    items = list(session.scalars(paginated_query).all())
    
    return items, total


def apply_pagination_to_query(
    query: Selectable, 
    page: int, 
    size: int
) -> Selectable:
    """
    Apply pagination parameters to a query without executing it.
    Returns the paginated query.
    """
    offset = (page - 1) * size
    return query.offset(offset).limit(size)


def get_total_count(
    session: Session, 
    query: Selectable
) -> int:
    """
    Get total count for a query.
    """
    if query.cte is not None:
        count_query = select(func.count()).select_from(query.subquery())
    else:
        count_query = select(func.count()).select_from(query.subquery())
    
    return session.scalar(count_query) or 0