import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { RegisterPage } from './register.page';
import { AuthService } from '../../../core/services/auth.service';
import { AuthenticatedUser } from '../../../core/models/user';
import { ToastService } from '../../../shared/services/toast.service';

describe('RegisterPage', () => {
  let fixture: ComponentFixture<RegisterPage>;
  let component: RegisterPage;
  let authService: jasmine.SpyObj<AuthService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let router: Router;
  let navigateSpy: jasmine.Spy;

  const patientUser: AuthenticatedUser = {
    id: 12,
    email: 'patient@example.com',
    fullName: 'Paciente Demo',
    role: 'patient',
    token: 'token-patient',
    tokenType: 'bearer'
  };

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['registerPatient']);
    toastService = jasmine.createSpyObj<ToastService>('ToastService', [
      'info',
      'success',
      'error'
    ]);
    await TestBed.configureTestingModule({
      imports: [RegisterPage, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ToastService, useValue: toastService }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show a validation error when passwords do not match', () => {
    component.form.setValue({
      full_name: 'Paciente Demo',
      email: 'patient@example.com',
      password: 'secret123',
      confirmPassword: 'different',
      document_type: 'dni',
      document_number: '12345678',
      address: 'Calle 123',
      phone: '555-0000'
    });

    component.onSubmit();

    expect(authService.registerPatient).not.toHaveBeenCalled();
    expect(toastService.error).toHaveBeenCalledWith('Las contraseñas no coinciden.');
  });

  it('should register the patient and redirect to the patient dashboard', () => {
    authService.registerPatient.and.returnValue(of(patientUser));

    component.form.setValue({
      full_name: 'Paciente Demo',
      email: 'patient@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
      document_type: 'dni',
      document_number: '12345678',
      address: 'Calle 123',
      phone: '555-0000'
    });

    component.onSubmit();

    expect(authService.registerPatient).toHaveBeenCalledWith({
      full_name: 'Paciente Demo',
      email: 'patient@example.com',
      password: 'secret123',
      document_type: 'dni',
      document_number: '12345678',
      address: 'Calle 123',
      phone: '555-0000'
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/patient']);
    expect(toastService.success).toHaveBeenCalled();
  });

  it('should show an error message when registration fails', () => {
    authService.registerPatient.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server error' }))
    );

    component.form.setValue({
      full_name: '',
      email: 'patient@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
      document_type: 'dni',
      document_number: '12345678',
      address: 'Calle 123',
      phone: '555-0000'
    });

    component.onSubmit();

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalse();
    expect(toastService.error).toHaveBeenCalled();
  });

  it('should show duplicate email message when backend returns 409', () => {
    authService.registerPatient.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { detail: 'Email already in use' }
          })
      )
    );

    component.form.setValue({
      full_name: 'Paciente Demo',
      email: 'patient@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
      document_type: 'dni',
      document_number: '12345678',
      address: 'Calle 123',
      phone: '555-0000'
    });

    component.onSubmit();

    expect(toastService.error).toHaveBeenCalledWith('Ya existe una cuenta con este correo.');
    expect(component.isSubmitting).toBeFalse();
  });
});
