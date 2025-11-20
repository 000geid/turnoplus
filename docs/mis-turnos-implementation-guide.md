# "Mis Turnos" Implementation Guide

## Implementation Order & Dependencies

This guide provides step-by-step implementation details for enhancing the "Mis Turnos" section with time-based filtering. The implementation should follow this order to ensure proper dependency management.

## Step 1: Backend API Implementation

### 1.1 Update Appointments Service

File: `backend/src/app/services/appointments.py`

```python
from datetime import datetime
from typing import Optional

def list_for_patient_filtered(
    self, 
    patient_id: int, 
    start_date: Optional[datetime] = None, 
    end_date: Optional[datetime] = None
) -> list[Appointment]:
    """List patient appointments with optional date range filtering."""
    self._ensure_patient_exists(patient_id)
    
    stmt = select(AppointmentModel).where(AppointmentModel.patient_id == patient_id)
    
    if start_date:
        stmt = stmt.where(AppointmentModel.start_at >= start_date)
    if end_date:
        stmt = stmt.where(AppointmentModel.end_at <= end_date)
    
    stmt = stmt.order_by(AppointmentModel.start_at)
    appointments = self._session.scalars(stmt).all()
    return [self._to_schema(model) for model in appointments]
```

### 1.2 Update Appointments Controller

File: `backend/src/app/controllers/appointments.py`

```python
from datetime import datetime
from typing import Optional

def list_patient_appointments_filtered(
    patient_id: int, 
    start_date: Optional[datetime] = None, 
    end_date: Optional[datetime] = None
) -> list[Appointment]:
    """List patient appointments with date range filtering."""
    broker = get_dbbroker()
    with broker.session() as session:
        svc = AppointmentsService(session)
        try:
            return svc.list_for_patient_filtered(patient_id, start_date, end_date)
        except ValidationError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
```

### 1.3 Update Appointments Routes

File: `backend/src/app/routes/v1/appointments.py`

```python
from datetime import datetime
from typing import Optional

@router.get("/patients/{patient_id}/filtered", response_model=list[Appointment])
def route_list_patient_appointments_filtered(
    patient_id: int, 
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None
):
    try:
        start_dt = datetime.fromisoformat(start_date) if start_date else None
        end_dt = datetime.fromisoformat(end_date) if end_date else None
        
        return list_patient_appointments_filtered(patient_id, start_dt, end_dt)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format: YYYY-MM-DDTHH:MM:SS") from exc
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=str(exc)) from exc
```

## Step 2: Frontend Date Utility Service

### 2.1 Create Date Utils Service

File: `frontend/src/app/core/services/date-utils.service.ts`

```typescript
import { Injectable } from '@angular/core';

export type DateRange = {
  start: Date;
  end: Date;
};

export type TimePeriod = 'today' | 'thisWeek' | 'nextWeek' | 'nextMonth';

@Injectable({
  providedIn: 'root'
})
export class DateUtilsService {
  
  /**
   * Get date range for today (00:00 to 23:59)
   */
  getTodayRange(): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return { start, end };
  }

  /**
   * Get date range for current week (Sunday to Saturday)
   */
  getThisWeekRange(): DateRange {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }

  /**
   * Get date range for next week
   */
  getNextWeekRange(): DateRange {
    const thisWeek = this.getThisWeekRange();
    const start = new Date(thisWeek.end);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }

  /**
   * Get date range for next month
   */
  getNextMonthRange(): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    return { start, end };
  }

  /**
   * Get date range for specified time period
   */
  getDateRange(period: TimePeriod): DateRange {
    switch (period) {
      case 'today':
        return this.getTodayRange();
      case 'thisWeek':
        return this.getThisWeekRange();
      case 'nextWeek':
        return this.getNextWeekRange();
      case 'nextMonth':
        return this.getNextMonthRange();
      default:
        return this.getTodayRange();
    }
  }

  /**
   * Check if appointment is in the past
   */
  isPastAppointment(appointmentEndAt: string): boolean {
    return new Date(appointmentEndAt) < new Date();
  }

  /**
   * Check if appointment is in the future
   */
  isFutureAppointment(appointmentStartAt: string): boolean {
    return new Date(appointmentStartAt) > new Date();
  }

  /**
   * Convert Date to ISO string for API
   */
  toISOString(date: Date): string {
    return date.toISOString();
  }
}
```

