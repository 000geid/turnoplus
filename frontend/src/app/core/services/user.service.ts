import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../config/api.config';
import { UserDto } from '../models/user';
import { PaginationParams, PaginatedResponse } from '../models/pagination';

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  role: 'patient' | 'doctor' | 'admin';
}

export interface UserUpdate {
  password?: string;
  email?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  full_name?: string;
  role?: 'patient' | 'doctor' | 'admin';
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.apiUrl);
  }

  getUsersPaginated(params?: PaginationParams): Observable<PaginatedResponse<UserDto>> {
    let httpParams = new HttpParams();
    if (params) {
      httpParams = httpParams.set('page', params.page.toString());
      httpParams = httpParams.set('size', params.size.toString());
    }
    return this.http.get<PaginatedResponse<UserDto>>(`${this.apiUrl}/paginated`, { params: httpParams });
  }

  getUser(id: number): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/${id}`);
  }

  createUser(user: UserCreate): Observable<UserDto> {
    return this.http.post<UserDto>(this.apiUrl, user);
  }

  updateUser(id: number, user: UserUpdate): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
