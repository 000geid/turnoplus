# TurnoPlus

Sistema de gestión de citas médicas con tres roles de usuario: Pacientes, Doctores y Administradores. El backend está construido con FastAPI y SQLAlchemy, conectado a una base de datos MySQL. El frontend utiliza Angular 20.

## Arquitectura

- **Backend**: FastAPI + SQLAlchemy + MySQL (SkyDB)
- **Frontend**: Angular 20 + Angular Material
- **Base de datos**: MySQL gestionada con Alembic para migraciones

## Requisitos Previos

### Comunes
- Node.js 18+ y npm
- Git

### Backend
- Python 3.13 con [uv](https://github.com/astral-sh/uv)
- Base de datos MySQL (SkyDB)

### Frontend
- Node.js 18+
- npm (incluido con Node.js)

## Instalación y Configuración

### Backend

#### Windows

1. **Instalar Python 3.13 y uv**:
   ```powershell
   # Descargar Python 3.13 desde https://www.python.org/downloads/
   # Instalar uv con PowerShell (administrador):
   irm https://astral.sh/uv/install.ps1 | iex
   ```

2. **Instalar dependencias**:
   ```powershell
   cd backend
   uv pip install -r pyproject.toml
   ```

3. **Configurar variables de entorno**:
   ```powershell
   copy .env.example .env
   # Editar .env con tus credenciales de MySQL
   ```

#### Linux

1. **Instalar Python 3.13 y uv**:
   ```bash
   # Ubuntu/Debian
   sudo add-apt-repository ppa:deadsnakes/ppa
   sudo apt update
   sudo apt install python3.13 python3.13-venv

   # Instalar uv
   curl -LsSf https://astral.sh/uv/install.sh | sh
   source ~/.bashrc
   ```

2. **Instalar dependencias**:
   ```bash
   cd backend
   uv pip install -r pyproject.toml
   ```

3. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales de MySQL
   ```

### Frontend

#### Windows

1. **Instalar Node.js**:
   - Descargar desde https://nodejs.org/
   - Verificar instalación: `node --version && npm --version`

2. **Instalar dependencias**:
   ```powershell
   cd frontend
   npm install
   ```

#### Linux

1. **Instalar Node.js**:
   ```bash
   # Usando NodeSource
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Verificar instalación
   node --version && npm --version
   ```

2. **Instalar dependencias**:
   ```bash
   cd frontend
   npm install
   ```

## Configuración de Base de Datos

La aplicación se conecta a una base de datos MySQL en SkyDB. Configura las siguientes variables de entorno en `backend/.env`:

```env
DATABASE_URL=mysql+pymysql://usuario:password@host:3306/turnoplus
DATABASE_ECHO=0
DATABASE_POOL_PRE_PING=1
```

### Migraciones de Base de Datos

```bash
cd backend

# Crear nueva migración
uv run alembic revision --autogenerate -m "descripción del cambio"

# Aplicar migraciones
uv run alembic upgrade head

# Revertir última migración
uv run alembic downgrade -1

# Ver historial
uv run alembic history

# Ver versión actual
uv run alembic current
```

## Ejecutar la Aplicación

### Backend

```bash
cd backend
uv run uvicorn src.app.main:app --reload
```

El backend estará disponible en `http://localhost:8000`

### Frontend

```bash
cd frontend
npm start
```

El frontend estará disponible en `http://localhost:4200`

## Scripts Útiles

### Backend

- `uv run uvicorn src.app.main:app --reload`: Iniciar servidor en modo desarrollo
- `uv run alembic upgrade head`: Aplicar migraciones
- `uv run alembic revision --autogenerate -m "mensaje"`: Crear migración

### Frontend

- `npm start`: Iniciar servidor de desarrollo
- `npm build`: Compilar para producción
- `npm test`: Ejecutar pruebas unitarias
- `npm run lint`: Verificar calidad de código

## Estructura del Proyecto

```
turnoplus/
├── backend/
│   ├── src/app/
│   │   ├── models/         # Modelos SQLAlchemy
│   │   ├── routes/         # Rutas FastAPI
│   │   ├── services/       # Lógica de negocio
│   │   ├── repositories/   # Acceso a datos
│   │   └── schemas/        # Modelos Pydantic
│   ├── alembic/            # Migraciones de base de datos
│   └── pyproject.toml      # Dependencias Python
└── frontend/
    ├── src/app/
    │   ├── components/     # Componentes Angular
    │   ├── services/       # Servicios Angular
    │   ├── pages/          # Páginas principales
    │   └── shared/         # Componentes compartidos
    ├── angular.json        # Configuración Angular
    └── package.json        # Dependencias Node.js
```

## Roles de Usuario

- **Paciente (USR)**: Registro, login, solicitar/cancelar citas, ver historial médico
- **Doctor (DOC)**: Login, gestionar disponibilidad, ver/modificar registros médicos
- **Admin (ADMIN)**: Login, crear/eliminar doctores, crear/eliminar consultorios

## Endpoints Principales

- `/api/v1/auth` - Autenticación
- `/api/v1/patients` - Gestión de pacientes
- `/api/v1/doctors` - Gestión de doctores
- `/api/v1/admins` - Gestión de administradores
- `/api/v1/appointments` - Gestión de citas
- `/healthz` - Verificación de estado

## Notas Importantes

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
