# Backend Testing

This project now uses **pytest** with the real MySQL database (no in-memory SQLite). The suite is organized under `backend/tests` with markers for different scopes.

## Setup
- Create a dedicated test database (e.g. `turnoplus_test`) in MySQL.
- Set `TEST_DATABASE_URL` (preferred) or `DATABASE_URL` to point to that DB, e.g.  
  `mysql+pymysql://turnoplus:turnoplus@localhost:3306/turnoplus_test`
- Install dev deps: `uv pip install -r pyproject.toml --extra test`

## Running tests
- All tests: `uv run pytest`
- Integration-only: `uv run pytest -m integration`
- With coverage: `uv run pytest --cov=src --cov-report=term-missing`

## Notes
- Tables are created automatically and truncated before/after each test.
- FastAPI `TestClient` is wired to the same MySQL URL via `TEST_DATABASE_URL`.
- Tests seed their own data; no shared fixtures or sample accounts are required.
- Legacy/manual scripts now live in `tests/manual/` for ad-hoc debugging and are not discovered by pytest.
