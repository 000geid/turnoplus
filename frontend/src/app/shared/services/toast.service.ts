import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { ToastComponent } from '../components/toast/toast.component';
import { ToastOptions, ToastType, DEFAULT_TOAST_CONFIG } from '../types/toast.types';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Shows a success toast notification
   */
  success(message: string, options?: ToastOptions): MatSnackBarRef<ToastComponent> {
    return this.show('success', message, options);
  }

  /**
   * Shows an error toast notification
   */
  error(message: string, options?: ToastOptions): MatSnackBarRef<ToastComponent> {
    return this.show('error', message, options);
  }

  /**
   * Shows a warning toast notification
   */
  warning(message: string, options?: ToastOptions): MatSnackBarRef<ToastComponent> {
    return this.show('warning', message, options);
  }

  /**
   * Shows an info toast notification
   */
  info(message: string, options?: ToastOptions): MatSnackBarRef<ToastComponent> {
    return this.show('info', message, options);
  }

  /**
   * Shows a custom toast notification with specified type
   */
  show(
    type: ToastType, 
    message: string, 
    options?: ToastOptions
  ): MatSnackBarRef<ToastComponent> {
    const verticalPosition: MatSnackBarVerticalPosition = options?.config?.position === 'bottom' ? 'bottom' : 'top';
    
    const config = {
      ...DEFAULT_TOAST_CONFIG,
      ...options,
      data: {
        type,
        message,
        title: options?.title,
        config: {
          ...DEFAULT_TOAST_CONFIG,
          ...options?.config
        }
      },
      horizontalPosition: 'center' as const,
      verticalPosition
    };

    const snackBarRef = this.snackBar.openFromComponent(ToastComponent, config);
    
    // Auto-dismiss if duration is set
    if (config.duration > 0) {
      snackBarRef.afterDismissed().subscribe(() => {
        // Toast was dismissed automatically
      });
    }

    return snackBarRef;
  }

  /**
   * Dismisses all currently visible toasts
   */
  dismissAll(): void {
    this.snackBar.dismiss();
  }

  /**
   * Shows a loading/pending toast that doesn't auto-dismiss
   */
  loading(
    message: string, 
    options?: Omit<ToastOptions, 'config'> & { config?: Omit<ToastOptions['config'], 'duration'> }
  ): MatSnackBarRef<ToastComponent> {
    return this.show('info', message, {
      ...options,
      config: {
        ...options?.config,
        duration: 0 // No auto-dismiss
      }
    });
  }

  /**
   * Updates an existing toast to show completion state
   */
  complete(
    snackBarRef: MatSnackBarRef<ToastComponent>,
    success: boolean,
    message: string
  ): void {
    snackBarRef.dismiss();
    
    setTimeout(() => {
      this.show(success ? 'success' : 'error', message);
    }, 100);
  }
}