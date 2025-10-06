from __future__ import annotations

from typing import Dict, List, Optional

from app.schemas.user import Admin, AdminCreate, AdminUpdate


class AdminsService:
    """In-memory admin service with mock dataset."""

    def __init__(self) -> None:
        self._admins: List[Admin] = [
            Admin(
                id=1,
                email="admin1@example.com",
                password="***",
                is_active=True,
                is_superuser=True,
                full_name="Admin One",
                role="superadmin",
                permissions={"all"},
            )
        ]
        self._credentials: Dict[int, str] = {1: "admin1pass"}

    def _copy(self, admin: Admin) -> Admin:
        return admin.model_copy()

    def _find_by_id(self, admin_id: int) -> Optional[Admin]:
        return next((admin for admin in self._admins if admin.id == admin_id), None)

    def _find_by_email(self, email: str) -> Optional[Admin]:
        return next((admin for admin in self._admins if admin.email == email), None)

    def list(self) -> list[Admin]:
        return [self._copy(admin) for admin in self._admins]

    def get(self, admin_id: int) -> Admin | None:
        admin = self._find_by_id(admin_id)
        return self._copy(admin) if admin else None

    def create(self, data: AdminCreate) -> Admin:
        payload = data.model_dump()
        password = payload.pop("password")
        new_id = max((admin.id for admin in self._admins), default=0) + 1
        admin = Admin(id=new_id, password="***", **payload)
        self._admins.append(admin)
        self._credentials[new_id] = password
        return self._copy(admin)

    def update(self, admin_id: int, data: AdminUpdate) -> Admin | None:
        admin = self._find_by_id(admin_id)
        if not admin:
            return None

        update_payload = data.model_dump(exclude_unset=True)

        if "password" in update_payload:
            new_password = update_payload.pop("password")
            self._credentials[admin_id] = new_password

        updated_admin = admin.model_copy(update=update_payload)
        for idx, existing in enumerate(self._admins):
            if existing.id == admin_id:
                self._admins[idx] = updated_admin
                break
        return self._copy(updated_admin)

    def delete(self, admin_id: int) -> bool:
        for idx, admin in enumerate(self._admins):
            if admin.id == admin_id:
                del self._admins[idx]
                self._credentials.pop(admin_id, None)
                return True
        return False

    def authenticate(self, email: str, password: str) -> tuple[Admin, str] | None:
        admin = self._find_by_email(email)
        if not admin:
            return None

        stored_password = self._credentials.get(admin.id)
        if stored_password != password or not admin.is_active:
            return None

        return self._copy(admin), f"admin-token-{admin.id}"
