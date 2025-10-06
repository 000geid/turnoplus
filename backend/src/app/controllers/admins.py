from app.schemas.auth import AdminLoginResponse, LoginRequest
from app.schemas.user import Admin, AdminCreate, AdminUpdate
from app.services.admins import AdminsService


svc = AdminsService()


def list_admins() -> list[Admin]:
    return svc.list()


def get_admin(admin_id: int) -> Admin | None:
    return svc.get(admin_id)


def create_admin(data: AdminCreate) -> Admin:
    return svc.create(data)


def update_admin(admin_id: int, data: AdminUpdate) -> Admin | None:
    return svc.update(admin_id, data)


def delete_admin(admin_id: int) -> bool:
    return svc.delete(admin_id)


def login_admin(data: LoginRequest) -> AdminLoginResponse | None:
    result = svc.authenticate(data.email, data.password)
    if not result:
        return None

    admin, token = result
    return AdminLoginResponse(access_token=token, user=admin)
