import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  data?: any; // Flexible data for the day
}

export type CalendarMode = 'doctor' | 'availability' | 'simple';

@Component({
  selector: 'app-shared-calendar',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './shared-calendar.component.html',
  styleUrl: './shared-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SharedCalendarComponent {
  @Input() mode: CalendarMode = 'simple';
  @Input() data: any[] = [];
  @Input() loading = false;
  @Input() showTodayButton = true;
  @Input() showMonthNavigation = true;
  @Input() customDayContent?: (day: CalendarDay) => any;

  @Output() daySelected = new EventEmitter<CalendarDay>();
  @Output() monthChanged = new EventEmitter<Date>();

  readonly currentDate = signal(new Date());
  readonly selectedDate = signal<Date | null>(null);
  readonly now = new Date();

  readonly currentMonth = computed(() => this.currentDate().getMonth());
  readonly currentYear = computed(() => this.currentDate().getFullYear());
  readonly monthName = computed(() => 
    this.currentDate().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  );

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
      
      // Get data for this day based on mode
      const dayData = this.getDataForDay(currentDate);
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth,
        isToday,
        data: dayData
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  });

  private getDataForDay(date: Date): any {
    switch (this.mode) {
      case 'doctor':
        return this.getDoctorsForDay(date);
      case 'availability':
        return this.getAvailabilityForDay(date);
      case 'simple':
      default:
        return null;
    }
  }

  private getDoctorsForDay(date: Date): any[] {
    // Filter doctors who have availability on this date
    return this.data.filter(item => {
      if (item.availability && Array.isArray(item.availability)) {
        return item.availability.some((avail: any) => {
          const availDate = new Date(avail.startAt);
          return availDate.toDateString() === date.toDateString();
        });
      }
      return false;
    });
  }

  private getAvailabilityForDay(date: Date): any[] {
    // Filter availability blocks for this date
    return this.data.filter(block => {
      const blockDate = new Date(block.startAt);
      return blockDate.toDateString() === date.toDateString() &&
             new Date(block.startAt) > this.now; // Only future blocks
    });
  }

  // Enhanced methods for better availability display
  hasAvailableSlots(day: CalendarDay): boolean {
    const dayData = day.data;
    if (!dayData || !Array.isArray(dayData)) return false;
    return dayData.length > 0;
  }

  getAvailableSlotsCount(day: CalendarDay): number {
    const dayData = day.data;
    if (!dayData || !Array.isArray(dayData)) return 0;
    return dayData.length;
  }

  getAvailabilityLevel(day: CalendarDay): 'none' | 'low' | 'medium' | 'high' {
    const count = this.getAvailableSlotsCount(day);
    if (count === 0) return 'none';
    if (count <= 2) return 'low';
    if (count <= 5) return 'medium';
    return 'high';
  }

  getAvailabilityColor(day: CalendarDay): string {
    switch (this.getAvailabilityLevel(day)) {
      case 'low': return '#e8f5e8'; // Light green
      case 'medium': return '#c8e6c9'; // Medium green
      case 'high': return '#a5d6a7'; // Dark green
      default: return 'transparent';
    }
  }

  getAvailabilityIcon(day: CalendarDay): string {
    const count = this.getAvailableSlotsCount(day);
    if (count === 0) return '';
    if (count === 1) return '•';
    if (count <= 3) return '••';
    return '•••';
  }

  // Public methods for child components
  previousMonth(): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() - 1);
    this.currentDate.set(newDate);
    this.monthChanged.emit(newDate);
  }

  nextMonth(): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + 1);
    this.currentDate.set(newDate);
    this.monthChanged.emit(newDate);
  }

  goToToday(): void {
    const today = new Date();
    this.currentDate.set(today);
    this.monthChanged.emit(today);
  }

  selectDay(day: CalendarDay): void {
    this.selectedDate.set(day.date);
    this.daySelected.emit(day);
  }

  isDaySelected(day: CalendarDay): boolean {
    return this.selectedDate()?.toDateString() === day.date.toDateString();
  }

  isWeekend(day: CalendarDay): boolean {
    const dayOfWeek = day.date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
  }

  isPastDay(day: CalendarDay): boolean {
    return day.date < this.now;
  }

  // Helper methods for different modes
  hasData(day: CalendarDay): boolean {
    if (!day.data) return false;
    
    switch (this.mode) {
      case 'doctor':
        return Array.isArray(day.data) && day.data.length > 0;
      case 'availability':
        return Array.isArray(day.data) && day.data.length > 0;
      default:
        return false;
    }
  }

  getDataCount(day: CalendarDay): number {
    if (!day.data || !Array.isArray(day.data)) return 0;
    return day.data.length;
  }

  getDataSummary(day: CalendarDay): string {
    switch (this.mode) {
      case 'doctor':
        const doctorCount = this.getDataCount(day);
        return doctorCount > 0 ? `${doctorCount} profesionales` : '';
      case 'availability':
        const blockCount = this.getDataCount(day);
        return blockCount > 0 ? `${blockCount} turnos` : '';
      default:
        return '';
    }
  }
}