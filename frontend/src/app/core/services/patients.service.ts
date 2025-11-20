import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { PatientDto, PatientUpdateRequest } from '../models/user';
import { PaginationParams, PaginatedResponse } from '../models/pagination';

export interface PatientCreate {
  email: string;
  password: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  date_of_birth?: string;
  medical_record_number?: string;
  emergency_contact?: string;
}

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private readonly http = inject(HttpClient);

  getPatients(): Observable<PatientDto[]> {
    return this.http.get<PatientDto[]>(`${API_BASE_URL}/patients/`);
  }

  getPatientsPaginated(params?: PaginationParams): Observable<PaginatedResponse<PatientDto>> {
    let httpParams = new HttpParams();
    if (params) {
      httpParams = httpParams.set('page', params.page.toString());
      httpParams = httpParams.set('size', params.size.toString());
    }
    return this.http.get<PaginatedResponse<PatientDto>>(`${API_BASE_URL}/patients/paginated`, { params: httpParams });
  }

  getPatient(id: number): Observable<PatientDto> {
    return this.http.get<PatientDto>(`${API_BASE_URL}/patients/${id}`);
  }

  createPatient(patient: PatientCreate): Observable<PatientDto> {
    return this.http.post<PatientDto>(`${API_BASE_URL}/patients/`, patient);
  }

  updatePatient(id: number, changes: PatientUpdateRequest): Observable<PatientDto> {
    return this.http.put<PatientDto>(`${API_BASE_URL}/patients/${id}`, changes);
  }

  deletePatient(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/patients/${id}`);
  }
}
