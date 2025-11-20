import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PatientDto } from '../../../core/models/user';
import { AppointmentDto } from '../../../core/models/appointment';
import { MedicalRecordDto } from '../../../core/models/medical-record';

import { AppointmentSummaryCardComponent } from './appointment-summary-card/appointment-summary-card.component';
import { QuickActionsCardComponent } from './quick-actions-card/quick-actions-card.component';
import { MedicalRecordsPreviewComponent } from './medical-records-preview/medical-records-preview.component';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    AppointmentSummaryCardComponent,
    QuickActionsCardComponent,
    MedicalRecordsPreviewComponent
  ],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientDashboardComponent {
  private readonly router = inject(Router);

  // Input signals
  readonly profile = input<PatientDto | null>(null);
  readonly appointments = input<AppointmentDto[]>([]);
  readonly medicalRecords = input<MedicalRecordDto[]>([]);
  readonly isLoadingProfile = input<boolean>(false);
  readonly isLoadingAppointments = input<boolean>(false);
  readonly isLoadingRecords = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  // Computed signals for dashboard data
  readonly upcomingAppointments = computed(() => {
    const now = new Date();
    return this.appointments()
      .filter(apt => new Date(apt.startAt) > now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  });

  readonly nextAppointment = computed(() => this.upcomingAppointments()[0] || null);

  readonly recentMedicalRecords = computed(() => {
    return this.medicalRecords()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  });

  readonly appointmentStats = computed(() => {
    const now = new Date();
    const appointments = this.appointments();

    return {
      total: appointments.length,
      upcoming: appointments.filter(apt => new Date(apt.startAt) > now).length,
      pending: appointments.filter(apt => apt.status === 'pending').length,
      confirmed: appointments.filter(apt => apt.status === 'confirmed').length
    };
  });

  // Navigation methods
  navigateToAppointments(): void {
    this.router.navigate(['/patient/appointments']);
  }

  navigateToBooking(): void {
    this.router.navigate(['/patient/booking']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/patient/profile']);
  }

  navigateToMedicalRecords(): void {
    this.router.navigate(['/patient/records']);
  }

  // Get patient name for greeting
  readonly patientName = computed(() => {
    const patient = this.profile();
    if (!patient) return 'Bienvenido';

    return patient.full_name || 'Bienvenido';
  });

  // Get greeting based on time of day
  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    const name = this.patientName();

    if (hour < 12) {
      return `¡Buenos días, ${name}!`;
    } else if (hour < 18) {
      return `¡Buenas tardes, ${name}!`;
    } else {
      return `¡Buenas noches, ${name}!`;
    }
  });
}