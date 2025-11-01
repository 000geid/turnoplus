import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorDto } from '../../../core/models/user';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  doctors: DoctorDto[];
}

@Component({
  selector: 'app-doctor-selection-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-selection-calendar.component.html',
  styleUrl: './doctor-selection-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoctorSelectionCalendarComponent {
  @Input() doctors: DoctorDto[] = [];
  @Input() selectedDoctorId: number | null = null;
  @Input() isLoadingDoctors = false;
  @Input() doctorAvailabilityMap: Map<number, number> = new Map(); // doctorId -> availability count
  @Output() doctorSelected = new EventEmitter<DoctorDto>();
  @Output() viewModeChanged = new EventEmitter<'grid' | 'calendar'>();

  readonly viewMode = signal<'grid' | 'calendar'>('calendar');
  readonly currentDate = signal(new Date());
  readonly selectedDate = signal<Date | null>(null);
  readonly searchTerm = signal('');
  readonly selectedSpecialty = signal('');

  readonly currentMonth = computed(() => this.currentDate().getMonth());
  readonly currentYear = computed(() => this.currentDate().getFullYear());
  readonly monthName = computed(() => 
    this.currentDate().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  );

  readonly uniqueSpecialties = computed(() => {
    const specialties = new Set<string>();
    this.doctors.forEach(doctor => {
      if (doctor.specialty) {
        specialties.add(doctor.specialty);
      }
    });
    return Array.from(specialties).sort();
  });

  readonly filteredDoctors = computed(() => {
    let filtered = [...this.doctors];

    // First, filter out doctors without availability
    filtered = filtered.filter(doctor => this.hasDoctorAvailability(doctor.id));

    // Filter by specialty
    if (this.selectedSpecialty()) {
      filtered = filtered.filter(doctor =>
        doctor.specialty === this.selectedSpecialty()
      );
    }

    // Filter by search term
    const searchTerm = this.searchTerm().toLowerCase().trim();
    if (searchTerm) {
      filtered = filtered.filter(doctor => {
        const name = doctor.full_name?.toLowerCase() || doctor.email?.toLowerCase() || '';
        const specialty = doctor.specialty?.toLowerCase() || '';
        return name.includes(searchTerm) || specialty.includes(searchTerm);
      });
    }

    // Sort by name only (all doctors now have availability)
    return filtered.sort((a, b) => {
      const aName = a.full_name || a.email || '';
      const bName = b.full_name || b.email || '';
      return aName.localeCompare(bName);
    });
  });

  readonly calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const today = new Date();
    
    // Get first day of month and calculate starting date of calendar
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Start on Monday
    
    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.toDateString() === today.toDateString();
      
      // Find doctors available for this day - only show doctors with availability
      const dayDoctors = this.filteredDoctors().filter(doctor => {
        // Only include doctors who have availability
        return this.hasDoctorAvailability(doctor.id);
      });
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth,
        isToday,
        doctors: dayDoctors
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  });

  onViewModeChange(mode: 'grid' | 'calendar'): void {
    this.viewMode.set(mode);
    this.viewModeChanged.emit(mode);
  }

  onSpecialtyChange(): void {
    // Specialty filtering is handled by the computed filteredDoctors
  }

  onSearchChange(): void {
    // Search filtering is handled by the computed filteredDoctors
  }

  selectDoctor(doctor: DoctorDto): void {
    this.doctorSelected.emit(doctor);
  }

  isDoctorSelected(doctorId: number): boolean {
    return this.selectedDoctorId === doctorId;
  }

  hasDoctorAvailability(doctorId: number): boolean {
    return (this.doctorAvailabilityMap.get(doctorId) || 0) > 0;
  }

  getDoctorAvailabilityCount(doctorId: number): number {
    return this.doctorAvailabilityMap.get(doctorId) || 0;
  }

  getDoctorInitials(doctor: DoctorDto): string {
    if (doctor.full_name) {
      return doctor.full_name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }
    
    if (doctor.email) {
      return doctor.email.charAt(0).toUpperCase();
    }
    
    return 'DR';
  }

  previousMonth(): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() - 1);
    this.currentDate.set(newDate);
  }

  nextMonth(): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + 1);
    this.currentDate.set(newDate);
  }

  getDoctorsForDay(day: CalendarDay): DoctorDto[] {
    return day.doctors;
  }

  hasDayAvailability(day: CalendarDay): boolean {
    return day.doctors.some(doctor => this.hasDoctorAvailability(doctor.id));
  }

  getDoctorsForSelectedDate(): DoctorDto[] {
    const selectedDate = this.selectedDate();
    if (!selectedDate) return [];
    
    const day = this.calendarDays().find(d => 
      d.date.toDateString() === selectedDate.toDateString()
    );
    
    return day ? day.doctors : [];
  }
}