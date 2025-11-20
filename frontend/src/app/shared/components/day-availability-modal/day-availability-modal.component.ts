import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
  inject
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { AppointmentBlockDto, AvailabilityDto } from '../../../core/models/appointment';
import { DoctorDto } from '../../../core/models/user';
import { DateFormatService } from '../../../core/services/date-format.service';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { ToastService } from '../../services/toast.service';

export interface DayAvailabilityModalData {
  date: Date;
  mode: 'patient' | 'doctor';
  availabilityData: AppointmentBlockDto[] | AvailabilityDto[];
  doctorInfo?: DoctorDto | null;
  patientId?: number;
}

export interface DayAvailabilityModalCloseEvent {
  type: 'close' | 'appointmentBooked' | 'availabilityConfigured' | 'availabilityDeleted';
  data?: any;
}

export interface AppointmentSlot {
  id?: number;
  startAt: string;
  endAt: string;
  isBooked?: boolean;
  isAvailable?: boolean;
  doctorId?: number;
  doctorName?: string;
  totalBlocks?: number;
  availableBlocks?: number;
  isPastSlot?: boolean;
  [key: string]: any; // Allow additional properties for flexibility
}

@Component({
  selector: 'app-day-availability-modal',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './day-availability-modal.component.html',
  styleUrl: './day-availability-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DayAvailabilityModalComponent {
  @Input() data!: DayAvailabilityModalData;
  @Output() modalClose = new EventEmitter<DayAvailabilityModalCloseEvent>();

  private readonly dateFormatService = inject(DateFormatService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly toastService = inject(ToastService);

  readonly isPatientMode = computed(() => this.data.mode === 'patient');
  readonly isDoctorMode = computed(() => this.data.mode === 'doctor');
  
  // Patient mode state
  readonly isBooking = signal<boolean>(false);
  
  // Doctor mode state
  readonly isDeleting = signal<boolean>(false);
  readonly selectedSlotForDelete = signal<AvailabilityDto | null>(null);

  // Computed properties
  readonly formattedDate = computed(() => {
    return this.data.date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  });

  readonly modalTitle = computed(() => {
    if (this.isPatientMode()) {
      return `Turnos disponibles`;
    } else {
      return `Disponibilidad del día`;
    }
  });

  // Process availability data based on mode
  readonly processedSlots = computed(() => {
    if (this.isPatientMode()) {
      // For patient mode, we expect AppointmentBlockDto[]
      const blocks = this.data.availabilityData as AppointmentBlockDto[];
      return blocks
        .filter(block => {
          const blockDate = new Date(block.startAt).toDateString();
          const selectedDate = this.data.date.toDateString();
          return blockDate === selectedDate;
        })
        .map(block => ({
          id: block.id,
          startAt: block.startAt,
          endAt: block.endAt,
          isBooked: block.isBooked || false,
          isAvailable: !block.isBooked,
          doctorId: this.data.doctorInfo?.id,
          doctorName: this.data.doctorInfo?.full_name || this.data.doctorInfo?.email
        }))
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    } else {
      // For doctor mode, we expect AvailabilityDto[]
      const availability = this.data.availabilityData as AvailabilityDto[];
      return availability
        .filter(avail => {
          // Fix date comparison to handle timezone properly
          const availDate = new Date(avail.startAt);
          const selectedDate = new Date(this.data.date);
          
          // Compare dates without time to ensure proper matching
          const availDateOnly = new Date(availDate.getFullYear(), availDate.getMonth(), availDate.getDate());
          const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
          
          return availDateOnly.getTime() === selectedDateOnly.getTime();
        })
        .map(avail => {
          // Ensure blocks array exists
          const blocks = avail.blocks || [];
          const availableBlocks = blocks.filter(block => !block.isBooked);
          const isPastSlot = new Date(avail.startAt) < new Date();
          
          return {
            id: avail.id,
            startAt: avail.startAt,
            endAt: avail.endAt,
            isBooked: false, // We'll check blocks for actual booking status
            isAvailable: true,
            totalBlocks: blocks.length,
            availableBlocks: availableBlocks.length,
            isPastSlot: isPastSlot,
            blocks: blocks // Include blocks for detailed view
          };
        })
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    }
  });

  readonly hasSlots = computed(() => this.processedSlots().length > 0);

readonly totalSlots = computed(() => this.processedSlots().length);
readonly availableSlots = computed(() =>
  this.processedSlots().filter(slot =>
    this.isPatientMode() ? slot.isAvailable : slot.isAvailable && !this.getSlotIsPastSlot(slot)
  ).length
);

readonly totalAvailableBlocks = computed(() => {
  if (this.isPatientMode()) {
    return 0; // Not used in patient mode
  } else {
    return this.processedSlots().reduce((sum, slot) => sum + this.getSlotAvailableBlocks(slot), 0);
  }
});

  // Helper methods
  formatTimeSpanish(dateString: string): string {
    return this.dateFormatService.formatTime(dateString);
  }

  formatDateShort(dateString: string): string {
    return this.dateFormatService.formatDayMonth(dateString);
  }

  isSlotInPast(slot: AppointmentSlot): boolean {
    return new Date(slot.startAt) < new Date();
  }

  // Safe property access methods for template
  getSlotIsPastSlot(slot: AppointmentSlot): boolean {
    return Boolean((slot as any).isPastSlot);
  }

  getSlotTotalBlocks(slot: AppointmentSlot): number {
    return Number((slot as any).totalBlocks || 0);
  }

  getSlotAvailableBlocks(slot: AppointmentSlot): number {
    return Number((slot as any).availableBlocks || 0);
  }

  // Patient mode methods
  onAppointmentBooked(slot: AppointmentSlot): void {
    if (this.isBooking() || !this.data.patientId || !this.data.doctorInfo) {
      return;
    }

    if (this.isSlotInPast(slot)) {
      this.toastService.error('No se puede reservar un turno pasado.');
      return;
    }

    this.isBooking.set(true);
    this.toastService.info('Reservando turno...', { config: { duration: 0 } });

    const payload = {
      doctor_id: slot.doctorId!,
      patient_id: this.data.patientId,
      start_at: new Date(slot.startAt).toISOString(),
      end_at: new Date(slot.endAt).toISOString()
    };

    this.appointmentsService
      .book(payload)
      .subscribe({
        next: (appointment) => {
          this.isBooking.set(false);
          this.toastService.success('¡Turno reservado con éxito!');
          this.modalClose.emit({
            type: 'appointmentBooked',
            data: appointment
          });
        },
        error: () => {
          this.isBooking.set(false);
          this.toastService.error('No pudimos reservar el turno. Intentá nuevamente.');
        }
      });
  }

  // Doctor mode methods
  onConfigureAvailability(): void {
    // Pre-configure the date for the availability creation form
    this.modalClose.emit({
      type: 'availabilityConfigured',
      data: {
        date: this.data.date
      }
    });
  }

onDeleteSlot(slot: AppointmentSlot): void {
    if (!slot.id || this.isDeleting()) {
      return;
    }

    // Create a proper AvailabilityDto with all required properties
    const availabilityToDelete: AvailabilityDto = {
      id: slot.id,
      doctor_id: 0, // Default value, should be set by parent component
      startAt: slot.startAt,
      endAt: slot.endAt,
      slots: 0, // Default value, should be set by parent component
      blocks: (slot as any).blocks || []
    };

    this.selectedSlotForDelete.set(availabilityToDelete);
  }

  confirmDeleteSlot(): void {
    const slot = this.selectedSlotForDelete();
    if (!slot) {
      return;
    }

    this.isDeleting.set(true);
    
    // This would need to be implemented in the parent component
    // For now, we'll emit the event to be handled by the parent
    this.modalClose.emit({
      type: 'availabilityDeleted',
      data: slot
    });

    this.isDeleting.set(false);
    this.selectedSlotForDelete.set(null);
  }

  cancelDeleteSlot(): void {
    this.selectedSlotForDelete.set(null);
  }

  // Modal methods
  onClose(): void {
    this.modalClose.emit({ type: 'close' });
  }

  // Keyboard accessibility
    onKeydown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        this.onClose();
      }
    }
  
    // Helper method for template range generation
    getRangeArray(count: number): number[] {
      return Array.from({ length: count }, (_, i) => i);
    }
  }