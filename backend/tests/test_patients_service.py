from __future__ import annotations

import pytest

from app.schemas.user import PatientCreate
from app.services.patients import PatientsService


def test_create_patient_persists_document_fields(db_session):
    service = PatientsService(db_session)
    patient = service.create(
        PatientCreate(
            email="patient@example.com",
            password="secret123",
            full_name="Paciente Uno",
            document_type="dni",
            document_number="12345678",
            address="Calle 1 123",
            phone="555-0001",
            medical_record_number="MRN-TEST-1",
        )
    )

    assert patient.document_type == "dni"
    assert patient.document_number == "12345678"
    assert patient.address == "Calle 1 123"
    assert patient.phone == "555-0001"


def test_create_patient_duplicate_email_rejected(db_session):
    service = PatientsService(db_session)
    base_payload = dict(
        email="patient@example.com",
        password="secret123",
        full_name="Paciente Uno",
        document_type="dni",
        document_number="87654321",
        address="Calle 2 456",
        phone="555-0002",
    )
    service.create(PatientCreate(**base_payload, medical_record_number="MRN-TEST-2"))

    duplicate_payload = dict(base_payload)
    duplicate_payload["document_number"] = "11112222"
    duplicate_payload["medical_record_number"] = "MRN-TEST-3"

    with pytest.raises(ValueError, match="Email already in use"):
        service.create(PatientCreate(**duplicate_payload))
