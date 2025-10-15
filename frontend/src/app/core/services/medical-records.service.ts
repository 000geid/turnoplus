import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { MedicalRecordDto } from '../models/medical-record';

@Injectable({ providedIn: 'root' })
export class MedicalRecordsService {
  private readonly http = inject(HttpClient);

  listForPatient(patientId: number): Observable<MedicalRecordDto[]> {
    return this.http.get<MedicalRecordDto[]>(`${API_BASE_URL}/medical-records/patients/${patientId}`);
  }
}
