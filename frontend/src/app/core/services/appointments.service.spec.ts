import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AppointmentsService } from './appointments.service';
import { API_BASE_URL } from '../config/api.config';
import { AppointmentDto, AvailabilityDto } from '../models/appointment';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(AppointmentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request appointments for the given patient', () => {
    let response: AppointmentDto[] | undefined;

    service.listForPatient(7).subscribe((appointments) => (response = appointments));

    const request = httpMock.expectOne(`${API_BASE_URL}/appointments/patients/7`);
    expect(request.request.method).toBe('GET');

    const payload: AppointmentDto[] = [
      {
        id: 1,
        doctor_id: 10,
        patient_id: 7,
        startAt: '2025-10-15T10:00:00Z',
        endAt: '2025-10-15T10:30:00Z',
        status: 'pending',
        notes: null
      }
    ];

    request.flush(payload);
    expect(response).toEqual(payload);
  });

  it('should send cancel command for an appointment', () => {
    service.cancel(3).subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/appointments/3/cancel`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
  });

  it('should send confirm command for an appointment', () => {
    service.confirm(4).subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/appointments/4/confirm`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
  });

  it('should fetch doctor availability', () => {
    let response: AvailabilityDto[] | undefined;

    service.listDoctorAvailability(3).subscribe((slots) => (response = slots));

    const request = httpMock.expectOne(`${API_BASE_URL}/appointments/doctor/3/availability`);
    expect(request.request.method).toBe('GET');

    const payload: AvailabilityDto[] = [
      { id: 1, doctor_id: 3, startAt: '2025-10-16T09:00:00Z', endAt: '2025-10-16T09:30:00Z', slots: 1 }
    ];

    request.flush(payload);
    expect(response).toEqual(payload);
  });

  it('should post a new appointment booking', () => {
    const payload = {
      doctor_id: 2,
      patient_id: 7,
      start_at: '2025-10-20T10:00:00Z',
      end_at: '2025-10-20T10:30:00Z'
    };

    service.book(payload).subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/appointments`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
  });
});