## Step 3: Frontend Service Updates

### 3.1 Update Appointments Service

File: `frontend/src/app/core/services/appointments.service.ts`

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';

// Add new method to existing service
listForPatientFiltered(
  patientId: number, 
  startDate?: string, 
  endDate?: string
): Observable<AppointmentDto[]> {
  let params = new HttpParams();
  if (startDate) params = params.set('start_date', startDate);
  if (endDate) params = params.set('end_date', endDate);
  
  return this.http.get<AppointmentDto[]>(
    `${API_BASE_URL}/appointments/patients/${patientId}/filtered`,
    { params }
  );
}
```

## Step 4: Enhanced Patient Appointments Component

### 4.1 Update Component TypeScript

File: `frontend/src/app/patient/components/patient-appointments/patient-appointments.component.ts`

```typescript
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { firstValueFrom, debounceTime, distinctUntilChanged } from 'rxjs';

import { AppointmentDto, AppointmentStatus } from '../../../core/models/appointment';
import { DateFormatService } from '../../../core/services/date-format.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { DoctorDto } from '../../../core/models/user';
import { DateUtilsService, TimePeriod } from '../../../core/services/date-utils.service';

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './patient-appointments.component.html',
  styleUrl: './patient-appointments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientAppointmentsComponent {
  private _appointments: ReadonlyArray<AppointmentDto> = [];
  private doctorCache = new Map<number, DoctorDto>();

  @Input()
  set appointments(value: ReadonlyArray<AppointmentDto>) {
    this._appointments = value;
    if (value.length > 0) {
      this.prefetchDoctorData();
    }
  }

  get appointments(): ReadonlyArray<AppointmentDto> {
    return this._appointments;
  }

  @Input() selectedPeriod: TimePeriod = 'today';
  @Input() loading = false;
  @Input() actionId: number | null = null;
  @Output() cancel = new EventEmitter<number>();
  @Output() confirm = new EventEmitter<number>();
  @Output() periodChange = new EventEmitter<TimePeriod>();

  readonly periods = [
    { value: 'today' as TimePeriod, label: 'Hoy' },
    { value: 'thisWeek' as TimePeriod, label: 'Esta semana' },
    { value: 'nextWeek' as TimePeriod, label: 'Próxima semana' },
    { value: 'nextMonth' as TimePeriod, label: 'Próximo mes' }
  ];

  constructor(
    private dateFormatService: DateFormatService,
    private doctorService: DoctorService,
    private dateUtilsService: DateUtilsService
  ) {}

  // Separate appointments into past and future
  get pastAppointments(): ReadonlyArray<AppointmentDto> {
    return this._appointments.filter(apt => 
      this.dateUtilsService.isPastAppointment(apt.endAt)
    );
  }

  get futureAppointments(): ReadonlyArray<AppointmentDto> {
    return this._appointments.filter(apt => 
      this.dateUtilsService.isFutureAppointment(apt.startAt)
    );
  }

  onPeriodChange(period: TimePeriod): void {
    this.periodChange.emit(period);
  }

  // ... existing methods remain the same ...
}
```

### 4.2 Update Component HTML

File: `frontend/src/app/patient/components/patient-appointments/patient-appointments.component.html`

```html
<section class="patient-appointments">
  <header class="patient-appointments__header">
    <div>
      <h3>Mis turnos</h3>
      <p>Seguimiento de tus citas médicas.</p>
    </div>
  </header>

  <!-- Period Selector -->
  <nav class="patient-appointments__periods">
    @for (period of periods; track period.value) {
      <button
        type="button"
        class="patient-appointments__period-btn"
        [class.active]="selectedPeriod === period.value"
        (click)="onPeriodChange(period.value)"
        [disabled]="loading"
      >
        {{ period.label }}
      </button>
    }
  </nav>

  @if (loading && !appointments.length) {
    <div class="patient-appointments__loading">
      <div class="skeleton-card" *ngFor="let i of [1,2,3]"></div>
    </div>
  } @else {
    <!-- Future Appointments Section -->
    @if (futureAppointments.length > 0) {
      <section class="patient-appointments__section">
        <h4 class="patient-appointments__section-title">Próximos turnos</h4>
        <ul class="patient-appointments__list">
          @for (item of futureAppointments; track item.id) {
            <li class="patient-appointments__item patient-appointments__item--future">
              <div class="patient-appointments__summary">
                <h4>Turno con {{ getDoctorName(item.doctor_id) }}</h4>
                <p>
                  {{ formatDateSpanish(item.startAt) }}, {{ formatTimeSpanish(item.startAt) }} -
                  {{ formatTimeSpanish(item.endAt) }}
                </p>
              </div>

              <span class="patient-appointments__status" [ngClass]="item.status">
                {{ statusLabels[item.status] }}
              </span>

              <div class="patient-appointments__actions">
                <button
                  type="button"
                  class="btn"
                  (click)="onConfirm(item.id)"
                  [disabled]="isActionDisabled(item.id, item.status)"
                >
                  {{ actionId === item.id ? 'Actualizando…' : 'Confirmar' }}
                </button>
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="onCancel(item.id)"
                  [disabled]="isActionDisabled(item.id, item.status)"
                >
                  Cancelar
                </button>
              </div>
            </li>
          }
        </ul>
      </section>
    } @else {
      <section class="patient-appointments__section">
        <h4 class="patient-appointments__section-title">Próximos turnos</h4>
        <div class="patient-appointments__empty">
          <p>📅 No tienes turnos próximos para este período</p>
          <p>Usá la agenda para reservar tu próxima cita.</p>
        </div>
      </section>
    }

    <!-- Past Appointments Section -->
    @if (pastAppointments.length > 0) {
      <section class="patient-appointments__section">
        <h4 class="patient-appointments__section-title patient-appointments__section-title--past">Turnos pasados</h4>
        <ul class="patient-appointments__list">
          @for (item of pastAppointments; track item.id) {
            <li class="patient-appointments__item patient-appointments__item--past">
              <div class="patient-appointments__summary">
                <h4>Turno con {{ getDoctorName(item.doctor_id) }}</h4>
                <p>
                  {{ formatDateSpanish(item.startAt) }}, {{ formatTimeSpanish(item.startAt) }} -
                  {{ formatTimeSpanish(item.endAt) }}
                </p>
              </div>

              <span class="patient-appointments__status patient-appointments__status--past" [ngClass]="item.status">
                {{ statusLabels[item.status] }}
              </span>
            </li>
          }
        </ul>
      </section>
    }
  }
