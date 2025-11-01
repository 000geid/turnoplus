import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../shared/services/toast.service';
import { DoctorsService } from '../../../core/services/doctors.service';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { DateFormatService } from '../../../core/services/date-format.service';
import { DoctorDto } from '../../../core/models/user';
import { AppointmentCreateRequest, AppointmentDto, AppointmentBlockDto } from '../../../core/models/appointment';
import { DoctorAutocompleteComponent } from '../../../shared/components/doctor-autocomplete/doctor-autocomplete.component';
import { SharedCalendarComponent, CalendarDay } from '../../../shared/components/calendar/shared-calendar.component';

@Component({
  selector: 'app-patient-booking',
  standalone: true,
  imports: [
    CommonModule,
    DoctorAutocompleteComponent,
    SharedCalendarComponent
  ],
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
  private readonly destroyRef = inject(DestroyRef);

  readonly doctors = signal<DoctorDto[]>([]);
  readonly selectedDoctor = signal<DoctorDto | null>(null);
  readonly availableBlocks = signal<AppointmentBlockDto[]>([]);
  readonly isLoadingDoctors = signal<boolean>(false);
  readonly isLoadingBlocks = signal<boolean>(false);
  readonly isBooking = signal<boolean>(false);
  readonly selectedCalendarDay = signal<CalendarDay | null>(null);

  // Enhanced data structures for better calendar display
  readonly availabilityByDay = computed(() => {
    const blocks = this.availableBlocks();
    const grouped = new Map<string, AppointmentBlockDto[]>();
    
    blocks.forEach(block => {
      const dateKey = new Date(block.startAt).toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(block);
    });
    
    return grouped;
  });

  readonly now = new Date();

  constructor() {
    this.loadDoctors();
  }

  // Doctor selection handlers
  onDoctorSelected(doctor: DoctorDto | null): void {
    if (doctor) {
      this.selectedDoctor.set(doctor);
      this.selectedCalendarDay.set(null);
      this.loadAvailabilityForDoctor(doctor.id);
      this.toastService.success(`Profesional seleccionado: ${doctor.full_name || doctor.email}`);
    } else {
      this.selectedDoctor.set(null);
      this.availableBlocks.set([]);
      this.selectedCalendarDay.set(null);
    }
  }

  onSearchChanged(searchTerm: string): void {
    // Handle search term changes if needed
    console.log('Doctor search term changed:', searchTerm);
  }

  // Calendar handlers
  onCalendarDaySelected(day: CalendarDay): void {
    this.selectedCalendarDay.set(day);
  }

  onCalendarMonthChanged(date: Date): void {
    const doctor = this.selectedDoctor();
    if (doctor) {
      this.loadAvailabilityForDoctor(doctor.id);
    }
  }

  // Booking handlers
  onAppointmentBlockSelected(block: AppointmentBlockDto): void {
    this.bookAppointmentBlock(block);
  }

  bookAppointmentBlock(block: AppointmentBlockDto): void {
    const doctor = this.selectedDoctor();
    if (!doctor || !this.patientId) {
      this.toastService.error('Faltan datos para reservar el turno.');
      return;
    }

    if (new Date(block.startAt) <= this.now) {
      this.toastService.error('No se puede reservar un turno pasado.');
      return;
    }

    this.isBooking.set(true);
    this.toastService.info('Reservando turno...', { config: { duration: 0 } });

    const payload: AppointmentCreateRequest = {
      doctor_id: doctor.id,
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
          
          // Refresh availability
          setTimeout(() => {
            this.loadAvailabilityForDoctor(doctor.id);
          }, 500);
        },
        error: () => {
          this.isBooking.set(false);
          this.toastService.error('No pudimos reservar el turno. Intentá nuevamente.');
        }
      });
  }

  // Data loading
  private loadDoctors(): void {
    this.isLoadingDoctors.set(true);
    this.doctorsService
      .listDoctors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doctors) => {
          this.doctors.set(doctors);
          this.isLoadingDoctors.set(false);
        },
        error: () => {
          this.isLoadingDoctors.set(false);
          this.toastService.error('No pudimos obtener la lista de profesionales.');
        }
      });
  }

  private loadAvailabilityForDoctor(doctorId: number): void {
    this.isLoadingBlocks.set(true);
    
    // Get blocks for the next 60 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 60);
    
    this.appointmentsService
      .getAvailableBlocks(
        doctorId,
        startDate.toISOString(),
        endDate.toISOString()
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blocks) => {
          // Filter out past blocks
          const futureBlocks = blocks.filter(block => 
            new Date(block.startAt) > this.now
          );
          this.availableBlocks.set(futureBlocks);
          this.isLoadingBlocks.set(false);
        },
        error: () => {
          this.isLoadingBlocks.set(false);
          this.toastService.error('No pudimos cargar la disponibilidad del profesional.');
        }
      });
  }

  // Utility methods
  formatDateSpanish(dateString: string): string {
    return this.dateFormatService.formatDayMonth(dateString);
  }

  formatTimeSpanish(dateString: string): string {
    return this.dateFormatService.formatTime(dateString);
  }

  getSelectedDayBlocks(): AppointmentBlockDto[] {
    const selectedDay = this.selectedCalendarDay();
    if (!selectedDay) return [];

    return this.availableBlocks()
      .filter(block => {
        const blockDate = new Date(block.startAt).toDateString();
        return blockDate === selectedDay.date.toDateString();
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }

  isBlockInPast(block: AppointmentBlockDto): boolean {
    return new Date(block.startAt) <= this.now;
  }

  // Enhanced helper methods for better UX
  getAvailableSlotsForDay(date: Date): AppointmentBlockDto[] {
    const dateKey = date.toDateString();
    return this.availableBlocks().filter(block => {
      const blockDateKey = new Date(block.startAt).toDateString();
      return blockDateKey === dateKey;
    }).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }

  getFirstAvailableDay(): Date | null {
    const blocks = this.availableBlocks();
    if (blocks.length === 0) return null;
    
    const sortedBlocks = blocks.sort((a, b) =>
      new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
    return new Date(sortedBlocks[0].startAt);
  }

  navigateToNextAvailableDay(): void {
    const firstAvailable = this.getFirstAvailableDay();
    if (firstAvailable) {
      // Set the calendar to show the month of the first available day
      const calendar = document.querySelector('app-shared-calendar');
      if (calendar) {
        // This would need to be implemented in the calendar component itself
        console.log('Navigate to next available day:', firstAvailable);
      }
    }
  }

  getQuickAvailabilitySummary(): { today: number; week: number; month: number } {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const today = this.availableBlocks().filter(block => {
      const blockDate = new Date(block.startAt);
      return blockDate.toDateString() === now.toDateString();
    }).length;

    const week = this.availableBlocks().filter(block => {
      const blockDate = new Date(block.startAt);
      return blockDate >= now && blockDate <= weekFromNow;
    }).length;

    const month = this.availableBlocks().filter(block => {
      const blockDate = new Date(block.startAt);
      return blockDate >= now && blockDate <= monthFromNow;
    }).length;

    return { today, week, month };
  }

  getDoctorAvailabilityMap(): Map<number, number> {
    const availabilityMap = new Map<number, number>();
    
    // For now, since we're only showing availability for the selected doctor,
    // we'll set the availability for the selected doctor only
    const selectedDoctor = this.selectedDoctor();
    if (selectedDoctor) {
      // Count all available blocks for the selected doctor
      availabilityMap.set(selectedDoctor.id, this.availableBlocks().length);
    }
    
    // In the future, this could be enhanced to show availability for all doctors
    // by fetching availability data for each doctor in the doctors list
    
    return availabilityMap;
  }
}