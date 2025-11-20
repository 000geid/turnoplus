import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

import { AppointmentDto } from '../../../../core/models/appointment';

@Component({
  selector: 'app-appointment-summary-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './appointment-summary-card.component.html',
  styleUrl: './appointment-summary-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentSummaryCardComponent {
  readonly appointment = input.required<AppointmentDto>();
  readonly patientName = input.required<string>();

  constructor(private datePipe: DatePipe) {}

  get formattedDate(): string {
    return this.datePipe.transform(this.appointment().startAt, 'EEEE, d \'de\' MMMM', 'es-ES') || '';
  }

  get formattedTime(): string {
    return this.datePipe.transform(this.appointment().startAt, 'HH:mm', 'es-ES') || '';
  }

  get doctorFullName(): string {
    // Since we don't have nested doctor data in AppointmentDto, we'll use a placeholder
    return 'Médico';
  }

  get doctorSpecialty(): string {
    return 'Medicina General';
  }

  get officeName(): string {
    return 'Consultorio';
  }

  get isToday(): boolean {
    const today = new Date();
    const appointmentDate = new Date(this.appointment().startAt);

    return today.toDateString() === appointmentDate.toDateString();
  }

  get isTomorrow(): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const appointmentDate = new Date(this.appointment().startAt);

    return tomorrow.toDateString() === appointmentDate.toDateString();
  }

  get timeDescription(): string {
    if (this.isToday) {
      return 'Hoy';
    } else if (this.isTomorrow) {
      return 'Mañana';
    } else {
      return this.formattedDate;
    }
  }
}