</section>
```

### 4.3 Update Component Styles

File: `frontend/src/app/patient/components/patient-appointments/patient-appointments.component.scss`

```scss
// Add to existing styles

// Period Selector
.patient-appointments__periods {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(7, 56, 84, 0.08);
  overflow-x: auto;
  padding-bottom: 0;
}

.patient-appointments__period-btn {
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-600);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    color: var(--brand-900);
    background: rgba(7, 56, 84, 0.04);
  }

  &.active {
    color: var(--brand-900);
    border-bottom-color: var(--brand-600);
    font-weight: 600;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// Section Styling
.patient-appointments__section {
  margin-bottom: 2rem;
}

.patient-appointments__section-title {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--brand-900);

  &--past {
    color: var(--gray-600);
  }
}

// Past Appointment Styling
.patient-appointments__item--past {
  opacity: 0.7;
  background: rgba(243, 244, 246, 0.8);
  border-color: rgba(156, 163, 175, 0.2);

  .patient-appointments__summary h4 {
    color: var(--gray-700);
  }

  .patient-appointments__summary p {
    color: var(--gray-500);
  }
}

.patient-appointments__status--past {
  background: rgba(156, 163, 175, 0.1);
  color: var(--gray-600);
}

// Empty State
.patient-appointments__empty {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--gray-600);

  p {
    margin: 0.5rem 0;
  }

  p:first-child {
    font-size: 1.125rem;
    font-weight: 500;
  }
}

