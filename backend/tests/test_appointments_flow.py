from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from app.schemas.appointment import AppointmentCreate, AvailabilityCreate
from app.schemas.user import DoctorCreate, PatientCreate
from app.services.appointments import AppointmentsService, ValidationError
from app.services.doctors import DoctorsService
from app.services.patients import PatientsService
from app.services.system_settings import SystemSettingsService


def _make_patient(service: PatientsService, suffix: str):
    return service.create(
        PatientCreate(
            email=f"patient.{suffix}@example.com",
            password="patientpass",
            full_name="Paciente Test",
            document_type="dni",
            document_number=f"DN{suffix[-6:]}",
            address="Test address",
            phone="555-0001",
            medical_record_number=f"MRN-{suffix[-6:]}",
        )
    )


def _make_doctor(service: DoctorsService, suffix: str):
    return service.create(
        DoctorCreate(
            email=f"doctor.{suffix}@example.com",
            password="doctorpass",
            full_name="Doctor Test",
            specialty="Clínica Médica",
            license_number=f"LIC-{suffix[-6:]}",
            years_experience=5,
        )
    )


@pytest.mark.integration
def test_full_booking_flow(db_session, unique_suffix):
    patient = _make_patient(PatientsService(db_session), unique_suffix)
    doctor = _make_doctor(DoctorsService(db_session), unique_suffix)

    appointments = AppointmentsService(db_session)
    block_duration = SystemSettingsService(db_session).get_block_duration()

    start_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(days=1, hours=1)
    end_time = start_time + timedelta(minutes=block_duration)

    availability = appointments.create_availability(
        AvailabilityCreate(
            doctor_id=doctor.id,
            start_at=start_time,
            end_at=start_time + timedelta(hours=2),
        )
    )

    available_blocks = appointments.list_available_blocks(
        doctor_id=doctor.id,
        start_date=start_time,
        end_date=end_time + timedelta(minutes=block_duration),
    )
    assert available_blocks, "Should expose at least one available block"

    appointment = appointments.book(
        AppointmentCreate(
            doctor_id=doctor.id,
            patient_id=patient.id,
            start_at=available_blocks[0].start_at,
            end_at=available_blocks[0].end_at,
            notes="Integration test appointment",
        )
    )
    assert appointment.status.value == "pending"

    confirmed = appointments.confirm(appointment.id)
    assert confirmed.status.value == "confirmed"

    completed = appointments.complete(appointment.id)
    assert completed.status.value == "completed"

    availability_after = appointments.list_availability(doctor.id)
    assert availability_after[0].blocks[0].is_booked is True


@pytest.mark.integration
def test_booking_validation_rejects_invalid_dates(db_session, unique_suffix):
    patient = _make_patient(PatientsService(db_session), unique_suffix)
    doctor = _make_doctor(DoctorsService(db_session), unique_suffix)

    appointments = AppointmentsService(db_session)
    start_at = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(days=2)
    appointments.create_availability(
        AvailabilityCreate(
            doctor_id=doctor.id,
            start_at=start_at,
            end_at=start_at + timedelta(hours=1),
        )
    )

    with pytest.raises(ValidationError):
        appointments.book(
            AppointmentCreate(
                doctor_id=doctor.id,
                patient_id=patient.id,
                start_at=datetime(2025, 10, 29, 18, 0, tzinfo=timezone.utc),
                end_at=datetime(2025, 10, 29, 17, 0, tzinfo=timezone.utc),
                notes="Should fail validation",
            )
        )
