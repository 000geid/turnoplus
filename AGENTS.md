# CODEX.md

Guía de referencia rápida para asistentes de código (Codex, GPT, etc.) que colaboren en el proyecto TurnoPlus.

## 📌 Contexto del Proyecto

- **Nombre**: TurnoPlus – Sistema de gestión de turnos médicos con roles Paciente, Doctor y Administrador.  
- **Backend**: FastAPI + SQLAlchemy + MySQL (migraciones con Alembic) bajo Python 3.13 administrado con `uv`.  
- **Frontend**: Angular 20 + Angular Material + RxJS.  
- **Infraestructura**: Arquitectura en capas (routes → controllers → services → repositories → models/schemas) descrita en `CLAUDE.md` y `docs/project-overview.md`.  
- **Documentación relacionada**: carpeta `docs/` contiene casos de uso, planes de UI, diagramas y resúmenes; `README.md` brinda instrucciones de instalación detalladas.

## ⚙️ Instalación Rápida

1. **Backend**
   ```bash
   cd backend
   uv pip install -r pyproject.toml
   cp .env.example .env   # Ajustar DATABASE_URL apuntando a MySQL
   ```
2. **Frontend**
   ```bash
   cd frontend
   npm install
   ```

## 🚀 Ejecución Local

- **Backend**: `cd backend && uv run uvicorn src.app.main:app --reload` (escucha en `http://localhost:8000`).  
- **Frontend**: `cd frontend && npm start` (servidor Angular en `http://localhost:4200`).  
- **Migraciones**: usar los comandos de Alembic documentados en `README.md` y `CLAUDE.md` (`uv run alembic upgrade head`, etc.).

## 🧪 Cuentas de Ejemplo

Referencias principales:
- `docs/sample-accounts.md`: tabla estructurada por rol.  
- `backend/sample_accounts.txt`: variante en texto plano para pruebas rápidas.

Credenciales rápidas:
- **Paciente** – `patient@example.com / patient123`
- **Doctor** – `doctor@example.com / doctor123`
- **Admin** – `admin@example.com / admin123`

Los tres comparten la oficina `MAIN` (ID 1). Úsalos para flujos end-to-end durante desarrollo o QA manual.

## 🗂️ Ruta de Documentación

- `README.md`: guía completa de requisitos, instalación y estructura.  
- `docs/project-overview.md` / `docs/PROJECT_SUMMARY.md`: visión general, objetivos y arquitectura.  
- `docs/casos-de-uso.md`: flujos detallados para cada rol.  
- `docs/mis-turnos-*`: especificaciones del módulo "Mis Turnos".  
- `docs/angular-frontend-plan.md`: plan del frontend.  
- `CLAUDE.md`: guía técnica para el stack backend y convenciones de capas.

Consulta estos archivos antes de implementar nuevas funcionalidades para comprender dependencias y decisiones vigentes.

## 🧱 Convenciones de Código

- **Backend**: PEP 8, type hints, servicios delgados, acceso a datos via `DBBroker`.  
- **Frontend**: Angular strict, módulos por feature, ESLint + Prettier.  
- **Commits/PRs**: Proveer contexto, actualizar docs y pruebas cuando corresponda.

## ✅ Checklist Rápido para Nuevas Tareas

1. Revisar requisitos funcionales en `docs/` y casos de uso.  
2. Confirmar migraciones y modelos antes de modificar servicios/repositorios.  
3. Ejecutar linters/pruebas (`npm run lint`, `npm test`, herramientas de FastAPI si aplican).  
4. Actualizar documentación relevante (este archivo, `README.md`, diagramas) cuando cambien flujos o dependencias.

Este archivo complementa `CLAUDE.md` para brindar a cualquier asistente una vista consolidada del proyecto y facilitar la incorporación rápida.