// Loading State
.patient-appointments__loading {
  display: grid;
  gap: 1rem;
}

.skeleton-card {
  height: 120px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 1rem;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// Responsive Design
@media (max-width: 768px) {
  .patient-appointments__periods {
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }

  .patient-appointments__period-btn {
    scroll-snap-align: start;
    flex-shrink: 0;
  }
}
```

## Step 5: Update Patient Shell Component

### 5.1 Update Component TypeScript

File: `frontend/src/app/patient/patient-shell.component.ts`

```typescript
import { DateUtilsService, TimePeriod } from '../core/services/date-utils.service';

export class PatientShellComponent {
  // Add new signals and imports
  readonly selectedPeriod = signal<TimePeriod>('today');
  readonly filteredAppointments = signal<AppointmentDto[]>([]);
  readonly isLoadingFiltered = signal<boolean>(false);

  constructor(
    // ... existing injections
    private dateUtilsService: DateUtilsService
  ) {}

  // Add new method for period changes
  onPeriodChange(period: TimePeriod): void {
    this.selectedPeriod.set(period);
    this.loadFilteredAppointments();
  }

  // Add new method for loading filtered appointments
  private loadFilteredAppointments(): void {
    const currentUser = this.authService.user();
    if (!currentUser) {
      return;
    }

    this.isLoadingFiltered.set(true);
    
    const dateRange = this.dateUtilsService.getDateRange(this.selectedPeriod());
    const startDate = this.dateUtilsService.toISOString(dateRange.start);
    const endDate = this.dateUtilsService.toISOString(dateRange.end);

    this.appointmentsService
      .listForPatientFiltered(currentUser.id, startDate, endDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.filteredAppointments.set(items);
          this.isLoadingFiltered.set(false);
        },
        error: () => {
          this.isLoadingFiltered.set(false);
          this.errorMessage.set('No pudimos obtener tus turnos para este período.');
        }
      });
  }

  // Update constructor to load filtered appointments
  constructor() {
    this.loadPatient();
    this.loadFilteredAppointments(); // Replace loadAppointments()
    this.loadMedicalRecords();
  }

  // Update refresh method
  refresh(): void {
    this.loadPatient();
    this.loadFilteredAppointments();
    this.loadMedicalRecords();
  }

  // Update onAppointmentBooked method
  onAppointmentBooked(appointment: AppointmentDto): void {
    this.filteredAppointments.update((items) => [...items, appointment]);
    this.errorMessage.set(null);
    this.loadMedicalRecords();
  }
}
```

### 5.2 Update Component HTML

File: `frontend/src/app/patient/patient-shell.component.html`

```html
<!-- Update the appointments slot -->
<div slot="appointments">
  <app-patient-appointments
    [appointments]="filteredAppointments()"
    [selectedPeriod]="selectedPeriod()"
    [loading]="isLoadingFiltered()"
    [actionId]="appointmentActionId()"
    (cancel)="onCancelAppointment($event)"
    (confirm)="onConfirmAppointment($event)"
    (periodChange)="onPeriodChange($event)"
  />
</div>
```

## Step 6: Testing

### 6.1 Backend Tests

Create test file: `backend/tests/test_appointments_filtered.py`

```python
import pytest
from datetime import datetime, timedelta
from app.services.appointments import AppointmentsService

def test_list_patient_appointments_filtered_today(db_session, sample_patient, sample_appointments):
    """Test filtering appointments for today."""
    service = AppointmentsService(db_session)
    
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    appointments = service.list_for_patient_filtered(
        sample_patient.id, 
        start_date=today_start, 
        end_date=today_end
    )
    
    # Verify only today's appointments are returned
    for apt in appointments:
        assert today_start <= apt.start_at <= today_end
```

### 6.2 Frontend Tests

Create test file: `frontend/src/app/core/services/date-utils.service.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { DateUtilsService } from './date-utils.service';

