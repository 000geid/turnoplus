import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { DoctorShellComponent } from './doctor-shell.component';
import { AuthService } from '../core/services/auth.service';
import { AppointmentsService } from '../core/services/appointments.service';
import { MedicalRecordsService } from '../core/services/medical-records.service';
import { AuthenticatedUser } from '../core/models/user';
import { AvailabilityDto } from '../core/models/appointment';
import { MedicalRecordDto } from '../core/models/medical-record';

class AuthServiceStub {
  private readonly userSignal = signal<AuthenticatedUser | null>(null);

  constructor(initial: AuthenticatedUser | null) {
    this.userSignal.set(initial);
  }

  get user() {
    return this.userSignal.asReadonly();
  }
}

describe('DoctorShellComponent', () => {
  let fixture: ComponentFixture<DoctorShellComponent>;
  let component: DoctorShellComponent;
  let appointmentsService: jasmine.SpyObj<AppointmentsService>;
  let medicalRecordsService: jasmine.SpyObj<MedicalRecordsService>;

  const doctorUser: AuthenticatedUser = {
    id: 22,
    email: 'doc@example.com',
    fullName: 'Dra. Demo',
    role: 'doctor',
    token: 'token',
    tokenType: 'bearer'
  };

  const availabilitySlot: AvailabilityDto = {
    id: 1,
    doctor_id: doctorUser.id,
    startAt: '2025-06-01T10:00:00Z',
    endAt: '2025-06-01T10:30:00Z',
    slots: 2,
    blocks: []
  };

  const medicalRecord: MedicalRecordDto = {
    id: 5,
    patient_id: 11,
    doctor_id: doctorUser.id,
    diagnosis: 'Chequeo',
    treatment: null,
    notes: null,
    created_at: '2025-05-01T10:00:00Z',
    updated_at: '2025-05-01T10:00:00Z'
  };

  beforeEach(async () => {
    appointmentsService = jasmine.createSpyObj<AppointmentsService>('AppointmentsService', [
      'listForDoctor',
      'listDoctorAvailability',
      'createAvailability',
      'updateAvailability',
      'deleteUnbookedAvailability'
    ]);

    medicalRecordsService = jasmine.createSpyObj<MedicalRecordsService>('MedicalRecordsService', [
      'listForDoctor',
      'createRecord',
      'updateRecord'
    ]);

    appointmentsService.listForDoctor.and.returnValue(
      of([
        {
          id: 10,
          doctor_id: doctorUser.id,
          patient_id: 15,
          startAt: '2025-06-02T10:00:00Z',
          endAt: '2025-06-02T10:30:00Z',
          status: 'confirmed',
          notes: null
        }
      ])
    );

    appointmentsService.listDoctorAvailability.and.returnValue(of([availabilitySlot]));
    appointmentsService.createAvailability.and.returnValue(
      of({
        id: 2,
        doctor_id: doctorUser.id,
        startAt: '2025-06-01T12:00:00Z',
        endAt: '2025-06-01T12:30:00Z',
        slots: 1,
        blocks: []
      })
    );
    appointmentsService.updateAvailability.and.returnValue(
      of({
        ...availabilitySlot,
        slots: 3,
        blocks: []
      })
    );
    appointmentsService.deleteUnbookedAvailability.and.returnValue(of(null));

    medicalRecordsService.listForDoctor.and.returnValue(of([medicalRecord]));
    medicalRecordsService.createRecord.and.returnValue(
      of({
        ...medicalRecord,
        id: 6,
        patient_id: 12,
        diagnosis: 'Control',
        updated_at: '2025-05-02T12:00:00Z'
      })
    );
    medicalRecordsService.updateRecord.and.returnValue(
      of({
        ...medicalRecord,
        notes: 'Seguimiento',
        updated_at: '2025-05-03T10:00:00Z'
      })
    );

    const authStub = new AuthServiceStub(doctorUser);

    await TestBed.configureTestingModule({
      imports: [DoctorShellComponent],
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: AppointmentsService, useValue: appointmentsService },
        { provide: MedicalRecordsService, useValue: medicalRecordsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load appointments, availability and records on init', () => {
    expect(appointmentsService.listForDoctor).toHaveBeenCalledWith(doctorUser.id);
    expect(appointmentsService.listDoctorAvailability).toHaveBeenCalledWith(doctorUser.id);
    expect(medicalRecordsService.listForDoctor).toHaveBeenCalledWith(doctorUser.id);
    expect(component.sortedAppointments().length).toBe(1);
    expect(component.availability().length).toBe(1);
    expect(component.records().length).toBe(1);
  });

  it('should filter out cancelled appointments', () => {
    const cancelledAppointment = {
      id: 11,
      doctor_id: doctorUser.id,
      patient_id: 15,
      startAt: '2025-06-03T10:00:00Z',
      endAt: '2025-06-03T10:30:00Z',
      status: 'canceled' as const,
      notes: null
    };

    appointmentsService.listForDoctor.and.returnValue(of([
      {
        id: 10,
        doctor_id: doctorUser.id,
        patient_id: 15,
        startAt: '2025-06-02T10:00:00Z',
        endAt: '2025-06-02T10:30:00Z',
        status: 'confirmed',
        notes: null
      },
      cancelledAppointment
    ]));

    component['loadAppointments'](true);

    expect(component.sortedAppointments().length).toBe(1);
    expect(component.sortedAppointments()[0].id).toBe(10);
  });

  it('should create availability and append it to the list', () => {
    component.onCreateAvailability({
      startAt: '2025-06-01T12:00:00Z',
      endAt: '2025-06-01T12:30:00Z'
    });

    expect(appointmentsService.createAvailability).toHaveBeenCalledWith({
      doctor_id: doctorUser.id,
      start_at: '2025-06-01T12:00:00Z',
      end_at: '2025-06-01T12:30:00Z'
    });
    expect(component.availability().length).toBe(2);
  });

  it('should update an availability slot', () => {
    component.onUpdateAvailability({ id: availabilitySlot.id, mode: 'default' });

    expect(appointmentsService.updateAvailability).toHaveBeenCalledWith(availabilitySlot.id, {});
  });

  it('should update a medical record', () => {
    component.onUpdateRecord({
      recordId: medicalRecord.id,
      changes: { notes: 'Seguimiento' }
    });

    expect(medicalRecordsService.updateRecord).toHaveBeenCalledWith(medicalRecord.id, {
      notes: 'Seguimiento'
    });
    expect(component.records()[0].notes).toBe('Seguimiento');
  });
});
