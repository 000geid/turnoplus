import { Injectable } from '@angular/core';

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class DatePeriodService {

  /**
   * Get date ranges for different time periods
   */
  getTimePeriods(): Record<string, DateRange> {
    const now = new Date();
    const today = this.getStartOfDay(now);
    const startOfWeek = this.getStartOfWeek(now);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const nextWeek = new Date(startOfWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekEnd = new Date(nextWeek);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
    nextWeekEnd.setHours(23, 59, 59, 999);

    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      today: {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        label: 'Hoy'
      },
      thisWeek: {
        start: startOfWeek,
        end: endOfWeek,
        label: 'Esta Semana'
      },
      nextWeek: {
        start: nextWeek,
        end: nextWeekEnd,
        label: 'Próxima Semana'
      },
      thisMonth: {
        start: thisMonth,
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
        label: 'Este Mes'
      },
      nextMonth: {
        start: nextMonth,
        end: new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0, 23, 59, 59, 999),
        label: 'Próximo Mes'
      }
    };
  }

  /**
   * Get appointments grouped by time periods
   */
  groupAppointmentsByTimePeriod(appointments: any[]): Record<string, any[]> {
    const periods = this.getTimePeriods();
    const grouped: Record<string, any[]> = {
      today: [],
      thisWeek: [],
      nextWeek: [],
      thisMonth: [],
      nextMonth: [],
      past: [],
      all: [...appointments].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    };

    const now = new Date();

    for (const appointment of appointments) {
      const appointmentDate = new Date(appointment.startAt);
      
      // Check if it's today
      if (appointmentDate >= periods['today'].start && appointmentDate <= periods['today'].end) {
        grouped['today'].push(appointment);
      }
      // Check if it's this week
      else if (appointmentDate >= periods['thisWeek'].start && appointmentDate <= periods['thisWeek'].end) {
        grouped['thisWeek'].push(appointment);
      }
      // Check if it's next week
      else if (appointmentDate >= periods['nextWeek'].start && appointmentDate <= periods['nextWeek'].end) {
        grouped['nextWeek'].push(appointment);
      }
      // Check if it's this month
      else if (appointmentDate >= periods['thisMonth'].start && appointmentDate <= periods['thisMonth'].end) {
        grouped['thisMonth'].push(appointment);
      }
      // Check if it's next month
      else if (appointmentDate >= periods['nextMonth'].start && appointmentDate <= periods['nextMonth'].end) {
        grouped['nextMonth'].push(appointment);
      }
      // Check if it's in the past
      else if (appointmentDate < now) {
        grouped['past'].push(appointment);
      }
    }

    return grouped;
  }

  /**
   * Format date range for API calls (ISO string format)
   */
  formatDateRangeForAPI(date: Date): string {
    return date.toISOString();
  }

  /**
   * Get start of day
   */
  private getStartOfDay(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Get start of week (Monday)
   */
  private getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Check if appointment is in the past
   */
  isAppointmentPast(appointment: any): boolean {
    return new Date(appointment.startAt) < new Date();
  }

  /**
   * Check if appointment is today
   */
  isAppointmentToday(appointment: any): boolean {
    const appointmentDate = new Date(appointment.startAt);
    const today = new Date();
    return appointmentDate.toDateString() === today.toDateString();
  }
}