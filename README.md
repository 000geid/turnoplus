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

- El backend incluye CORS configurado para `http://localhost:4200`
- Las migraciones se gestionan automáticamente con Alembic
- El frontend usa Angular Material para componentes UI
- Se recomienda usar VS Code con extensiones para Python y Angular
