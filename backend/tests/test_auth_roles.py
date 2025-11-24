from __future__ import annotations

import pytest

from app.schemas.auth import LoginRequest
from app.schemas.user import AdminCreate, DoctorCreate, PatientCreate
from app.services.admins import AdminsService
from app.services.doctors import DoctorsService
from app.services.patients import PatientsService


def _seed_accounts(db_session, suffix: str):
    patients = PatientsService(db_session)
    doctors = DoctorsService(db_session)
    admins = AdminsService(db_session)

    patient_email = f"patient.{suffix}@example.com"
    doctor_email = f"doctor.{suffix}@example.com"
    admin_email = f"admin.{suffix}@example.com"

    patients.create(
        PatientCreate(
            email=patient_email,
            password="patientpass",
            full_name="Paciente Test",
            document_type="dni",
            document_number=f"DN{suffix[-6:]}",
            address="Test address",
            phone="555-0001",
            medical_record_number=f"MRN-{suffix[-6:]}",
        )
    )
    doctors.create(
        DoctorCreate(
            email=doctor_email,
            password="doctorpass",
            full_name="Doctor Test",
            specialty="Clínica Médica",
            license_number=f"LIC-{suffix[-6:]}",
            years_experience=3,
        )
    )
    admins.create(
        AdminCreate(
            email=admin_email,
            password="adminpass",
            full_name="Admin Test",
            role="manager",
            permissions={"manage_users", "read_reports"},
        )
    )

    db_session.commit()

    return {
        "patient": {"email": patient_email, "password": "patientpass"},
        "doctor": {"email": doctor_email, "password": "doctorpass"},
        "admin": {"email": admin_email, "password": "adminpass"},
    }


@pytest.mark.integration
def test_role_specific_logins(client, db_session, unique_suffix):
    credentials = _seed_accounts(db_session, unique_suffix)

    # Valid credentials for each role
    patient_login = client.post(
        "/api/v1/users/login", json=LoginRequest(**credentials["patient"]).model_dump()
    )
    assert patient_login.status_code == 200

    doctor_login = client.post(
        "/api/v1/doctors/login", json=LoginRequest(**credentials["doctor"]).model_dump()
    )
    assert doctor_login.status_code == 200

    admin_login = client.post(
        "/api/v1/admins/login", json=LoginRequest(**credentials["admin"]).model_dump()
    )
    assert admin_login.status_code == 200

    # Cross-role attempts should be rejected
    assert client.post(
        "/api/v1/doctors/login", json=LoginRequest(**credentials["patient"]).model_dump()
    ).status_code == 401
    assert client.post(
        "/api/v1/users/login", json=LoginRequest(**credentials["doctor"]).model_dump()
    ).status_code == 401
    assert client.post(
        "/api/v1/admins/login", json=LoginRequest(**credentials["patient"]).model_dump()
    ).status_code == 401
