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


def test_create_patient_with_obra_social(db_session):
    service = PatientsService(db_session)
    patient = service.create(
        PatientCreate(
            email="osde_patient@example.com",
            password="secret123",
            full_name="Paciente OSDE",
            document_type="dni",
            document_number="22334455",
            address="Calle 3 789",
            phone="555-0003",
            obra_social_name="OSDE",
            obra_social_number="1234567890",
        )
    )

    assert patient.obra_social_name == "OSDE"
    assert patient.obra_social_number == "1234567890"


def test_create_patient_without_obra_social(db_session):
    service = PatientsService(db_session)
    patient = service.create(
        PatientCreate(
            email="no_os_patient@example.com",
            password="secret123",
            full_name="Paciente Sin OS",
            document_type="dni",
            document_number="33445566",
            address="Calle 4 012",
            phone="555-0004",
        )
    )

    assert patient.obra_social_name is None
    assert patient.obra_social_number is None


def test_update_patient_obra_social(db_session):
    service = PatientsService(db_session)
    # Create patient without OS
    patient = service.create(
        PatientCreate(
            email="update_os_patient@example.com",
            password="secret123",
            full_name="Paciente Update",
            document_type="dni",
            document_number="44556677",
            address="Calle 5 345",
            phone="555-0005",
        )
    )
    
    # Update with OS
    from app.schemas.user import PatientUpdate
    updated = service.update(
        patient.id,
        PatientUpdate(
            obra_social_name="Swiss Medical",
            obra_social_number="SM-98765"
        )
    )
    
    assert updated.obra_social_name == "Swiss Medical"
    assert updated.obra_social_number == "SM-98765"


def test_obra_social_special_characters(db_session):
    service = PatientsService(db_session)
    patient = service.create(
        PatientCreate(
            email="special_chars@example.com",
            password="secret123",
            full_name="Paciente Special",
            document_type="dni",
            document_number="55667788",
            address="Calle 6 678",
            phone="555-0006",
            obra_social_name="O.S.D.E. - Plan 210",
            obra_social_number="A-123/456",
        )
    )

    assert patient.obra_social_name == "O.S.D.E. - Plan 210"
    assert patient.obra_social_number == "A-123/456"

