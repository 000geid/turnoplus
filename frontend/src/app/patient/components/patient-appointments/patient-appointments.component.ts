import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { AppointmentDto, AppointmentStatus } from '../../../core/models/appointment';
import { DateFormatService } from '../../../core/services/date-format.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { DoctorDto } from '../../../core/models/user';

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './patient-appointments.component.html',
  styleUrl: './patient-appointments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientAppointmentsComponent {
  private _appointments: ReadonlyArray<AppointmentDto> = [];
  private doctorCache = new Map<number, DoctorDto>();

  @Input()
  set appointments(value: ReadonlyArray<AppointmentDto>) {
    this._appointments = value;
    if (value.length > 0) {
      this.prefetchDoctorData();
    }
  }

  get appointments(): ReadonlyArray<AppointmentDto> {
    return this._appointments;
  }

  @Input() loading = false;
  @Input() actionId: number | null = null;
  @Output() cancel = new EventEmitter<number>();
  @Output() confirm = new EventEmitter<number>();

  constructor(
    private dateFormatService: DateFormatService,
    private doctorService: DoctorService
  ) {}

  protected readonly statusLabels: Record<AppointmentStatus, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    canceled: 'Cancelado',
    completed: 'Completado'
  };

  onCancel(id: number): void {
    this.cancel.emit(id);
  }

  onConfirm(id: number): void {
    this.confirm.emit(id);
  }

  isActionDisabled(id: number, status: AppointmentStatus): boolean {
    if (status === 'canceled' || status === 'completed') {
      return true;
    }
    return this.actionId === id;
  }

  getDoctorName(doctorId: number): string {
    const doctor = this.doctorCache.get(doctorId);
    return doctor?.full_name || `Doctor #${doctorId}`;
  }

  formatDateSpanish(dateString: string): string {
    return this.dateFormatService.formatDayMonth(dateString);
  }

  formatTimeSpanish(dateString: string): string {
    return this.dateFormatService.formatTime(dateString);
  }

  private async prefetchDoctorData(): Promise<void> {
    const uniqueDoctorIds = [...new Set(this._appointments.map(a => a.doctor_id))];
    
    for (const doctorId of uniqueDoctorIds) {
      if (!this.doctorCache.has(doctorId)) {
        try {
          const doctor = await firstValueFrom(this.doctorService.getDoctor(doctorId));
          this.doctorCache.set(doctorId, doctor);
        } catch (error) {
          console.error(`Error fetching doctor ${doctorId}:`, error);
          // Set a placeholder to avoid repeated failed requests
          this.doctorCache.set(doctorId, { id: doctorId, full_name: `Doctor #${doctorId}`, email: '', is_active: false, is_superuser: false, role: 'doctor' } as DoctorDto);
        }
      }
    }
  }
}
