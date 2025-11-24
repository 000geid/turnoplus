import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { AdminDashboardSummaryDto } from '../models/admin';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/admins`;

  getDashboardSummary(): Observable<AdminDashboardSummaryDto> {
    return this.http.get<AdminDashboardSummaryDto>(`${this.baseUrl}/dashboard/summary`);
  }
}
