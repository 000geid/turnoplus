import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { AppointmentDto, AppointmentStatus } from '../../../core/models/appointment';
import { DateFormatService } from '../../../core/services/date-format.service';
import { DatePeriodService } from '../../../core/services/date-period.service';
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
  private readonly doctorNames = signal<Record<number, string>>({});

  @Input()
  set appointments(value: ReadonlyArray<AppointmentDto>) {
    this._appointments = value;
    this.groupedAppointments.set(this.datePeriodService.groupAppointmentsByTimePeriod([...value]));
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

  // Time period filtering
  readonly selectedTimePeriod = signal<string>('all');
  readonly groupedAppointments = signal<Record<string, AppointmentDto[]>>({});

  constructor(
    private dateFormatService: DateFormatService,
    private datePeriodService: DatePeriodService,
    private doctorService: DoctorService
  ) {}

  protected readonly statusLabels: Record<AppointmentStatus, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    canceled: 'Cancelado',
    completed: 'Completado'
  };

  readonly timePeriods = [
    { id: 'all', label: 'Todos' },
    { id: 'today', label: 'Hoy' },
    { id: 'thisWeek', label: 'Esta Semana' },
    { id: 'nextWeek', label: 'Próxima Semana' },
    { id: 'thisMonth', label: 'Este Mes' },
    { id: 'nextMonth', label: 'Próximo Mes' },
    { id: 'past', label: 'Anteriores' }
  ];

  readonly filteredAppointments = computed(() => {
    const selectedPeriod = this.selectedTimePeriod();
    const grouped = this.groupedAppointments();
    
    if (selectedPeriod === 'all') {
      return grouped['all'] || [];
    }
    
    return grouped[selectedPeriod] || [];
  });

  readonly hasAppointmentsInPeriod = computed(() => {
    return this.filteredAppointments().length > 0;
  });

  readonly currentPeriodLabel = computed(() => {
    const selectedPeriod = this.selectedTimePeriod();
    const period = this.timePeriods.find(p => p.id === selectedPeriod);
    return period?.label || 'Todos';
  });

  onCancel(id: number): void {
    this.cancel.emit(id);
  }

  onConfirm(id: number): void {
    this.confirm.emit(id);
  }

  onTimePeriodChange(period: string): void {
    this.selectedTimePeriod.set(period);
  }

  isActionDisabled(id: number, status: AppointmentStatus): boolean {
    if (status === 'canceled' || status === 'completed') {
      return true;
    }
    return this.actionId === id;
  }

  getDoctorName(doctorId: number): string {
    const names = this.doctorNames();
    if (names[doctorId]) {
      return names[doctorId];
    }
    const doctor = this.doctorCache.get(doctorId);
    return doctor?.full_name || doctor?.email || `Doctor #${doctorId}`;
  }

  formatDateSpanish(dateString: string): string {
    return this.dateFormatService.formatDayMonth(dateString);
  }

  formatTimeSpanish(dateString: string): string {
    return this.dateFormatService.formatTime(dateString);
  }

  getAppointmentStatusClass(appointment: AppointmentDto): string {
    if (this.datePeriodService.isAppointmentPast(appointment) && appointment.status !== 'completed') {
      return 'status-past';
    }
    if (this.datePeriodService.isAppointmentToday(appointment)) {
      return 'status-today';
    }
    return `status-${appointment.status}`;
  }

  getTimePeriodCount(period: string): number {
    const grouped = this.groupedAppointments();
    return grouped[period]?.length || 0;
  }

  private async prefetchDoctorData(): Promise<void> {
    const uniqueDoctorIds = [...new Set(this._appointments.map(a => a.doctor_id))];
    
    for (const doctorId of uniqueDoctorIds) {
      if (this.doctorNames()[doctorId]) {
        continue;
      }
      try {
        const doctor = await firstValueFrom(this.doctorService.getDoctor(doctorId));
        this.doctorCache.set(doctorId, doctor);
        const displayName = doctor.full_name || doctor.email || `Doctor #${doctorId}`;
        this.doctorNames.update((names) => ({
          ...names,
          [doctorId]: displayName
        }));
      } catch (error) {
        console.error(`Error fetching doctor ${doctorId}:`, error);
        const fallback = `Doctor #${doctorId}`;
        this.doctorCache.set(doctorId, {
          id: doctorId,
          full_name: fallback,
          email: '',
          is_active: false,
          is_superuser: false,
          role: 'doctor'
        } as DoctorDto);
        this.doctorNames.update((names) => ({
          ...names,
          [doctorId]: fallback
        }));
      }
    }
  }
}
