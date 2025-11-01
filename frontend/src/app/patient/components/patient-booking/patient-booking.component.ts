import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '../../../shared/services/toast.service';
import { DoctorsService } from '../../../core/services/doctors.service';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { DateFormatService } from '../../../core/services/date-format.service';
import { DoctorDto } from '../../../core/models/user';
import { AppointmentCreateRequest, AppointmentDto, AvailabilityDto, AppointmentBlockDto } from '../../../core/models/appointment';
import { PatientAvailabilityCalendarComponent, PatientCalendarDay } from '../patient-availability-calendar/patient-availability-calendar.component';
import { DoctorSelectionCalendarComponent } from '../doctor-selection-calendar/doctor-selection-calendar.component';

interface AppointmentSlot {
  id: string;
  startAt: Date;
  endAt: Date;
  availabilityId: number;
  blockId?: number;
}

@Component({
  selector: 'app-patient-booking',
  standalone: true,
imports: [ReactiveFormsModule, PatientAvailabilityCalendarComponent, DoctorSelectionCalendarComponent],
  templateUrl: './patient-booking.component.html',
  styleUrl: './patient-booking.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientBookingComponent {
  @Input() patientId: number | null = null;
  @Output() booked = new EventEmitter<AppointmentDto>();

  private readonly doctorsService = inject(DoctorsService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly dateFormatService = inject(DateFormatService);
  private readonly toastService = inject(ToastService);
  private readonly fb = new FormBuilder();
  private readonly destroyRef = inject(DestroyRef);

  readonly selectionForm = this.fb.group({
    doctorId: ['']
  });

  readonly doctors = signal<DoctorDto[]>([]);
  readonly availability = signal<AvailabilityDto[]>([]);
  readonly availableBlocks = signal<AppointmentBlockDto[]>([]);
  readonly doctorAvailabilityMap = signal<Map<number, number>>(new Map());
  readonly appointmentSlots = signal<AppointmentSlot[]>([]);
  readonly isLoadingDoctors = signal<boolean>(false);
  readonly isLoadingAvailability = signal<boolean>(false);
  readonly isLoadingBlocks = signal<boolean>(false);
  readonly isBooking = signal<boolean>(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly viewMode = signal<'list' | 'calendar'>('calendar'); // Toggle between list and calendar view

  readonly selectedDoctor = computed(() => {
    const formValue = this.selectionForm.controls.doctorId.value;
    
    console.log('=== selectedDoctor computed ===');
    console.log('Form value:', formValue);
    console.log('Doctors count:', this.doctors().length);
    
    // Clear error message when doctor is selected
    if (formValue && formValue !== '' && this.doctors().length > 0) {
      this.error.set(null);
      this.message.set(null);
    }
    
    if (!formValue || formValue === '' || !this.doctors().length) {
      console.log('Early return: missing form value or doctors not loaded');
      return null;
    }
    
    // Parse doctor ID and validate
    const doctorId = parseInt(formValue, 10);
    console.log('Parsed doctor ID:', doctorId);
    
    if (isNaN(doctorId) || doctorId <= 0) {
      console.log('Invalid doctor ID:', doctorId);
      return null;
    }
    
    // Find doctor by ID
    const doctor = this.doctors().find(d => d.id === doctorId);
    console.log('Found doctor:', doctor);
    console.log('=== end selectedDoctor ===');
    
    return doctor || null;
  });

  readonly selectedDoctorId = computed(() => {
    const formValue = this.selectionForm.controls.doctorId.value;
    
    console.log('=== selectedDoctorId computed ===');
    console.log('Form value:', formValue);
    
    if (!formValue || formValue === '') {
      return null;
    }
    
    const doctorId = parseInt(formValue, 10);
    const result = (isNaN(doctorId) || doctorId <= 0) ? null : doctorId;
    console.log('Selected doctor ID result:', result);
    console.log('=== end selectedDoctorId ===');
    
    return result;
  });

  constructor() {
    this.selectionForm.controls.doctorId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        if (id && id !== '') {
          const doctorId = parseInt(id, 10);
          if (doctorId > 0) {
            this.loadAvailability(doctorId);
          }
        }
      });
      this.loadDoctors();
    }
  
    // New methods for calendar integration
    onDoctorSelected(doctor: DoctorDto): void {
      // Update the form and trigger the existing loading logic
      this.selectionForm.controls.doctorId.setValue(doctor.id.toString());
      this.toastService.success(`Profesional seleccionado: ${doctor.full_name || doctor.email}`);
    }

    onViewModeChanged(mode: 'grid' | 'calendar'): void {
      // Handle view mode changes from the doctor selection calendar
      console.log('Doctor selection calendar view mode changed:', mode);
    }

    onViewModeChange(mode: 'list' | 'calendar'): void {
      this.viewMode.set(mode);
    }
  
    onCalendarDoctorChange(doctorId: number): void {
      // Update the form and trigger the existing loading logic
      this.selectionForm.controls.doctorId.setValue(doctorId.toString());
    }
  
    onCalendarAppointmentBlockSelected(block: AppointmentBlockDto): void {
      // Use the existing bookBlock method to handle the booking
      this.bookBlock(block);
    }
  
    bookBlock(block: AppointmentBlockDto): void {
      if (!this.patientId) {
        this.toastService.error('Necesitamos tu sesión para reservar un turno. Ingresá nuevamente.');
        return;
      }
      
      // Debug doctor selection
      const formValue = this.selectionForm.controls.doctorId.value;
      const doctor = this.selectedDoctor();
      const doctorId = this.selectedDoctorId();
      const doctorsCount = this.doctors().length;
      
      console.log('=== BOOKING DEBUG ===');
      console.log('Form value:', formValue);
      console.log('Selected doctor:', doctor);
      console.log('Selected doctor ID:', doctorId);
      console.log('Doctors count:', doctorsCount);
      console.log('Doctors array:', this.doctors());
      console.log('Block to book:', block);
      console.log('====================');
      
      if (!doctor || !doctorId) {
        console.error('Doctor selection validation failed:', {
          formValue,
          doctor,
          doctorId,
          doctorsCount,
          doctorsArray: this.doctors().slice(0, 3), // First 3 for readability
          formValid: this.selectionForm.valid,
          formErrors: this.selectionForm.errors
        });
        this.toastService.error('Seleccioná un profesional antes de reservar.');
        return;
      }

    this.isBooking.set(true);
    this.toastService.info('Reservando turno...', { config: { duration: 0 } });
    this.error.set(null);
    this.message.set(null);

    const payload: AppointmentCreateRequest = {
      doctor_id: doctorId,
      patient_id: this.patientId,
      start_at: new Date(block.startAt).toISOString(),
      end_at: new Date(block.endAt).toISOString()
    };

    this.appointmentsService
      .book(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (appointment) => {
          this.isBooking.set(false);
          this.toastService.success('¡Turno reservado con éxito!');
          this.booked.emit(appointment);
          
          // Add a small delay to ensure backend has committed the transaction
          setTimeout(() => {
            this.loadAvailability(doctor.id);
            this.loadAvailableBlocks(doctor.id);
          }, 500);
        },
        error: () => {
          this.isBooking.set(false);
          this.toastService.error('No pudimos reservar el turno. Intentá nuevamente.');
        }
      });
  }

  private loadDoctors(): void {
    this.isLoadingDoctors.set(true);
    this.doctorsService
      .listDoctors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doctors) => {
          this.doctors.set(doctors);
          this.loadAllDoctorsAvailability(doctors);
          this.isLoadingDoctors.set(false);
        },
        error: () => {
          this.isLoadingDoctors.set(false);
          this.toastService.error('No pudimos obtener la lista de profesionales.');
        }
      });
  }

  private loadAvailability(doctorId: number): void {
    this.isLoadingAvailability.set(true);
    this.appointmentsService
      .listDoctorAvailability(doctorId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (slots) => {
          this.availability.set(slots);
          this.isLoadingAvailability.set(false);
          this.loadAvailableBlocks(doctorId);
        },
        error: () => {
          this.toastService.error('No pudimos cargar la disponibilidad de este profesional.');
          this.isLoadingAvailability.set(false);
        }
      });
  }

  private loadAvailableBlocks(doctorId: number): void {
    this.isLoadingBlocks.set(true);
    
    // Get blocks for the next 30 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    this.appointmentsService
      .getAvailableBlocks(
        doctorId,
        startDate.toISOString(),
        endDate.toISOString()
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blocks) => {
          this.availableBlocks.set(blocks);
          
          // Update doctor availability map using the selected doctor from form
          const doctorId = this.selectedDoctorId();
          if (doctorId) {
            const availabilityMap = new Map<number, number>();
            availabilityMap.set(doctorId, blocks.length);
            this.doctorAvailabilityMap.set(availabilityMap);
          }
          
          this.isLoadingBlocks.set(false);
        },
        error: () => {
          this.isLoadingBlocks.set(false);
          console.error('Error loading available blocks');
        }
      });
  }

  formatDateSpanish(dateString: string): string {
    return this.dateFormatService.formatDayMonth(dateString);
  }

  formatTimeSpanish(dateString: string): string {
    return this.dateFormatService.formatTime(dateString);
  }

  private loadAllDoctorsAvailability(doctors: DoctorDto[]): void {
    // Initialize availability map for all doctors
    const availabilityMap = new Map<number, number>();
    doctors.forEach(doctor => {
      availabilityMap.set(doctor.id, 0);
    });
    this.doctorAvailabilityMap.set(availabilityMap);
  }
}
