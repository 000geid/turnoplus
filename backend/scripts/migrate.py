from __future__ import annotations

from app.db.broker import DBBroker


def main() -> None:
    DBBroker().upgrade("head")


if __name__ == "__main__":
    main()