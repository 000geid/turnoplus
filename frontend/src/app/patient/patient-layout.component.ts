import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../core/services/auth.service';
import { PatientsService } from '../core/services/patients.service';
import { AppointmentsService } from '../core/services/appointments.service';
import { MedicalRecordsService } from '../core/services/medical-records.service';
import { PatientDto, PatientUpdateRequest } from '../core/models/user';
import { MedicalRecordDto } from '../core/models/medical-record';
import { AppointmentDto } from '../core/models/appointment';

import { PatientProfileComponent } from './components/patient-profile/patient-profile.component';
import { PatientAppointmentsComponent } from './components/patient-appointments/patient-appointments.component';
import { PatientBookingComponent } from './components/patient-booking/patient-booking.component';
import { PatientMedicalRecordsComponent } from './components/patient-medical-records/patient-medical-records.component';
import {
  DashboardSidebarComponent,
  DashboardSidebarItem
} from '../shared/components/dashboard-sidebar/dashboard-sidebar.component';

@Component({
  selector: 'app-patient-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    DashboardSidebarComponent,
    PatientProfileComponent,
    PatientAppointmentsComponent,
    PatientBookingComponent,
    PatientMedicalRecordsComponent
  ],
  templateUrl: './patient-layout.component.html',
  styleUrl: './patient-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly patientsService = inject(PatientsService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly router = inject(Router);

  // State signals
  readonly profile = signal<PatientDto | null>(null);
  readonly appointments = signal<AppointmentDto[]>([]);
  readonly medicalRecords = signal<MedicalRecordDto[]>([]);
  readonly isLoadingProfile = signal<boolean>(false);
  readonly isLoadingAppointments = signal<boolean>(false);
  readonly isLoadingRecords = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly recordsError = signal<string | null>(null);
  readonly appointmentActionId = signal<number | null>(null);
  readonly isSavingProfile = signal<boolean>(false);
  readonly mobileSidebarOpen = signal<boolean>(false);

  // Computed signals
  readonly pendingAppointments = computed(() => {
    return this.appointments().filter(apt => apt.status === 'pending').length;
  });

  readonly navigationItems = computed<DashboardSidebarItem[]>(() => [
    {
      id: 'appointments',
      label: 'Turnos',
      icon: 'event',
      route: '/patient/appointments',
      badge: this.pendingAppointments() || null
    },
    {
      id: 'booking',
      label: 'Reservar',
      icon: 'add',
      route: '/patient/booking'
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: 'person',
      route: '/patient/profile'
    },
    {
      id: 'records',
      label: 'Historial',
      icon: 'history',
      route: '/patient/records'
    }
  ]);

  readonly currentRoute = computed(() => {
    return this.router.url.split('?')[0];
  });

  constructor() {
    this.loadPatientData();
  }

  get currentUserId(): number | null {
    return this.authService.user()?.id ?? null;
  }

  // Navigation methods
  onNavigation(route: string): void {
    this.router.navigate([route]);
    this.closeMobileSidebar(); // Close mobile sidebar after navigation
  }

  // Mobile sidebar methods
  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update(open => !open);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  // Data loading methods
  refresh(): void {
    this.loadPatientData();
  }

  onAppointmentBooked(appointment: AppointmentDto): void {
    this.appointments.update(items => [...items, appointment]);
    this.errorMessage.set(null);
    this.loadMedicalRecords();
  }

  onRefreshRecords(): void {
    this.loadMedicalRecords(true);
  }

  onProfileSave(changes: PatientUpdateRequest): void {
    const currentUser = this.authService.user();
    if (!currentUser) {
      this.errorMessage.set('No pudimos determinar tu sesión actual.');
      return;
    }
    this.isSavingProfile.set(true);
    this.errorMessage.set(null);

    this.patientsService.updatePatient(currentUser.id, changes).subscribe({
      next: (updatedPatient) => {
        this.profile.set(updatedPatient);
        this.isSavingProfile.set(false);
      },
      error: () => {
        this.isSavingProfile.set(false);
        this.errorMessage.set('No pudimos guardar los cambios. Intentá más tarde.');
      }
    });
  }

  onAppointmentAction(appointmentId: number, action: 'cancel' | 'confirm'): void {
    this.mutateAppointment(appointmentId, action);
  }

  private mutateAppointment(appointmentId: number, action: 'cancel' | 'confirm'): void {
    this.appointmentActionId.set(appointmentId);
    this.errorMessage.set(null);

    const request = action === 'cancel'
      ? this.appointmentsService.cancel(appointmentId)
      : this.appointmentsService.confirm(appointmentId);

    request.subscribe({
      next: (updated) => {
        this.appointments.update(list =>
          list.map(item => item.id === updated.id ? updated : item)
        );
        this.appointmentActionId.set(null);
      },
      error: () => {
        this.appointmentActionId.set(null);
        this.errorMessage.set('No pudimos actualizar el turno. Intentá nuevamente.');
      }
    });
  }

  private loadPatientData(): void {
    this.loadPatient();
    this.loadAppointments();
    this.loadMedicalRecords();
  }

  private loadPatient(): void {
    const currentUser = this.authService.user();
    if (!currentUser) {
      this.errorMessage.set('Tu sesión no es válida. Ingresá nuevamente.');
      return;
    }

    this.isLoadingProfile.set(true);
    this.errorMessage.set(null);

    this.patientsService.getPatient(currentUser.id).subscribe({
      next: (patient) => {
        this.profile.set(patient);
        this.isLoadingProfile.set(false);
      },
      error: () => {
        this.isLoadingProfile.set(false);
        this.errorMessage.set('No pudimos cargar tu perfil. Intentá nuevamente.');
      }
    });
  }

  private loadAppointments(): void {
    const currentUser = this.authService.user();
    if (!currentUser) return;

    this.isLoadingAppointments.set(true);

    this.appointmentsService.listForPatient(currentUser.id).subscribe({
      next: (items) => {
        this.appointments.set(items);
        this.isLoadingAppointments.set(false);
      },
      error: () => {
        this.isLoadingAppointments.set(false);
        this.errorMessage.set('No pudimos obtener tus turnos.');
      }
    });
  }

  private loadMedicalRecords(force = false): void {
    const currentUser = this.authService.user();
    if (!currentUser) {
      this.recordsError.set('Tu sesión no es válida. Ingresá nuevamente.');
      return;
    }

    if (this.isLoadingRecords() && !force) return;

    this.isLoadingRecords.set(true);
    this.recordsError.set(null);

    this.medicalRecordsService.listForPatient(currentUser.id).subscribe({
      next: (records) => {
        this.medicalRecords.set(records);
        this.isLoadingRecords.set(false);
      },
      error: () => {
        this.isLoadingRecords.set(false);
        this.recordsError.set('No pudimos cargar tu historial médico.');
      }
    });
  }
}
