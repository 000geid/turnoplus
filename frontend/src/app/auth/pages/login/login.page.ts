import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: 'patient' as UserRole
  });

  isSubmitting = false;

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Por favor, completá todos los campos correctamente.');
      return;
    }
    this.isSubmitting = true;

    const { email, password, role } = this.form.getRawValue();
    this.authService.login(role, { email, password }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastService.success('¡Bienvenido de vuelta!');
        this.navigateByRole(role);
      },
      error: () => {
        this.isSubmitting = false;
        this.toastService.error('Credenciales inválidas. Intentá nuevamente.');
      }
    });
  }

  private navigateByRole(role: UserRole): void {
    switch (role) {
      case 'doctor':
        this.router.navigate(['/doctor']);
        break;
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'patient':
      case 'user':
        this.router.navigate(['/patient']);
        break;
      default:
        this.router.navigate(['/patient']);
        break;
    }
  }
}
