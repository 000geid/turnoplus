## Arquitectura confirmada
- Backend FastAPI en `backend/src/app` y arranque por `uvicorn`.
  - Entrypoint `backend/src/app/main.py` define la app y CORS (backend/src/app/main.py:7–13, 23–31).
  - Comando local recomendado: `uv run uvicorn app.main:app --reload --app-dir src` (README.md:160–163).
  - `backend/main.py` contempla ejecución directa con uvicorn (backend/main.py:4, 7–8, 20).
- Infra DB centralizada:
  - Settings leen `DATABASE_URL` desde `.env` (backend/src/app/db/settings.py:17–26) y validan formato (backend/src/app/db/settings.py:33–38).
  - SQLAlchemy engine se crea con esa URL (backend/src/app/db/broker.py:24–29).
- Alembic usa la misma URL de settings (backend/alembic/env.py:21–24) y metadata de `Base` (backend/alembic/env.py:25).
- Frontend Angular (builder `@angular/build:application`) con scripts en `frontend/package.json` (`start`, `build`) y `angular.json` (serve/build) (frontend/package.json:4–11, frontend/angular.json:23–41, 66–76).
- No existe `render.yaml` aún.

## Conexión MySQL Aiven (producción)
- Construcción de `DATABASE_URL` para SQLAlchemy + PyMySQL con SSL:
  - Formato: `mysql+pymysql://USUARIO:CONTRASEÑA@HOST:PUERTO/BASE?ssl_ca=RUTA_CA&ssl_check_hostname=true`.
  - Ejemplos documentados para PyMySQL aceptan `ssl_ca` en la URL y SQLAlchemy mapea a `ssl` internamente (GitHub issue 5397; StackOverflow) [sqlalchemy/sqlalchemy#5397](https://github.com/sqlalchemy/sqlalchemy/issues/5397), [StackOverflow](https://stackoverflow.com/a/52645510), [Docs errata](https://github.com/sqlalchemy/sqlalchemy/issues/9031).
- Producción (Aiven):
  - `HOST`: `turnosplus-pmccole14-ecdc.g.aivencloud.com`, `PUERTO`: `21861`, `USUARIO`: `avnadmin`, `BASE`: `defaultdb`.
  - URL sugerida (con placeholders):
    - `mysql+pymysql://avnadmin:${AIVEN_DB_PASSWORD}@turnosplus-pmccole14-ecdc.g.aivencloud.com:21861/defaultdb?ssl_ca=${AIVEN_SSL_CA_PATH}&ssl_check_hostname=true`.
  - En Render el path del CA debe existir en disco; proponemos incluir `backend/certs/aiven-ca.pem` en el repo y usar:
    - `AIVEN_SSL_CA_PATH=/opt/render/project/src/backend/certs/aiven-ca.pem`.
- Mantener desarrollo local:
  - Ejemplo local: `mysql+pymysql://root:@localhost:3306/turnoplus` (README.md:127–136).
- Actualizaciones de configuración:
  - Ampliar `backend/.env.example` con ejemplo Aiven (placeholders) y local.
  - No se requieren cambios en `create_engine`: SQLAlchemy toma `ssl_ca` desde la URL.

## Migraciones en Aiven
- Alembic ya toma `DATABASE_URL` de settings (backend/alembic/env.py:21–24), por lo que apuntará a Aiven si esa variable está definida en el entorno.
- Comandos:
  - Local: `uv run alembic upgrade head` crea tablas en la BD local (README.md:41–44, 146–153).
  - Producción (Aiven): setear `DATABASE_URL` con la URL de Aiven y ejecutar `uv run alembic upgrade head` desde `backend`.
- Añadir sección en README con pasos precisos para correr migraciones contra Aiven y local.

## Preparar Backend para Render
- Añadir `render.yaml` en la raíz para monorepo (backend + frontend):
  - Servicio Web backend:
    - `type: web` `runtime: python` `rootDir: backend`.
    - `buildCommand`: `uv pip install -r pyproject.toml`.
    - `startCommand`: `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir src`.
    - `envVars`: definir `DATABASE_URL` (valor completo con `ssl_ca`) y `CORS_ORIGINS` si aplica (leer de `app.main`).
    - Health check: `path: /healthz`.
  - Nota: Render gestionará el entorno, no es necesario activar `.venv` manualmente.
- README debe listar: env vars requeridas, build/start commands y puertos (`$PORT` en Render, `8000` en local).

## Preparar Frontend para Render
- Opción recomendada: Static Site.
  - `buildCommand`: `npm install --legacy-peer-deps && npm run build`.
  - `publishPath`: `frontend/dist/turnoplus/browser` (builder `@angular/build:application`).
- API base URL en producción:
  - El proyecto usa `src/app/core/config/api.config.ts` con `API_BASE_URL` fijo a `http://localhost:8000/api/v1` (frontend/src/app/core/config/api.config.ts:1).
  - Para no cambiar diseño, proponemos soporte mínimo de configuración en tiempo de despliegue:
    - Añadir `frontend/public/env.js` servido como asset y leer `window.__env__.API_BASE_URL` desde `api.config.ts` con fallback a localhost.
    - En Render Static Site, definir `API_BASE_URL` en env y generar `env.js` en build (`echo` del contenido) o commitear una plantilla.
  - Alternativa si se prefiere Web Service: servir estáticos con Node y exponer `env.js` dinámico; más complejo, se sugiere Static Site con `env.js`.
- README: documentar qué servicio crear y cómo setear `API_BASE_URL` del frontend apuntando al backend (`https://<backend>.onrender.com/api/v1`).

## Botón “Deploy to Render”
- Añadir en README un botón: `[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/<TU_USUARIO>/<TU_REPO>)`.
- Al incluir `render.yaml`, Render autoconfigura ambos servicios durante el flujo de deploy; pedirá los secretos (como `DATABASE_URL`).

## Cambios propuestos archivo por archivo
- `backend/.env.example`:
  - Antes: valores genéricos (backend/.env.example:1–3).
  - Después: agregar ejemplo local y producción Aiven con placeholders y nota del CA.
- `README.md`:
  - Añadir secciones de Render (backend y frontend), variables de entorno, pasos de migración Aiven y el botón de deploy.
- `render.yaml` (nuevo):
  - Definir un servicio web para backend y un static site para frontend con comandos descritos.
- `frontend/src/app/core/config/api.config.ts`:
  - Antes: constante fija a localhost.
  - Después: leer `window.__env__?.API_BASE_URL ?? 'http://localhost:8000/api/v1'`.
- `frontend/public/env.js` (nuevo):
  - Plantilla para inyectar `API_BASE_URL` en build/despliegue.

## Comandos y pasos (resumen)
- Local backend:
  - `cd backend && uv pip install -r pyproject.toml`
  - `copy .env.example .env` y ajustar `DATABASE_URL` local.
  - `uv run alembic upgrade head`
  - `uv run uvicorn app.main:app --reload --app-dir src` → `http://localhost:8000`
- Local frontend:
  - `cd frontend && npm install --legacy-peer-deps && npm start` → `http://localhost:4200`
- Producción (Render):
  - Backend Web Service:
    - Build: `uv pip install -r pyproject.toml`
    - Start: `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir src`
    - Env: `DATABASE_URL` = `mysql+pymysql://avnadmin:${AIVEN_DB_PASSWORD}@turnosplus-pmccole14-ecdc.g.aivencloud.com:21861/defaultdb?ssl_ca=/opt/render/project/src/backend/certs/aiven-ca.pem&ssl_check_hostname=true`.
  - Frontend Static Site:
    - Build: `npm install --legacy-peer-deps && npm run build`
    - Publish: `frontend/dist/turnoplus/browser`
    - Env: `API_BASE_URL` apuntando al backend: `https://<backend>.onrender.com/api/v1`.
  - Migraciones Aiven:
    - En el servicio backend (shell) o desde local con `DATABASE_URL` de Aiven: `cd backend && uv run alembic upgrade head`.

## Notas de seguridad y compatibilidad
- No se hardcodea la contraseña; se usa `${AIVEN_DB_PASSWORD}` como secreto en Render.
- El CA (`aiven-ca.pem`) puede incluirse en el repo por simplicidad; no es secreto. Alternativa: generar `aiven-ca.pem` desde env en `build/start`.
- No se alteran flujos locales existentes (uv, alembic, npm). Solo se agregan configuraciones para Render y Aiven.
