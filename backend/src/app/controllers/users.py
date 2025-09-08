from app.schemas.user import User, UserCreate, UserUpdate
from app.services.users import UsersService


svc = UsersService()


def list_users() -> list[User]:
    return svc.list()


def get_user(user_id: int) -> User | None:
    return svc.get(user_id)


def create_user(data: UserCreate) -> User:
    return svc.create(data)


def update_user(user_id: int, data: UserUpdate) -> User | None:
    return svc.update(user_id, data)


def delete_user(user_id: int) -> bool:
    return svc.delete(user_id)

