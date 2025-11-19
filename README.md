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

La capa de infraestructura se centraliza en `app.db.DBbroker`. La aplicación lee la configuración desde variables de entorno que normalmente definimos en `backend/.env` (cargado automáticamente por `python-dotenv`):

- `DATABASE_URL`: URL de conexión SQLAlchemy hacia la base externa proporcionada por el equipo (sincroniza migrations y runtime).
- `DATABASE_ECHO`: Define si SQLAlchemy escribe SQL (`1` para habilitar).
- `DATABASE_POOL_PRE_PING`: Controla `pool_pre_ping` (`0` para deshabilitar).
- `ALEMBIC_INI_PATH`: Permite sobreescribir la ruta de `alembic.ini`.

Ejemplo mínimo (`backend/.env`):

```env
DATABASE_URL=mysql+pymysql://usuario:password@host:3306/turnoplus
```

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

#Guía rápida para levantar el proyecto en local (Windows)

Esta guía explica *paso a paso* cómo levantar el backend (FastAPI + MySQL) y el frontend (Angular) en tu máquina, usando el repositorio turnoplus-dev.

> ⚠️ Supone que estás trabajando en la carpeta raíz del proyecto:
> 
> bash
> turnoplus-dev/
>   backend/
>   frontend/
> 

---

## 0. Requisitos previos

### Comunes

- *Git*
- *Node.js 18+* (recomendado LTS)  
  Verificar instalación:

  ```bash
  node --version
  npm --version
Backend
Python 3.13

uv instalado
(en PowerShell con permisos de admin):

powershell
Copiar código
irm https://astral.sh/uv/install.ps1 | iex
MySQL / MariaDB corriendo en tu máquina (puede ser XAMPP, instalación normal, etc.)
Por defecto vamos a asumir:

host: localhost

puerto: 3306

usuario: root

contraseña: vacía (o la que definas)

base de datos: turnoplus

1. Backend – configuración inicial (solo la primera vez)
1.1 Crear el entorno virtual e instalar dependencias
Desde la raíz del repo:

bash
Copiar código
cd backend
uv venv
uv pip install -r pyproject.toml
uv venv crea el entorno virtual en backend/.venv.

uv pip install instala todas las dependencias del backend dentro de ese entorno.

1.2 Crear y configurar el archivo .env
Primero copiá el ejemplo:

bash
Copiar código
cd backend
copy .env.example .env
Luego editá backend/.env y configurá la conexión a MySQL.

Ejemplo con MySQL local, usuario root sin contraseña y base turnoplus:

env
Copiar código
DATABASE_URL=mysql+pymysql://root:@localhost:3306/turnoplus
DATABASE_ECHO=0
DATABASE_POOL_PRE_PING=1

Si tu usuario root tiene contraseña, usá:

env
Copiar código
DATABASE_URL=mysql+pymysql://root:TU_PASSWORD@localhost:3306/turnoplus
Reemplazá TU_PASSWORD por tu contraseña real.

1.3 Crear la base de datos en MySQL
En MySQL Workbench (o cliente que uses), conectate a tu servidor local y ejecutá:

sql
Copiar código
CREATE DATABASE IF NOT EXISTS turnoplus
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
1.4 Aplicar migraciones (crear tablas con Alembic)
Desde backend:

bash
Copiar código
cd backend
uv run alembic upgrade head
Si la conexión a la base está bien configurada, esto creará todo el esquema necesario en turnoplus.

2. Backend – cómo levantarlo para desarrollo
Cada vez que quieras correr el backend:

bash
Copiar código
cd backend
uv run uvicorn app.main:app --reload --app-dir src
La API quedará disponible en: http://127.0.0.1:8000

Endpoints útiles:

Docs (Swagger): http://localhost:8000/docs

Healthcheck (si está implementado): http://localhost:8000/healthz

⚠️ No cierres esta terminal mientras estés usando la app, o el backend se detiene.

3. Frontend – configuración inicial (solo la primera vez)
Desde la raíz del repo:

bash
Copiar código
cd frontend
npm install --legacy-peer-deps
Se usa --legacy-peer-deps para resolver conflictos de versiones entre dependencias de Angular (@angular/core vs @angular/animations).

4. Frontend – cómo levantarlo para desarrollo
Cada vez que quieras correr el frontend:

bash
Copiar código
cd frontend
npm start
Al terminar la compilación verás algo como:

text
Copiar código
Local:   http://localhost:4200/
Watch mode enabled. Watching for file changes...
Abrí en el navegador:

text
Copiar código
http://localhost:4200
Igual que con el backend: no cierres esta terminal mientras quieras tener el frontend funcionando.

5. Flujo típico de desarrollo
Levantar backend

bash
Copiar código
cd backend
uv run uvicorn app.main:app --reload --app-dir src
Levantar frontend (en otra terminal)

bash
Copiar código
cd frontend
npm start
Probar:

API: http://localhost:8000/docs

App web: http://localhost:4200

6. Problemas frecuentes
❌ Can't connect to MySQL server on 'localhost' ([WinError 10061])
El servidor MySQL no está corriendo.

Solución:

Encender MySQL (XAMPP, servicio de Windows, etc.).

Verificar que el host y puerto de DATABASE_URL sean correctos (localhost:3306 por defecto).

❌ Unknown database 'turnoplus'
Falta crear la base.

Solución: ejecutar en MySQL:

sql
Copiar código
CREATE DATABASE turnoplus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
❌ Errores de npm install con ERESOLVE (Angular)
Conflictos de dependencias de Angular.

Solución recomendada para este proyecto:

bash
Copiar código
cd frontend
npm install --legacy-peer-deps
 
---
 
# Despliegue en Render (Backend + Frontend)
 
## Botón de deploy
 
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/<TU_USUARIO>/<TU_REPO>)
 
Con `render.yaml` en la raíz, Render detecta los dos servicios:
- `turnoplus-backend` (Web Service, Python)
- `turnoplus-frontend` (Static Site)
 
## Backend en Render
- Runtime: Python
- Directorio raíz: `backend`
- Build command: `uv pip install -r pyproject.toml`
- Start command: `uv run python scripts/write_aiven_ca.py && uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir src`
- Health check: `/healthz`
- Variables de entorno:
  - `DATABASE_URL` (Producción Aiven):
    - `mysql+pymysql://avnadmin:${AIVEN_DB_PASSWORD}@turnosplus-pmccole14-ecdc.g.aivencloud.com:21861/defaultdb?ssl_ca=/opt/render/project/src/backend/certs/aiven-ca.pem&ssl_check_hostname=true`
  - `AIVEN_DB_PASSWORD` (secret)
  - `AIVEN_SSL_CA_PATH=/opt/render/project/src/backend/certs/aiven-ca.pem`
  - Opcional: `CORS_ORIGINS`
 
