from app.schemas.user import Admin, AdminCreate, AdminUpdate


class AdminsService:
    """Mock implementation: returns sample data, no persistence."""

    def list(self) -> list[Admin]:
        return [
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

    def get(self, admin_id: int) -> Admin | None:
        if admin_id == 1:
            return self.list()[0]
        return None

    def create(self, data: AdminCreate) -> Admin:
        return Admin(id=2, **data.model_dump())

    def update(self, admin_id: int, data: AdminUpdate) -> Admin | None:
        existing = self.get(admin_id)
        if not existing:
            return None
        return existing.model_copy(update=data.model_dump(exclude_unset=True))

    def delete(self, admin_id: int) -> bool:
        return admin_id == 1

