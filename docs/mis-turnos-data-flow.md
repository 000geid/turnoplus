# "Mis Turnos" Data Flow Architecture

## System Flow Diagram

```mermaid
graph TD
    A[Patient selects time period] --> B[PatientShellComponent]
    B --> C[DateUtilsService.getPeriodRange]
    C --> D[AppointmentsService.listForPatientFiltered]
    D --> E[Backend API: GET /appointments/patients/{id}/filtered]
    E --> F[AppointmentsService.list_for_patient_filtered]
    F --> G[Database Query with Date Range]
    G --> H[Filtered Appointments Response]
    H --> I[PatientShellComponent separates past/future]
    I --> J[PatientAppointmentsComponent renders]
    
    K[Patient changes period] --> L[Debounce period change]
    L --> A
    
    M[Patient confirms/cancels appointment] --> N[PatientAppointmentsComponent.emit]
    N --> O[PatientShellComponent.handleAction]
    O --> P[AppointmentsService.confirm/cancel]
    P --> Q[Backend API: POST /appointments/{id}/action]
    Q --> R[Update appointment status]
    R --> S[Refresh filtered appointments]
    S --> I
```

## Component Interaction Diagram

```mermaid
graph LR
    subgraph "Frontend Components"
        A[PatientShellComponent]
        B[PatientAppointmentsComponent]
        C[DateUtilsService]
        D[AppointmentsService]
    end
    
    subgraph "Backend Services"
        E[AppointmentsController]
        F[AppointmentsService]
        G[Database Layer]
    end
    
    A -->|manages state| B
    A -->|calls| D
    A -->|uses| C
    B -->|emits events| A
    D -->|HTTP requests| E
    E -->|delegates to| F
    F -->|queries| G
    F -->|returns| E
    E -->|HTTP response| D
    D -->|observables| A
    C -->|date calculations| A
```

## Data Transformation Flow

```mermaid
sequenceDiagram
    participant U as User
    component PSC as PatientShellComponent
    component DUS as DateUtilsService
    component AS as AppointmentsService
    component API as Backend API
    component DB as Database
    
    U->>PSC: Selects "Esta semana"
    PSC->>DUS: getThisWeekRange()
    DUS-->>PSC: {start: Date, end: Date}
    PSC->>AS: listForPatientFiltered(id, start, end)
    AS->>API: GET /appointments/patients/{id}/filtered
    API->>DB: SELECT * WHERE patient_id = id AND start_at BETWEEN start AND end
    DB-->>API: Appointment records
    API-->>AS: AppointmentDto[]
    AS-->>PSC: Observable<AppointmentDto[]>
    PSC->>PSC: Separate past/future appointments
    PSC-->>U: Render organized appointments
```

## State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> Loaded: Data received
    Loading --> Error: API error
    Error --> Loading: Retry
    Loaded --> Loading: Period changed
    Loaded --> Loaded: Appointment action
    
    state Loaded {
        [*] --> SeparateAppointments
        SeparateAppointments --> FutureSection: Future appointments
        SeparateAppointments --> PastSection: Past appointments
        FutureSection --> [*]
        PastSection --> [*]
    }
```

## API Request/Response Flow

```mermaid
graph TD
    A[Frontend Request] --> B[HTTP GET /appointments/patients/{id}/filtered]
    B --> C{Query Parameters}
    C -->|start_date| D[ISO Date String]
    C -->|end_date| E[ISO Date String]
    D --> F[Backend Validation]
    E --> F
    F --> G[Service Layer Processing]
    G --> H[Database Query]
    H --> I[Raw Appointment Data]
    I --> J[Schema Transformation]
    J --> K[AppointmentDto[]]
    K --> L[HTTP Response]
    L --> M[Frontend Processing]
    M --> N[Separate Past/Future]
    N --> O[UI Rendering]
```

## Error Handling Flow

```mermaid
graph TD
    A[User Action] --> B{API Call}
    B -->|Success| C[Update UI]
    B -->|Network Error| D[Show Network Error Message]
    B -->|Validation Error| E[Show Validation Error Message]
    B -->|Server Error| F[Show Server Error Message]
    
    D --> G[Retry Button]
    E --> G
    F --> G
    
    G --> H{User Clicks Retry?}
    H -->|Yes| A
    H -->|No| I[Stay in Current State]
```

## Component Lifecycle Flow

```mermaid
graph LR
    A[ngOnInit] --> B[Load initial data]
    B --> C[Set default period = 'today']
    C --> D[Fetch appointments for today]
    D --> E[Separate past/future]
    E --> F[Render UI]
    
    G[onPeriodChange] --> H[Debounce 300ms]
    H --> I[Get date range for period]
    I --> J[Fetch filtered appointments]
    J --> K[Update component state]
    K --> L[Re-render UI]
    
    M[onAppointmentAction] --> N[Call confirm/cancel API]
    N --> O[Wait for response]
    O --> P[Refresh appointment list]
    P --> Q[Update UI with new status]
```

## Performance Optimization Flow

```mermaid
graph TD
    A[User selects period] --> B{Data cached?}
    B -->|Yes| C[Return cached data]
    B -->|No| D[Make API call]
    D --> E[Store in cache]
    E --> F[Return data]
    
    C --> G[Update UI immediately]
    F --> G
    
    H[User selects adjacent period] --> I[Preload data]
    I --> J[Cache for future use]
    
    K[Component destroyed] --> L[Clear cache]