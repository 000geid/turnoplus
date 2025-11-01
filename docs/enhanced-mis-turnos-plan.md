# Enhanced "Mis Turnos" Section - Time-Based Filtering

## Overview

This document outlines the plan to enhance the "Mis Turnos" (My Appointments) section in the TurnoPlus patient interface with time-based filtering capabilities. The enhancement will allow patients to view their appointments organized by time periods: today, this week, next week, and next month, with separate sections for past and future appointments.

## Current State Analysis

### Existing Implementation
- **Component**: `PatientAppointmentsComponent` displays all appointments in a simple list
- **Data Source**: `AppointmentsService.listForPatient()` returns all patient appointments
- **Sorting**: Appointments are sorted chronologically by start time
- **Limitations**: No time-based filtering, all appointments shown in one list

### Backend API
- **Endpoint**: `GET /api/v1/appointments/patients/{patient_id}`
- **Response**: All appointments for the patient, ordered by start time
- **Filtering**: No date range filtering currently supported

## Proposed Architecture

### 1. Backend Enhancements

#### New API Endpoints
```
GET /api/v1/appointments/patients/{patient_id}/filtered?start_date={date}&end_date={date}
```

#### Service Layer Changes
- **AppointmentsService.list_for_patient_filtered()**: New method with date range parameters
- **Date validation**: Ensure start_date <= end_date
- **Timezone handling**: Proper timezone-aware date comparisons

#### Controller Layer Changes
- **route_list_patient_appointments_filtered()**: New endpoint handler
- **Query parameter validation**: Validate date formats and ranges
- **Error handling**: Proper HTTP status codes for invalid requests

### 2. Frontend Enhancements

#### Date Utility Service
Create a new `DateUtilsService` with methods for:
- `getTodayRange()`: Returns start and end of today
- `getThisWeekRange()`: Returns start and end of current week
- `getNextWeekRange()`: Returns start and end of next week  
- `getNextMonthRange()`: Returns start and end of next month
- `isPastAppointment()`: Check if appointment is in the past
- `isFutureAppointment()`: Check if appointment is in the future

#### Enhanced PatientAppointmentsComponent
- **Time period selector**: Dropdown/tabs for selecting time period
- **Separate sections**: Past and Future appointments
- **Visual indicators**: Different styling for past vs future
- **Empty states**: Contextual messages for each time period

#### Updated PatientShellComponent
- **Filtered data handling**: Manage filtered appointment data
- **Loading states**: Show loading during API calls
- **Error handling**: Display error messages for failed requests

## Implementation Details

### Backend Implementation

#### 1. Service Layer (appointments.py)
```python
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
        stmt = stmt.where(AppointmentModel.start_at <= end_date)
    
    stmt = stmt.order_by(AppointmentModel.start_at)
    appointments = self._session.scalars(stmt).all()
    return [self._to_schema(model) for model in appointments]
```

#### 2. Controller Layer (appointments.py)
```python
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
        raise HTTPException(status_code=400, detail="Invalid date format") from exc
```

### Frontend Implementation

#### 1. Date Utility Service
```typescript
@Injectable({ providedIn: 'root' })
export class DateUtilsService {
  getTodayRange(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return { start, end };
  }

  getThisWeekRange(): { start: Date; end: Date } {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }

  // Similar methods for next week and next month
}
```

#### 2. Enhanced Appointments Service
```typescript
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

#### 3. Enhanced PatientAppointmentsComponent
```typescript
export class PatientAppointmentsComponent {
  @Input() selectedPeriod: 'today' | 'thisWeek' | 'nextWeek' | 'nextMonth' = 'today';
  @Input() pastAppointments: ReadonlyArray<AppointmentDto> = [];
  @Input() futureAppointments: ReadonlyArray<AppointmentDto> = [];
  
  periods = [
    { value: 'today', label: 'Hoy' },
    { value: 'thisWeek', label: 'Esta semana' },
    { value: 'nextWeek', label: 'Próxima semana' },
    { value: 'nextMonth', label: 'Próximo mes' }
  ];

  onPeriodChange(period: string): void {
    this.periodChange.emit(period as any);
  }
}
```

## UI/UX Design

### Component Structure
```
PatientAppointmentsComponent
├── Header
│   ├── Title: "Mis Turnos"
│   └── Period Selector (Tabs/Dropdown)
├── Future Appointments Section
│   ├── Section Header: "Próximos turnos"
│   └── Appointment List (existing design)
└── Past Appointments Section
    ├── Section Header: "Turnos pasados"
    └── Appointment List (muted styling)
```

### Visual Design
- **Period selector**: Tab-style selector with clear active state
- **Section separation**: Clear visual distinction between past and future
- **Past appointments**: Muted colors, reduced opacity
- **Future appointments**: Current vibrant styling
- **Empty states**: Contextual messages for each time period
- **Loading states**: Skeleton loaders during data fetching

### Responsive Design
- Mobile-first approach
- Collapsible sections on smaller screens
- Touch-friendly period selector

## Testing Strategy

### Backend Testing
- Unit tests for new service methods
- Integration tests for new API endpoints
- Edge case testing (date boundaries, invalid dates)

### Frontend Testing
- Component unit tests for filtering logic
- Service tests for API calls
- Integration tests for user interactions

### End-to-End Testing
- Complete user flows for each time period
- Error handling scenarios
- Performance testing with large datasets

## Performance Considerations

### Backend Optimizations
- Database indexing on appointment start_at and patient_id
- Efficient date range queries
- Pagination for large datasets (future enhancement)

### Frontend Optimizations
- Lazy loading of appointment data
- Efficient change detection with OnPush strategy
- Debounced period selection to avoid excessive API calls

## Future Enhancements

### Phase 2 Features
- Custom date range selection
- Appointment status filtering
- Search functionality within appointments
- Export appointment data

### Phase 3 Features
- Calendar view integration
- Appointment reminders
- Recurring appointment patterns
- Multi-doctor filtering

## Migration Strategy

### Backward Compatibility
- Maintain existing API endpoint
- Gradual rollout of new features
- Feature flags for controlled deployment

### Data Migration
- No data migration required
- Existing appointments remain unchanged
- New functionality works with existing data

## Success Metrics

### User Experience
- Reduced time to find relevant appointments
- Improved appointment management efficiency
- Higher user satisfaction scores

### Technical Metrics
- API response times under 200ms
- Frontend render times under 100ms
- Zero regression in existing functionality

## Conclusion

This enhancement will significantly improve the patient experience by providing intuitive time-based filtering for appointments. The implementation follows existing architectural patterns and maintains backward compatibility while adding powerful new functionality.

The modular design allows for future enhancements and provides a solid foundation for advanced appointment management features.