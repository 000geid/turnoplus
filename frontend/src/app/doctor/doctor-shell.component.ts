import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';
import { DatePipe, NgClass, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { ToastService } from '../shared/services/toast.service';
import { AuthService } from '../core/services/auth.service';
import { AppointmentsService } from '../core/services/appointments.service';
import { MedicalRecordsService } from '../core/services/medical-records.service';
import { DoctorsService } from '../core/services/doctors.service';
import { AppointmentDto, AvailabilityDto, AppointmentStatus } from '../core/models/appointment';
import { MedicalRecordDto, MedicalRecordUpdateRequest } from '../core/models/medical-record';
import { PatientDto } from '../core/models/user';
import {
  DoctorAvailabilityComponent,
  DoctorAvailabilityCreateEvent,
  DoctorAvailabilityUpdateEvent
} from './components/doctor-availability/doctor-availability.component';
import {
  DoctorRecordUpdateEvent,
  DoctorRecordsComponent
} from './components/doctor-records/doctor-records.component';
import {
  DashboardSidebarComponent,
  DashboardSidebarItem
} from '../shared/components/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardMobileMenuComponent } from '../shared/components/dashboard-mobile-menu/dashboard-mobile-menu.component';

@Component({
  selector: 'app-doctor-shell',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    DatePipe,
    MatIconModule,
    MatButtonModule,
    DashboardSidebarComponent,
    DashboardMobileMenuComponent,
    DoctorAvailabilityComponent,
    DoctorRecordsComponent
  ],
  templateUrl: './doctor-shell.component.html',
  styleUrl: './doctor-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoctorShellComponent {
  private readonly authService = inject(AuthService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly doctorsService = inject(DoctorsService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly doctorId: number | null;
  private readonly doctorGreeting = signal<string | null>(null);

  readonly appointments = signal<AppointmentDto[]>([]);
  readonly availability = signal<AvailabilityDto[]>([]);
  readonly records = signal<MedicalRecordDto[]>([]);
  readonly patients = signal<PatientDto[]>([]);

  readonly appointmentsError = signal<string | null>(null);
  readonly availabilityError = signal<string | null>(null);
  readonly recordsError = signal<string | null>(null);
  readonly patientsError = signal<string | null>(null);

  readonly isLoadingAppointments = signal<boolean>(false);
  readonly isLoadingAvailability = signal<boolean>(false);
  readonly isLoadingRecords = signal<boolean>(false);
  readonly isLoadingPatients = signal<boolean>(false);

  readonly isCreatingAvailability = signal<boolean>(false);
  readonly availabilityMutationId = signal<number | null>(null);

  readonly isSavingRecord = signal<boolean>(false);
  readonly recordMutationId = signal<number | null>(null);
  readonly mobileSidebarOpen = signal<boolean>(false);

  readonly sortedAppointments = computed(() =>
    [...this.appointments()]
      .filter((apt) => apt.status !== 'canceled')
      .sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      )
  );

  readonly doctorName = computed(() => this.doctorGreeting());
  readonly currentRoute = computed(() => this.router.url.split('?')[0]);
  readonly pendingAppointments = computed(
    () => this.sortedAppointments().filter((apt) => apt.status === 'pending').length
  );

  readonly navigationItems = computed<DashboardSidebarItem[]>(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/doctor/dashboard'
    },
    {
      id: 'availability',
      label: 'Disponibilidad',
      icon: 'schedule',
      route: '/doctor/availability'
    },
    {
      id: 'appointments',
      label: 'Mis Turnos',
      icon: 'event',
      route: '/doctor/appointments',
      badge: this.pendingAppointments() || null
    },
    {
      id: 'records',
      label: 'Registros',
      icon: 'medical_services',
      route: '/doctor/records'
    }
  ]);

  readonly globalError = computed(
    () =>
      this.appointmentsError() ||
      this.availabilityError() ||
      this.recordsError() ||
      this.patientsError()
  );

  // Enhanced computed properties for dashboard
  readonly greetingMessage = computed(() => {
    const hour = new Date().getHours();
    const name = this.doctorName();

    if (hour < 12) return `Buenos días, Dr. ${name}`;
    if (hour < 18) return `Buenas tardes, Dr. ${name}`;
    return `Buenas noches, Dr. ${name}`;
  });

  // Current date formatting
  readonly currentDateFormatted = computed(() => {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  // Today's appointments
  readonly todayAppointments = computed(() => {
    const today = new Date().toDateString();
    return this.sortedAppointments().filter(apt =>
      new Date(apt.startAt).toDateString() === today
    );
  });

  // Weekly appointments (current week)
  readonly weeklyAppointments = computed(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return this.sortedAppointments().filter(apt => {
      const aptDate = new Date(apt.startAt);
      return aptDate >= startOfWeek && aptDate <= endOfWeek;
    });
  });

  // Weekly statistics
  readonly weeklyStats = computed(() => {
    const weekAppointments = this.weeklyAppointments();
    return {
      total: weekAppointments.length,
      confirmed: weekAppointments.filter(apt => apt.status === 'confirmed').length,
      pending: weekAppointments.filter(apt => apt.status === 'pending').length,
      completed: weekAppointments.filter(apt => apt.status === 'completed').length,
      canceled: weekAppointments.filter(apt => apt.status === 'canceled').length
    };
  });

  // Today's availability
  readonly todayAvailability = computed(() => {
    const today = new Date().toDateString();
    return this.availability().filter(avail =>
      new Date(avail.startAt).toDateString() === today
    );
  });

  // Next available slot
  readonly nextAvailableSlot = computed(() => {
    const now = new Date();
    const futureAvailability = this.availability().filter(avail =>
      new Date(avail.startAt) > now
    );

    if (futureAvailability.length === 0) return null;

    futureAvailability.sort((a, b) =>
      new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );

    return futureAvailability[0];
  });

  // Patient name lookup
  readonly patientNames = computed(() => {
    const names: { [key: number]: string } = {};
    this.patients().forEach(patient => {
      names[patient.id] = patient.full_name || `Paciente #${patient.id}`;
    });
    return names;
  });

  // Map appointment IDs to patient names for template access
  readonly appointmentPatientNameMap = computed(() => {
    const names = this.patientNames();
    return this.sortedAppointments().reduce((map, apt) => {
      map[apt.id] = names[apt.patient_id] || `Paciente #${apt.patient_id}`;
      return map;
    }, {} as { [key: number]: string });
  });

  readonly nextAppointment = computed(() => {
    const now = new Date();
    return this.sortedAppointments().find((apt) => new Date(apt.startAt) > now) ?? null;
  });

  readonly statusLabels: Record<AppointmentStatus, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    canceled: 'Cancelado',
    completed: 'Completado'
  };

  constructor() {
    const currentUser = this.authService.user();
    if (!currentUser || currentUser.role !== 'doctor') {
      this.toastService.error('No pudimos validar tu sesión de profesional.');
      this.doctorId = null;
      return;
    }

    this.doctorId = currentUser.id;
    this.doctorGreeting.set(
      currentUser.fullName ?? `Profesional #${currentUser.id}`
    );

    this.loadAppointments();
    this.loadAvailability();
    this.loadRecords();
    this.loadPatients();
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update((open) => !open);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  onNavigation(route: string): void {
    this.router.navigate([route]);
    this.closeMobileSidebar();
  }

  dismissErrors(): void {
    this.appointmentsError.set(null);
    this.availabilityError.set(null);
    this.recordsError.set(null);
    this.patientsError.set(null);
  }

  refreshAppointments(): void {
    this.loadAppointments(true);
  }

  refreshAvailability(): void {
    this.loadAvailability(true);
  }

  refreshRecords(): void {
    this.loadRecords(true);
  }

  refreshPatients(): void {
    this.loadPatients(true);
  }

  onCreateAvailability(event: DoctorAvailabilityCreateEvent): void {
    if (!this.ensureDoctorSession()) {
      return;
    }
    this.isCreatingAvailability.set(true);
    this.toastService.info('Creando disponibilidad...', { config: { duration: 0 } });

    this.appointmentsService
      .createAvailability({
        doctor_id: this.doctorId as number,
        start_at: event.startAt,
        end_at: event.endAt
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (slot) => {
          this.availability.update((items) =>
            [...items, slot].sort(
              (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
            )
          );
          this.isCreatingAvailability.set(false);
          this.toastService.success('Disponibilidad agregada correctamente.');
        },
        error: (error) => {
          this.isCreatingAvailability.set(false);
          let errorMessage = 'No pudimos agregar la disponibilidad. Reintentá más tarde.';

          if (error.error?.detail) {
            const detail = error.error.detail;
            if (detail.includes('Overlapping availability slot')) {
              errorMessage = 'Ya tenés disponibilidad en este horario. Elegí otro horario o fecha.';
            } else if (detail.includes('Start time must align with block boundaries')) {
              errorMessage = 'El horario de inicio debe ser en punto (ej: 9:00, 10:00, 11:00).';
            } else if (detail.includes('Duration must be a multiple of')) {
              errorMessage = 'La duración debe ser múltiplo de 30 minutos.';
            } else if (detail.includes('Doctor not found')) {
              errorMessage = 'No se encontró el profesional. Recargá la página.';
            } else {
              errorMessage = detail;
            }
          }

          this.toastService.error(errorMessage);
        }
      });
  }

  onUpdateAvailability(event: DoctorAvailabilityUpdateEvent): void {
    if (!this.ensureDoctorSession()) {
      return;
    }
    const isDeleteUnbooked = event.mode === 'delete-unbooked';
    this.availabilityMutationId.set(event.id);
    this.toastService.info(isDeleteUnbooked ? 'Eliminando turnos libres...' : 'Actualizando disponibilidad...', { config: { duration: 0 } });

    const request$ = isDeleteUnbooked
      ? this.appointmentsService.deleteUnbookedAvailability(event.id)
      : this.appointmentsService.updateAvailability(event.id, {});

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.availability.update((items) => {
            // If backend removed the availability or returned empty, drop it
            if (!updated || !updated.blocks || updated.blocks.length === 0) {
              return items.filter((slot) => slot.id !== event.id);
            }

            return items
              .map((slot) => (slot.id === updated.id ? updated : slot))
              .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
          });
          this.availabilityMutationId.set(null);
          this.toastService.success(isDeleteUnbooked ? 'Turnos libres eliminados.' : 'Actualizamos tu disponibilidad.');
        },
        error: (error) => {
          this.availabilityMutationId.set(null);
          const fallback = isDeleteUnbooked ? 'No pudimos eliminar los turnos libres.' : 'No pudimos actualizar la disponibilidad.';
          const detail = error?.error?.detail;
          this.toastService.error(detail || fallback);
        }
      });
  }

  // Record creation is now handled in the modal component

  onUpdateRecord(event: DoctorRecordUpdateEvent): void {
    this.persistRecordChanges(event.recordId, event.changes);
  }

  private loadAppointments(force = false): void {
    if (!this.ensureDoctorSession()) {
      return;
    }
    if (this.isLoadingAppointments() && !force) {
      return;
    }
    this.isLoadingAppointments.set(true);
    this.appointmentsError.set(null);

    this.appointmentsService
      .listForDoctor(this.doctorId as number)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.appointments.set(
            items.sort(
              (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
            )
          );
          this.isLoadingAppointments.set(false);
        },
        error: () => {
          this.isLoadingAppointments.set(false);
          this.toastService.error('No pudimos obtener tus turnos programados.');
        }
      });
  }

  private loadAvailability(force = false): void {
    if (!this.ensureDoctorSession()) {
      return;
    }
    if (this.isLoadingAvailability() && !force) {
      return;
    }
    this.isLoadingAvailability.set(true);
    this.availabilityError.set(null);

    this.appointmentsService
      .listDoctorAvailability(this.doctorId as number)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (slots) => {
          this.availability.set(
            slots.sort(
              (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
            )
          );
          this.isLoadingAvailability.set(false);
        },
        error: () => {
          this.isLoadingAvailability.set(false);
          this.toastService.error('No pudimos cargar tu agenda disponible.');
        }
      });
  }

  private loadRecords(force = false): void {
    if (!this.ensureDoctorSession()) {
      return;
    }
    if (this.isLoadingRecords() && !force) {
      return;
    }
    this.isLoadingRecords.set(true);
    this.recordsError.set(null);

    this.medicalRecordsService
      .listForDoctor(this.doctorId as number)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.records.set(
            items.sort(
              (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )
          );
          this.isLoadingRecords.set(false);
        },
        error: () => {
          this.isLoadingRecords.set(false);
          this.toastService.error('No pudimos obtener tus registros clínicos.');
        }
      });
  }

  private loadPatients(force = false): void {
    if (!this.ensureDoctorSession()) {
      return;
    }
    if (this.isLoadingPatients() && !force) {
      return;
    }
    this.isLoadingPatients.set(true);
    this.patientsError.set(null);

    this.doctorsService
      .getDoctorPatients(this.doctorId as number)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.patients.set(items);
          this.isLoadingPatients.set(false);
        },
        error: () => {
          this.isLoadingPatients.set(false);
          this.toastService.error('No pudimos obtener tus pacientes.');
        }
      });
  }

  private persistRecordChanges(
    recordId: number,
    changes: MedicalRecordUpdateRequest
  ): void {
    if (!this.ensureDoctorSession()) {
      return;
    }
    this.recordMutationId.set(recordId);
    this.toastService.info('Actualizando registro...', { config: { duration: 0 } });

    this.medicalRecordsService
      .updateRecord(recordId, changes)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.records.update((items) =>
            items
              .map((record) => (record.id === updated.id ? updated : record))
              .sort(
                (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
              )
          );
          this.recordMutationId.set(null);
          this.toastService.success('Registro actualizado correctamente.');
        },
        error: () => {
          this.recordMutationId.set(null);
          this.toastService.error('No pudimos actualizar el registro.');
        }
      });
  }

  private ensureDoctorSession(): boolean {
    if (!this.doctorId) {
      this.toastService.error('Reiniciá tu sesión para continuar.');
      return false;
    }
    return true;
  }
}
