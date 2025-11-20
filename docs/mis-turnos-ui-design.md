# "Mis Turnos" UI Design Specification

## Component Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    Mis Turnos                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ [ Hoy ] [ Esta semana ] [ Próxima semana ] [ Próximo mes ]   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Próximos turnos                           │ │
│  │                                                             │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ 📅 Turno con Dr. Juan Pérez                               │ │ │
│  │ │    Hoy, 14:30 - 15:30                                    │ │ │
│  │ │    [ Confirmar ] [ Cancelar ]                            │ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ 📅 Turno con Dra. María García                            │ │ │
│  │ │    Mañana, 10:00 - 11:00                                 │ │ │
│  │ │    [ Confirmar ] [ Cancelar ]                            │ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Turnos pasados                           │ │
│  │                                                             │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ 📅 Turno con Dr. Carlos López                            │ │ │
│  │ │    Ayer, 16:00 - 17:00 • Completado                     │ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ 📅 Turno con Dra. Ana Martínez                          │ │ │
│  │ │    15 Oct, 09:00 - 10:00 • Completado                   │ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Design Elements

### 1. Period Selector
- **Style**: Tab-based navigation with active state highlighting
- **Position**: Top of the component, full width
- **Active State**: Bold text with underline indicator
- **Hover State**: Subtle background color change
- **Responsive**: On mobile, converts to horizontal scrollable tabs

### 2. Section Headers
- **"Próximos turnos"**: Bold, prominent styling with brand color
- **"Turnos pasados"**: Muted styling with gray color
- **Icons**: Calendar icon (📅) for visual consistency
- **Spacing**: Consistent margin between sections

### 3. Appointment Cards
- **Future Appointments**: 
  - Full opacity, vibrant colors
  - Action buttons (Confirmar/Cancelar) visible
  - Status badges with bright colors
  
- **Past Appointments**:
  - Reduced opacity (70%)
  - Muted color scheme
  - No action buttons
  - Status indicators only (Completado/Cancelado)

### 4. Empty States
- **No future appointments**: 
  ```
  📅 No tienes turnos próximos
  ¡Reserva tu próxima cita!
  ```
  
- **No past appointments**:
  ```
  📋 Aún no tienes turnos pasados
  Tu historial aparecerá aquí
  ```

### 5. Loading States
- **Skeleton loaders**: Card-shaped placeholders while loading
- **Shimmer effect**: Subtle animation during data fetch
- **Period selector**: Disabled during loading

## Responsive Design

### Desktop (> 768px)
- Two-column layout for appointment cards
- Full-width period selector
- Maximum width container with centered content

### Tablet (768px - 1024px)
- Single column layout
- Horizontal scrollable period selector
- Optimized card spacing

### Mobile (< 768px)
- Single column layout
- Horizontal scrollable period selector with snap points
- Compact appointment cards
- Touch-friendly button sizes

## Color Scheme

### Future Appointments
- **Card Background**: `rgba(222, 247, 250, 0.55)` (light blue)
- **Border**: `rgba(15, 118, 110, 0.12)` (teal)
- **Text**: `var(--brand-900)` (dark teal)
- **Buttons**: Primary brand colors

### Past Appointments
- **Card Background**: `rgba(243, 244, 246, 0.8)` (light gray)
- **Border**: `rgba(156, 163, 175, 0.2)` (medium gray)
- **Text**: `var(--gray-600)` (medium gray)
- **Status**: Muted versions of status colors

## Typography

### Section Headers
- **Font Size**: 1.25rem (20px)
- **Font Weight**: 600 (semibold)
- **Line Height**: 1.5

### Appointment Details
- **Doctor Name**: 1rem (16px), font weight 500
- **Date/Time**: 0.875rem (14px), regular weight
- **Status**: 0.75rem (12px), uppercase, letter spacing 0.06em

## Micro-interactions

### Period Selection
- **Click**: Smooth transition between content sections
- **Active Tab**: Underline animation from left to right
- **Hover**: Subtle background color fade

### Appointment Cards
- **Hover**: Slight elevation increase with shadow
- **Button Hover**: Color brightness increase
- **Button Click**: Subtle scale effect

## Accessibility

### Keyboard Navigation
- Tab order: Period selector → Future appointments → Past appointments
- Focus indicators: Visible outline on interactive elements
- Arrow key navigation: Period selector supports left/right arrows

### Screen Reader Support
- Semantic HTML structure with proper headings
- ARIA labels for period selector tabs
- Status announcements for appointment states
- Live regions for loading states

### Color Contrast
- WCAG AA compliance for all text elements
- Status indicators distinguishable by color and text
- Focus states visible for keyboard navigation

## Animation Specifications

### Page Load
- Fade in animation for entire component (300ms ease-out)
- Staggered appearance of appointment cards (100ms delay between cards)

### Period Switching
- Cross-fade animation between content sections (250ms ease-in-out)
- Smooth underline transition for active tab (200ms ease-out)

### Loading States
- Shimmer effect: 1.5s animation loop
- Skeleton pulse: 2s animation loop with opacity variation

## Error States

### API Error
```
⚠️ Error al cargar los turnos
No pudimos obtener tu información. Intenta nuevamente.
[ Reintentar ]
```

### Network Error
```
📡 Error de conexión
Verifica tu conexión a internet e intenta de nuevo.
[ Reintentar ]
```

## Performance Considerations

### Lazy Loading
- Load only visible appointment data initially
- Implement virtual scrolling for large datasets
- Cache filtered results for quick period switching

### Optimization
- Debounce period selection (300ms)
- Preload adjacent period data
- Use Angular's OnPush change detection strategy