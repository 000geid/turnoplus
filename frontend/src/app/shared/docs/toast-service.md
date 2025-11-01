# ToastService Documentation

The ToastService provides a centralized, reusable notification system for the TurnoPlus application. It replaces inline messages with elegant toast notifications that provide better user experience and consistent messaging across the application.

## Overview

The ToastService is built on top of Angular Material's MatSnackBar but provides a more user-friendly interface with:

- **Type-safe methods** for different notification types
- **Custom styling** that matches the TurnoPlus design system
- **Icon integration** for visual context
- **Auto-dismiss** with configurable timeouts
- **Manual dismiss** option for user control
- **Queue management** for multiple notifications

## Toast Types

The service supports four main toast types, each with distinct styling and icons:

- **Success** (✓): Positive feedback for successful operations
- **Error** (✗): Error messages and validation failures
- **Warning** (⚠): Warnings and cautionary messages
- **Info** (ℹ): General information and loading states

## Basic Usage

### Injecting the Service

```typescript
import { ToastService } from '../../../shared/services/toast.service';

constructor(private toastService: ToastService) {}
```

### Simple Notifications

```typescript
// Success message
this.toastService.success('Disponibilidad agregada correctamente.');

// Error message
this.toastService.error('No se pudo guardar la disponibilidad.');

// Warning message
this.toastService.warning('Hay conflictos en el horario seleccionado.');

// Info message
this.toastService.info('Los cambios se han guardado.');
```

### Advanced Configuration

```typescript
// Custom configuration
this.toastService.success('Archivo guardado', {
  title: 'Éxito',
  config: {
    duration: 8000,          // Duration in milliseconds (0 = no auto-dismiss)
    dismissible: true,       // Allow manual dismissal
    position: 'top',         // 'top' or 'bottom'
    maxWidth: '500px'        // Maximum width of toast
  }
});

// Loading state (never auto-dismisses)
this.toastService.loading('Procesando solicitud...', {
  config: {
    duration: 0              // Infinite duration for loading states
  }
});
```

## Integration Examples

### Form Validation

```typescript
onSubmit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    this.toastService.error('Por favor, completá todos los campos correctamente.');
    return;
  }
  
  // Handle form submission...
}
```

### API Call with Loading State

```typescript
saveData(): void {
  const loadingToast = this.toastService.loading('Guardando datos...');
  
  this.apiService.saveData(this.data).subscribe({
    next: (result) => {
      loadingToast.dismiss();
      this.toastService.success('Datos guardados exitosamente.');
    },
    error: (error) => {
      loadingToast.dismiss();
      this.toastService.error('No se pudieron guardar los datos. Intentá nuevamente.');
    }
  });
}
```

### Completion Pattern

```typescript
const loadingToast = this.toastService.loading('Creando disponibilidad...');

this.appointmentsService.createAvailability(payload).subscribe({
  next: (slot) => {
    // Complete with success
    this.toastService.complete(loadingToast, true, 'Disponibilidad creada exitosamente.');
  },
  error: (error) => {
    // Complete with error
    this.toastService.complete(loadingToast, false, 'No se pudo crear la disponibilidad.');
  }
});
```

## Configuration Options

### ToastOptions Interface

```typescript
interface ToastOptions {
  title?: string;           // Optional title for the toast
  config?: ToastConfig;     // Configuration object
}

interface ToastConfig {
  duration?: number;        // Auto-dismiss duration (ms, 0 = never)
  dismissible?: boolean;    // Allow manual dismissal
  position?: 'top' | 'bottom'; // Toast position
  maxWidth?: string;        // Maximum toast width
  className?: string;       // Additional CSS classes
}
```

### Default Configuration

```typescript
const DEFAULT_TOAST_CONFIG = {
  duration: 5000,           // 5 seconds
  dismissible: true,        // Allow close button
  position: 'top',          // Show at top
  maxWidth: '400px',        // Standard width
  className: ''            // No additional classes
};
```

## Styling and Customization

### CSS Variables

The toast component uses CSS custom properties for easy theming:

```scss
.toast {
  --toast-max-width: 400px;
  --toast-success-color: #065f46;
  --toast-error-color: #991b1b;
  --toast-warning-color: #92400e;
  --toast-info-color: #1e40af;
}
```

