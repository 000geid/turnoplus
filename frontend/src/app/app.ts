import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  
  protected readonly currentYear = new Date().getFullYear();
  protected readonly isAuthenticated = computed(() => {
    const user = this.authService.user();
    const isAuth = !!user;
    console.log('isAuthenticated computed:', { user, isAuth });
    return isAuth;
  });
  protected readonly user = this.authService.user;

  protected readonly loginForm: FormGroup = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['user', Validators.required]
  });

  protected loginError: string | null = null;
  protected isLoginSubmitting = false;

  protected logout(): void {
    console.log('Logout called, user before:', this.authService.user());
    this.authService.logout();
    console.log('Logout called, user after:', this.authService.user());
    this.router.navigate(['/']);
  }

  protected onLoginSubmit(): void {
    // Clear any previous errors
    this.loginError = null;
    
    if (this.loginForm.valid) {
      this.isLoginSubmitting = true;
      
      const { email, password, role } = this.loginForm.value;
      
      this.authService.login(role, { email, password }).subscribe({
        next: () => {
          this.isLoginSubmitting = false;
          // Navigation will be handled by the auth service
        },
        error: (error) => {
          this.isLoginSubmitting = false;
          console.error('Login error:', error);
          
          // Handle different types of errors
          if (error.status === 401) {
            this.loginError = 'Credenciales inválidas. Verificá tu email y contraseña.';
          } else if (error.status === 403) {
            this.loginError = 'Acceso denegado. Verificá que tengas permisos para este rol.';
          } else if (error.status === 0) {
            this.loginError = 'Error de conexión. Verificá tu conexión a internet.';
          } else if (error.error?.detail) {
            this.loginError = error.error.detail;
          } else if (error.message) {
            this.loginError = error.message;
          } else {
            this.loginError = 'Error al iniciar sesión. Verificá tus credenciales.';
          }
        }
      });
    }
  }
}
