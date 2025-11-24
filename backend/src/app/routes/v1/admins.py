from fastapi import APIRouter, HTTPException, Query

from app.controllers.admins import (
    create_admin,
    delete_admin,
    get_admin,
    get_admin_dashboard_summary,
    list_admins,
    list_admins_paginated,
    login_admin,
    update_admin,
)
from app.schemas.admin_dashboard import AdminDashboardSummary
from app.schemas.auth import AdminLoginResponse, LoginRequest
from app.schemas.pagination import PaginatedResponse
from app.schemas.user import Admin, AdminCreate, AdminUpdate


router = APIRouter()


@router.get("/", response_model=list[Admin])
def route_list_admins():
    return list_admins()


@router.get("/paginated", response_model=PaginatedResponse[Admin])
def route_list_admins_paginated(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Items per page")
):
    return list_admins_paginated(page=page, size=size)


@router.get("/dashboard/summary", response_model=AdminDashboardSummary)
def route_get_admin_dashboard_summary():
    return get_admin_dashboard_summary()


@router.get("/{admin_id}", response_model=Admin)
def route_get_admin(admin_id: int):
    data = get_admin(admin_id)
    if not data:
        raise HTTPException(status_code=404, detail="Admin not found")
    return data


@router.post("/login", response_model=AdminLoginResponse)
def route_login_admin(data: LoginRequest):
    response = login_admin(data)
    if not response:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return response


@router.post("/", response_model=Admin, status_code=201)
def route_create_admin(data: AdminCreate):
    return create_admin(data)


@router.put("/{admin_id}", response_model=Admin)
def route_update_admin(admin_id: int, data: AdminUpdate):
    item = update_admin(admin_id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Admin not found")
    return item


@router.delete("/{admin_id}", status_code=204)
def route_delete_admin(admin_id: int):
    ok = delete_admin(admin_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Admin not found")
