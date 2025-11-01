import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../config/api.config';
import { DoctorDto, PatientDto } from '../models/user';
import { PaginationParams, PaginatedResponse } from '../models/pagination';

export interface DoctorCreate {
  email: string;
  password: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  specialty?: string;
  license_number?: string;
  years_experience?: number;
  office_id?: number;
}

export interface DoctorUpdate {
  password?: string;
  email?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  full_name?: string;
  specialty?: string;
  license_number?: string;
  years_experience?: number;
  office_id?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private readonly apiUrl = `${environment.apiBaseUrl}/doctors`;

  constructor(private http: HttpClient) {}

  getDoctors(): Observable<DoctorDto[]> {
    return this.http.get<DoctorDto[]>(this.apiUrl);
  }

  getDoctorsPaginated(params?: PaginationParams): Observable<PaginatedResponse<DoctorDto>> {
    let httpParams = new HttpParams();
    if (params) {
      httpParams = httpParams.set('page', params.page.toString());
      httpParams = httpParams.set('size', params.size.toString());
    }
    return this.http.get<PaginatedResponse<DoctorDto>>(`${this.apiUrl}/paginated`, { params: httpParams });
  }

  getDoctor(id: number): Observable<DoctorDto> {
    return this.http.get<DoctorDto>(`${this.apiUrl}/${id}`);
  }

  createDoctor(doctor: DoctorCreate): Observable<DoctorDto> {
    return this.http.post<DoctorDto>(this.apiUrl, doctor);
  }

  updateDoctor(id: number, doctor: DoctorUpdate): Observable<DoctorDto> {
    return this.http.put<DoctorDto>(`${this.apiUrl}/${id}`, doctor);
  }

  deleteDoctor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getDoctorPatients(doctorId: number): Observable<PatientDto[]> {
    return this.http.get<PatientDto[]>(`${this.apiUrl}/${doctorId}/patients`);
  }

  getDoctorPatientsPaginated(doctorId: number, params?: PaginationParams): Observable<PaginatedResponse<PatientDto>> {
    let httpParams = new HttpParams();
    if (params) {
      httpParams = httpParams.set('page', params.page.toString());
      httpParams = httpParams.set('size', params.size.toString());
    }
    return this.http.get<PaginatedResponse<PatientDto>>(`${this.apiUrl}/${doctorId}/patients/paginated`, { params: httpParams });
  }
}
