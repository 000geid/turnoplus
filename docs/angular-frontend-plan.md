# TurnoPlus Angular Frontend Implementation Plan

## Overview
- Goal: build an Angular SPA in `frontend/` that reproduces and expands the offline mockup UI (`turnos_plus_ui_html_login_registro_perfil_calendario_y_horarios.html`) while integrating with the FastAPI backend.
- Primary user roles: patient, doctor, admin (plus generic user for shared auth flows).

## Backend Reference (FastAPI `/api/v1`)
- **Auth & Users**
  - `POST /users/login`, `POST /doctors/login`, `POST /admins/login` → `LoginRequest` → `*LoginResponse`.
  - CRUD endpoints for `/users`, `/patients`, `/doctors`, `/admins`.
- **Appointments & Availability**
  - `GET /appointments/patients/{patient_id}`
  - `GET /appointments/doctors/{doctor_id}`
  - `POST /appointments` (book), `POST /appointments/{id}/cancel|confirm|complete`.
  - `GET /appointments/doctor/{doctor_id}/availability`
  - `POST /appointments/availability`, `PATCH /appointments/availability/{availability_id}`
- **Medical Records**
  - `GET /medical-records/patients/{patient_id}`
  - `GET /medical-records/doctors/{doctor_id}`
  - `GET /medical-records/{record_id}`, `POST /medical-records`, `PATCH /medical-records/{record_id}`
- **Health Check**: `GET /healthz`
- Missing backend support vs mockup: office management endpoints, doctor calendar toggles, patient lookup by DNI (would need backend extension or temporary stubs).

## Angular Workspace Setup (`frontend/`)
1. `ng new turnoplus --routing --style=scss --strict` (Angular CLI).
2. Install ESLint, Prettier, and optional Tailwind (or SCSS utility partial mirroring mockup classes).
3. Configure environment files with `apiBaseUrl: '/api/v1'` and tokens for health check.
4. Add absolute import paths via `tsconfig` (`@core`, `@shared`, etc.).

## Project Structure
```
frontend/
 └── src/
     ├── app/
     │   ├── core/          # layout, guards, interceptors, auth storage
     │   ├── shared/        # UI atoms, directives, pipes
     │   ├── auth/          # login/register flows
     │   ├── patient/
     │   ├── doctor/
     │   ├── admin/
     │   ├── appointments/  # reusable calendars & booking widgets
     │   └── medical-records/
     └── styles/ (palette & utility SCSS)
```

## Domain Models (TypeScript Interfaces)
- `User`, `UserCreate`, `UserUpdate`
- `Patient`, `PatientCreate`, `PatientUpdate`
- `Doctor`, `DoctorCreate`, `DoctorUpdate`
- `Admin`, `AdminCreate`, `AdminUpdate`
- `LoginRequest`, `UserLoginResponse`, `DoctorLoginResponse`, `AdminLoginResponse`
- `Appointment`, `AppointmentCreate`, `Availability`, `AvailabilityCreate`, `AvailabilityUpdate`
- `MedicalRecord`, `MedicalRecordCreate`, `MedicalRecordUpdate`
- Enum `AppointmentStatus` mirroring backend model.

## Services & API Clients
- `AuthService`: handles multi-role login, token persistence, current user observable, logout.
- `HttpAuthInterceptor`: injects `Authorization: Bearer` header when token present.
- Resource services for `/users`, `/patients`, `/doctors`, `/admins`, `/appointments`, `/medical-records`.
- Shared `HttpErrorHandlerService` to map FastAPI errors to toast messages.

## Feature Modules
- **AuthModule**
  - Routes `/login`, `/register`.
  - Components: role-aware login form, patient registration form.
  - Redirect post-login based on role.
- **PatientModule**
  - `ProfileComponent`: edit personal info (`GET/PUT /patients/{id}`) and display appointment table.
  - `PatientAppointmentsComponent`: list, cancel (`POST /appointments/{id}/cancel`) and confirm bookings.
  - `CalendarComponent`: doctor filter (`GET /doctors`), availability grid (`GET /appointments/doctor/{id}/availability`), booking modal (`POST /appointments` + confirm).
  - `MedicalRecordsComponent`: fetch patient history (`GET /medical-records/patients/{id}`).
- **DoctorModule**
  - `DoctorDashboardComponent`: combines availability management and patient records.
  - Availability calendar toggles via `/appointments/doctor/{id}/availability` plus `POST/PATCH` operations.
  - Record editor to load/save patient records (requires patient search strategy; see gaps).
- **AdminModule**
  - Overview calendar (reuse appointments service).
  - User management table (CRUD via `/users`, `_admin` endpoints).
  - Doctor management (list/create/delete doctors).
  - Office management UI from mockup pending backend support; optionally stub with local state until endpoints exist.

## Routing & Guards
- Lazy routes per feature module: `/auth`, `/patient`, `/doctor`, `/admin`.
- `AuthGuard` ensures authenticated access; `RoleGuard` enforces role-specific modules.
- Root route decides redirect based on stored role; fallback 404 page.

## Styling & UX
- Port color palette, spacing, and component styles from HTML mockup into SCSS partials (`_palette.scss`, `_utilities.scss`).
- Recreate reusable UI elements: `CardComponent`, `ButtonComponent`, `InputComponent`, `ToastComponent`.
- Provide toast/notification service; loading spinner overlay for HTTP calls.
- Handle date formatting (Angular `DatePipe` + custom adapter to maintain backend UTC).

## Testing & Tooling
- Unit tests for services using `HttpClientTestingModule`.
- Component tests for major forms (login, booking flow).
- E2E smoke tests (Cypress or Playwright) covering login → booking → cancellation.
- CI scripts: `npm run lint`, `npm run test`, `npm run build`.

## Next Steps
1. Scaffold Angular workspace with CLI and baseline tooling.
2. Port shared styles and develop core layout using mockup.
3. Implement Auth module end-to-end against backend.
4. Build patient workflows (profile, calendar, booking) leveraging existing APIs.
5. Extend backend or adjust UI for offices/patient lookup gaps before completing doctor/admin panels.
