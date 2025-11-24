import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { PatientRegisterRequest } from '../../../core/models/auth';

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
    full_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    document_type: ['dni', Validators.required],
    document_number: ['', [Validators.required, Validators.pattern(/^[0-9]{7,10}$/)]],
    address: ['', Validators.required],
    phone: ['', Validators.required]
  });

  isSubmitting = false;

  onSubmit(): void {
    const { password, confirmPassword } = this.form.value;
    if (this.form.invalid || password !== confirmPassword) {
      const message = password !== confirmPassword
        ? 'Las contraseñas no coinciden.'
        : 'Completá los datos obligatorios.';
      this.toastService.error(message);
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.toastService.info('Creando tu cuenta...', { config: { duration: 0 } });
    
    const payload: PatientRegisterRequest = {
      full_name: this.form.value.full_name!,
      email: this.form.value.email!,
      password: this.form.value.password!,
      document_type: 'dni',
      document_number: this.form.value.document_number!,
      address: this.form.value.address!,
      phone: this.form.value.phone!
    };

    this.authService.registerPatient(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastService.success('¡Cuenta creada exitosamente! Bienvenido.');
        this.router.navigate(['/patient']);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        const isDuplicate =
          err.status === 409 || (typeof err.error?.detail === 'string' && err.error.detail.includes('Email already in use'));
        const message = isDuplicate
          ? 'Ya existe una cuenta con este correo.'
          : 'No pudimos crear tu cuenta. Probá más tarde.';
        this.toastService.error(message);
      }
    });
  }
}
