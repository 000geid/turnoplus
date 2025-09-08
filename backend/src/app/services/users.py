from app.schemas.user import User, UserCreate, UserUpdate


class UsersService:
    """Mock implementation: returns sample data, no persistence."""

    def list(self) -> list[User]:
        return [
            User(
                id=1,
                email="user1@example.com",
                password="***",
                is_active=True,
                is_superuser=False,
                full_name="User One",
            )
        ]

    def get(self, user_id: int) -> User | None:
        if user_id == 1:
            return self.list()[0]
        return None

    def create(self, data: UserCreate) -> User:
        return User(id=2, **data.model_dump())

    def update(self, user_id: int, data: UserUpdate) -> User | None:
        existing = self.get(user_id)
        if not existing:
            return None
        return existing.model_copy(update=data.model_dump(exclude_unset=True))

    def delete(self, user_id: int) -> bool:
        return user_id == 1