## Frontend en Render
- Tipo: Static Site
- Directorio raíz: `frontend`
- Build command: `npm install --legacy-peer-deps && npm run build`
- Public dir: `dist/turnoplus/browser`
- Variable de entorno:
  - `API_BASE_URL=https://<BACKEND>.onrender.com/api/v1`
- El build genera `public/env.js` automáticamente desde `render.yaml` con el valor de `API_BASE_URL`. En runtime, `api.config.ts` toma `window.__env__.API_BASE_URL` o usa `http://localhost:8000/api/v1` como fallback.
 
## Migraciones en Aiven
- Asegúrate de que `DATABASE_URL` en el servicio backend apunte a Aiven.
- Ejecuta desde una shell del servicio backend o desde tu máquina local:
 
```bash
cd backend
uv run alembic upgrade head
```
 
### Ejecución rápida vía script
 
```bash
cd backend
uv run python scripts/migrate.py
```
 
---
 
## Resumen de comandos
 
### Local
- Backend:
  - `cd backend && uv pip install -r pyproject.toml`
  - `copy .env.example .env` y ajustar `DATABASE_URL` local
  - `uv run alembic upgrade head`
  - `uv run uvicorn app.main:app --reload --app-dir src`
- Frontend:
  - `cd frontend && npm install --legacy-peer-deps && npm start`
 
### Render
- Backend Web Service:
  - Build: `uv pip install -r pyproject.toml`
  - Start: `uv run python scripts/write_aiven_ca.py && uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir src`
  - Env: `DATABASE_URL` como arriba (Aiven)
- Frontend Static Site:
  - Build: `npm install --legacy-peer-deps && npm run build`
  - Publish: `frontend/dist/turnoplus/browser`
  - Env: `API_BASE_URL=https://<BACKEND>.onrender.com/api/v1`
- Migraciones Aiven:
  - `cd backend && uv run alembic upgrade head`
