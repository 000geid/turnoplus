import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { AppointmentCreateRequest, AppointmentDto, AvailabilityDto } from '../models/appointment';

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly http = inject(HttpClient);

  listForPatient(patientId: number): Observable<AppointmentDto[]> {
    return this.http.get<AppointmentDto[]>(`${API_BASE_URL}/appointments/patients/${patientId}`);
  }

  cancel(appointmentId: number): Observable<AppointmentDto> {
    return this.http.post<AppointmentDto>(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {});
  }

  confirm(appointmentId: number): Observable<AppointmentDto> {
    return this.http.post<AppointmentDto>(`${API_BASE_URL}/appointments/${appointmentId}/confirm`, {});
  }

  listDoctorAvailability(doctorId: number): Observable<AvailabilityDto[]> {
    return this.http.get<AvailabilityDto[]>(`${API_BASE_URL}/appointments/doctor/${doctorId}/availability`);
  }

  book(payload: AppointmentCreateRequest): Observable<AppointmentDto> {
    return this.http.post<AppointmentDto>(`${API_BASE_URL}/appointments`, payload);
  }
}
