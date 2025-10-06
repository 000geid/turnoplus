# TurnoPlus Backend

## Requisitos

1. Python 3.13 gestionado con [uv](https://github.com/astral-sh/uv).
2. Base de datos MySQL accesible.

Instala dependencias:

```bash
cd backend
uv pip install -r pyproject.toml
```

## Configuración de la base de datos

La capa de infraestructura se centraliza en `app.db.DBbroker`. La configuración se resuelve a partir de variables de entorno:

- `DATABASE_URL`: URL de conexión SQLAlchemy (por defecto `mysql+pymysql://turnoplus:turnoplus@localhost:3306/turnoplus`).
- `DATABASE_ECHO`: Define si SQLAlchemy escribe SQL (`1` para habilitar).
- `DATABASE_POOL_PRE_PING`: Controla `pool_pre_ping` (`0` para deshabilitar).
- `ALEMBIC_INI_PATH`: Permite sobreescribir la ruta de `alembic.ini`.

El broker expone:

- `DBBroker.session()` como context manager para transacciones explícitas.
- `app.db.get_session` para usar como dependencia FastAPI.
- Utilidades de migración (`upgrade`, `downgrade`, `revision`, `history`, `current`).

## Migraciones

Se utiliza Alembic. Los archivos viven en `backend/alembic/`.

```bash
cd backend
uv run alembic revision -m "describe change"
uv run alembic upgrade head
```

El archivo `alembic/env.py` carga las configuraciones desde `DATABASE_URL` y descubre modelos a través de `app.db.Base`.

## Próximos pasos sugeridos

1. Crear modelos ORM dentro de `app/models/` que hereden de `app.db.Base`.
2. Generar la migración inicial con Alembic (`alembic revision --autogenerate`).
3. Reemplazar servicios en memoria por repositorios que utilicen `DBBroker`.