### Toast Variants

Each toast type has distinct styling:

- **Success**: Green theme with checkmark icon
- **Error**: Red theme with X icon  
- **Warning**: Yellow/orange theme with warning icon
- **Info**: Blue theme with information icon

## Best Practices

### 1. Use Appropriate Toast Types

```typescript
// ✅ Good
this.toastService.success('Turno reservado con éxito!');
this.toastService.error('No se pudo conectar al servidor.');

// ❌ Avoid
this.toastService.info('Turno reservado con éxito!'); // Should be success
```

### 2. Keep Messages Concise

```typescript
// ✅ Good
this.toastService.success('Disponibilidad actualizada.');

// ❌ Avoid - Too verbose
this.toastService.success('Tu disponibilidad ha sido actualizada correctamente en el sistema.');
```

### 3. Loading States for Long Operations

```typescript
// ✅ Good - Shows user something is happening
const loadingToast = this.toastService.loading('Procesando...');
this.longOperation().subscribe({
  next: () => {
    loadingToast.dismiss();
    this.toastService.success('Operación completada.');
  }
});

// ❌ Avoid - No feedback during operation
this.longOperation().subscribe({
  next: () => {
    this.toastService.success('Operación completada.'); // Too late
  }
});
```

### 4. Handle Errors Gracefully

```typescript
this.apiService.getData().subscribe({
  next: (data) => {
    this.toastService.success('Datos cargados correctamente.');
  },
  error: (error) => {
    this.toastService.error('No se pudieron cargar los datos. Verificá tu conexión.');
    // Don't just show "Error occurred"
  }
});
```

### 5. Cleanup Resources

```typescript
// ✅ Good - Clean up loading toasts
const loadingToast = this.toastService.loading('Procesando...');
// ... operation
loadingToast.dismiss(); // Always clean up

// ✅ Good - Complete pattern handles cleanup automatically
this.toastService.complete(loadingToast, success, message);
```

## Migration Guide

### From Inline Messages

**Before (Inline Messages):**

```html
@if (error) {
  <p class="error-message">{{ error }}</p>
}

@if (message) {
  <p class="success-message">{{ message }}</p>
}
```

**After (Toast Notifications):**

```typescript
// Replace error.set() and message.set() calls
// Instead of:
this.error.set('Something went wrong.');

// Use:
this.toastService.error('Something went wrong.');
```

### From console.log

```typescript
// ✅ Replace console.log with appropriate toast
console.log('User logged in successfully.');
// Becomes:
this.toastService.success('¡Bienvenido de vuelta!');
```

## Troubleshooting

### Common Issues

1. **Toast not showing**: Ensure ToastService is properly injected and MatSnackBar is configured in app.config.ts
2. **Styling issues**: Check that SCSS files are imported and CSS custom properties are defined
3. **TypeScript errors**: Ensure types are imported from the correct path
4. **Auto-dismiss not working**: Check duration configuration (0 = never auto-dismiss)

### Debug Tips

```typescript
// Check if service is working
constructor(private toastService: ToastService) {
  console.log('ToastService initialized:', toastService);
}

// Test toast functionality
testToast(): void {
  this.toastService.success('Test toast working!');
}
```

## Integration Status

The ToastService has been integrated into the following components:

- ✅ Doctor Availability Component
- ✅ Patient Booking Component  
- ✅ Doctor Records Component
- ✅ Patient Medical Records Component
- ✅ Login/Register Pages
- ✅ Patient Medical Modal Component
- ✅ Doctor Patients List Component
- ✅ Doctor Shell Component

## Future Enhancements

Planned improvements:

- [ ] Multiple toast queue management
- [ ] Toast action buttons (Undo, Retry, etc.)
- [ ] Custom animation options
- [ ] Toast grouping by category
- [ ] Accessibility enhancements
- [ ] Mobile-optimized positioning

---

For more information, see the source code:
- Service: `frontend/src/app/shared/services/toast.service.ts`
- Component: `frontend/src/app/shared/components/toast/`
- Types: `frontend/src/app/shared/types/toast.types.ts`