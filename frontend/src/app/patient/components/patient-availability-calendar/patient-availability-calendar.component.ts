import { ChangeDetectionStrategy, Component, DestroyRef, Input, Output, EventEmitter, computed, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { DoctorDto } from '../../../core/models/user';
import { AppointmentBlockDto } from '../../../core/models/appointment';

export interface PatientCalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  availableBlocks: AppointmentBlockDto[];
}

@Component({
  selector: 'app-patient-availability-calendar',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './patient-availability-calendar.component.html',
  styleUrl: './patient-availability-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientAvailabilityCalendarComponent {
  @Input() doctors: DoctorDto[] = [];
  @Input() selectedDoctorId: number | null = null;
  @Input() loading = false;
  @Output() doctorChanged = new EventEmitter<number>();
  @Output() appointmentBlockSelected = new EventEmitter<AppointmentBlockDto>();

  private readonly appointmentsService = inject(AppointmentsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentDate = signal(new Date());
  readonly selectedDate = signal<Date | null>(null);
  readonly calendarDays = signal<PatientCalendarDay[]>([]);
  readonly now = new Date();
  readonly selectedDoctor = computed(() => {
    if (!this.selectedDoctorId) return null;
    return this.doctors.find(doctor => doctor.id === this.selectedDoctorId) ?? null;
  });

  readonly currentMonth = computed(() => this.currentDate().getMonth());
  readonly currentYear = computed(() => this.currentDate().getFullYear());
  readonly monthName = computed(() => this.currentDate().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));

  // Calculate date range for API calls (current month + next month)
  readonly dateRange = computed(() => {
    const currentMonth = this.currentMonth();
    const currentYear = this.currentYear();
    
    // Start from first day of current month
    const startDate = new Date(currentYear, currentMonth, 1);
    // End at last day of next month
    const endDate = new Date(currentYear, currentMonth + 2, 0);
    
    return { startDate, endDate };
  });

  readonly calendarDaysComputed = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const today = new Date();
    const { startDate: apiStartDate, endDate: apiEndDate } = this.dateRange();
    
    // Get first day of month and calculate starting date of calendar
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: PatientCalendarDay[] = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.toDateString() === today.toDateString();
      
      // Check if this date is within the API query range
      const isWithinRange = currentDate >= apiStartDate && currentDate <= apiEndDate;
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth,
        isToday,
        availableBlocks: [] // Will be populated from API
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  });

  // Initialize calendar days in constructor
  constructor() {
    this.initializeCalendarDays();
  }

  ngOnInit() {
    if (this.selectedDoctorId) {
      this.loadAvailabilityForDoctor();
    }
  }

  ngOnChanges() {
    if (this.selectedDoctorId) {
      this.loadAvailabilityForDoctor();
    }
  }

  private initializeCalendarDays(): void {
    const initialDays = this.calendarDaysComputed();
    this.calendarDays.set(initialDays);
  }

  private loadAvailabilityForDoctor(): void {
    if (!this.selectedDoctorId) return;

    const { startDate, endDate } = this.dateRange();
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    this.appointmentsService
      .getAvailableBlocks(this.selectedDoctorId, startDateStr, endDateStr)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blocks: AppointmentBlockDto[]) => {
          this.populateBlocksForDays(blocks);
        },
        error: (error) => {
          console.error('Error loading availability blocks:', error);
          // Handle error - could emit an event or set error state
        }
      });
  }

  private populateBlocksForDays(blocks: AppointmentBlockDto[]): void {
    // Update calendar days with available blocks
    const currentDays = this.calendarDays();
    const now = this.now;
    
    const updatedDays = currentDays.map(day => {
      const dayStr = day.date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Filter blocks for this day
      const dayBlocks = blocks.filter(block => {
        const blockDate = new Date(block.startAt).toISOString().split('T')[0];
        return blockDate === dayStr;
      });
      
      // Only include blocks that are in the future (not past)
      const futureBlocks = dayBlocks.filter(block => new Date(block.startAt) > now);
      
      return {
        ...day,
        availableBlocks: futureBlocks
      };
    });
    
    // Update the calendar days
    this.calendarDays.set(updatedDays);
  }

  onDoctorChange(doctorId: number): void {
    this.selectedDoctorId = doctorId;
    this.doctorChanged.emit(doctorId);
  }

  previousMonth(): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() - 1);
    this.currentDate.set(newDate);
    this.initializeCalendarDays();
    this.loadAvailabilityForDoctor();
  }

  nextMonth(): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + 1);
    this.currentDate.set(newDate);
    this.initializeCalendarDays();
    this.loadAvailabilityForDoctor();
  }

  goToToday(): void {
    this.currentDate.set(new Date());
    this.initializeCalendarDays();
    this.loadAvailabilityForDoctor();
  }

  selectDay(day: PatientCalendarDay): void {
    this.selectedDate.set(day.date);
  }

  selectAppointmentBlock(block: AppointmentBlockDto): void {
    // Ensure the block is not in the past
    if (new Date(block.startAt) <= this.now) {
      return;
    }
    
    this.appointmentBlockSelected.emit(block);
  }

  isBlockInPast(block: AppointmentBlockDto): boolean {
    return new Date(block.startAt) <= this.now;
  }

  isDaySelected(day: PatientCalendarDay): boolean {
    return this.selectedDate()?.toDateString() === day.date.toDateString();
  }

  getAvailableBlocksCount(day: PatientCalendarDay): number {
    return day.availableBlocks.filter(block => !this.isBlockInPast(block)).length;
  }

  hasAvailability(day: PatientCalendarDay): boolean {
    return this.getAvailableBlocksCount(day) > 0;
  }

  getBlocksForDay(day: PatientCalendarDay): AppointmentBlockDto[] {
    return day.availableBlocks
      .filter(block => !this.isBlockInPast(block))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }

  isWeekend(day: PatientCalendarDay): boolean {
    const dayOfWeek = day.date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
  }

  isPastDay(day: PatientCalendarDay): boolean {
    return day.date < this.now;
  }

  getBlocksForSelectedDate(): AppointmentBlockDto[] {
    const selectedDate = this.selectedDate();
    if (!selectedDate) return [];
    
    const day = this.calendarDays().find(d => d.date.toDateString() === selectedDate.toDateString());
    return day ? this.getBlocksForDay(day) : [];
  }
}