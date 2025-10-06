from __future__ import annotations

from typing import Dict, List, Optional

from app.schemas.user import User, UserCreate, UserUpdate


class UsersService:
    """In-memory user service with very small mock dataset."""

    def __init__(self) -> None:
        self._users: List[User] = [
            User(
                id=1,
                email="user1@example.com",
                password="***",
                is_active=True,
                is_superuser=False,
                full_name="User One",
            )
        ]
        self._credentials: Dict[int, str] = {1: "user1pass"}

    def _copy(self, user: User) -> User:
        return user.model_copy()

    def _find_by_id(self, user_id: int) -> Optional[User]:
        return next((user for user in self._users if user.id == user_id), None)

    def _find_by_email(self, email: str) -> Optional[User]:
        return next((user for user in self._users if user.email == email), None)

    def list(self) -> list[User]:
        return [self._copy(user) for user in self._users]

    def get(self, user_id: int) -> User | None:
        user = self._find_by_id(user_id)
        return self._copy(user) if user else None

    def create(self, data: UserCreate) -> User:
        payload = data.model_dump()
        password = payload.pop("password")
        new_id = max((user.id for user in self._users), default=0) + 1
        user = User(id=new_id, password="***", **payload)
        self._users.append(user)
        self._credentials[new_id] = password
        return self._copy(user)

    def update(self, user_id: int, data: UserUpdate) -> User | None:
        user = self._find_by_id(user_id)
        if not user:
            return None

        update_payload = data.model_dump(exclude_unset=True)

        if "password" in update_payload:
            new_password = update_payload.pop("password")
            self._credentials[user_id] = new_password

        updated_user = user.model_copy(update=update_payload)
        for idx, existing in enumerate(self._users):
            if existing.id == user_id:
                self._users[idx] = updated_user
                break
        return self._copy(updated_user)

    def delete(self, user_id: int) -> bool:
        for idx, user in enumerate(self._users):
            if user.id == user_id:
                del self._users[idx]
                self._credentials.pop(user_id, None)
                return True
        return False

    def authenticate(self, email: str, password: str) -> tuple[User, str] | None:
        user = self._find_by_email(email)
        if not user:
            return None

        stored_password = self._credentials.get(user.id)
        if stored_password != password or not user.is_active:
            return None

        return self._copy(user), f"user-token-{user.id}"