describe('DateUtilsService', () => {
  let service: DateUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DateUtilsService);
  });

  describe('getTodayRange', () => {
    it('should return start and end of today', () => {
      const now = new Date();
      const range = service.getTodayRange();
      
      expect(range.start.getFullYear()).toBe(now.getFullYear());
      expect(range.start.getMonth()).toBe(now.getMonth());
      expect(range.start.getDate()).toBe(now.getDate());
      expect(range.start.getHours()).toBe(0);
      expect(range.start.getMinutes()).toBe(0);
      
      expect(range.end.getDate()).toBe(now.getDate() + 1);
    });
  });

  describe('getDateRange', () => {
    it('should return correct range for each period', () => {
      const todayRange = service.getDateRange('today');
      const thisWeekRange = service.getDateRange('thisWeek');
      const nextWeekRange = service.getDateRange('nextWeek');
      const nextMonthRange = service.getDateRange('nextMonth');
      
      expect(todayRange.start < todayRange.end).toBeTrue();
      expect(thisWeekRange.start < thisWeekRange.end).toBeTrue();
      expect(nextWeekRange.start < nextWeekRange.end).toBeTrue();
      expect(nextMonthRange.start < nextMonthRange.end).toBeTrue();
    });
  });
});
```

## Step 7: Error Handling & Edge Cases

### 7.1 Add Error Handling

Update the patient shell component to handle edge cases:

```typescript
private loadFilteredAppointments(): void {
  const currentUser = this.authService.user();
  if (!currentUser) {
    this.errorMessage.set('Tu sesión no es válida. Ingresá nuevamente.');
    return;
  }

  this.isLoadingFiltered.set(true);
  this.errorMessage.set(null);
  
  try {
    const dateRange = this.dateUtilsService.getDateRange(this.selectedPeriod());
    const startDate = this.dateUtilsService.toISOString(dateRange.start);
    const endDate = this.dateUtilsService.toISOString(dateRange.end);

    this.appointmentsService
      .listForPatientFiltered(currentUser.id, startDate, endDate)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Error loading filtered appointments:', error);
          this.errorMessage.set('Error al cargar los turnos. Intentá nuevamente.');
          return of([]);
        })
      )
      .subscribe({
        next: (items) => {
          this.filteredAppointments.set(items);
          this.isLoadingFiltered.set(false);
        }
      });
  } catch (error) {
    console.error('Error in date range calculation:', error);
    this.errorMessage.set('Error al procesar las fechas. Intentá nuevamente.');
    this.isLoadingFiltered.set(false);
  }
}
```

## Step 8: Performance Optimizations

### 8.1 Add Debouncing

```typescript
import { debounceTime, distinctUntilChanged } from 'rxjs';

onPeriodChange(period: TimePeriod): void {
  this.selectedPeriod.set(period);
  
  // Debounce rapid period changes
  of(period).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(() => {
    this.loadFilteredAppointments();
  });
}
```

### 8.2 Add Caching

```typescript
private appointmentCache = new Map<string, AppointmentDto[]>();

private loadFilteredAppointments(): void {
  const cacheKey = `${this.currentUserId}-${this.selectedPeriod()}`;
  
  if (this.appointmentCache.has(cacheKey)) {
    this.filteredAppointments.set(this.appointmentCache.get(cacheKey)!);
    return;
  }
  
  // ... existing loading logic ...
  
  // Cache the results
  this.appointmentsService
    .listForPatientFiltered(currentUser.id, startDate, endDate)
    .subscribe({
      next: (items) => {
        this.filteredAppointments.set(items);
        this.appointmentCache.set(cacheKey, items);
        this.isLoadingFiltered.set(false);
      }
    });
}
```

## Deployment Checklist

- [ ] Backend API endpoints tested and documented
- [ ] Frontend components tested across different screen sizes
- [ ] Error handling implemented for all failure scenarios
- [ ] Performance optimizations applied (debouncing, caching)
- [ ] Accessibility features implemented (ARIA labels, keyboard navigation)
- [ ] Loading states and empty states properly designed
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness tested
- [ ] Integration tests passing
- [ ] User acceptance testing completed

This implementation guide provides a comprehensive roadmap for enhancing the "Mis Turnos" section with time-based filtering capabilities while maintaining code quality, performance, and user experience standards.