import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    full_name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  isSubmitting = false;

  onSubmit(): void {
    if (this.form.invalid || this.form.value.password !== this.form.value.confirmPassword) {
      if (this.form.value.password !== this.form.value.confirmPassword) {
        this.toastService.error('Las contraseñas no coinciden.');
      } else {
        this.toastService.error('Completá los datos obligatorios.');
      }
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.toastService.info('Creando tu cuenta...', { config: { duration: 0 } });
    
    const payload = {
      full_name: this.form.value.full_name ?? undefined,
      email: this.form.value.email!,
      password: this.form.value.password!
    };

    this.authService.registerPatient(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastService.success('¡Cuenta creada exitosamente! Bienvenido.');
        this.router.navigate(['/patient']);
      },
      error: () => {
        this.isSubmitting = false;
        this.toastService.error('No pudimos crear tu cuenta. Probá más tarde.');
      }
    });
  }
}
