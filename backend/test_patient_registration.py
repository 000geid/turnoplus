import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
SRC_DIR = ROOT_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401 - ensure models are registered with Base metadata
from app.db.base import Base
from app.schemas.user import PatientCreate
from app.services.patients import PatientsService


@pytest.fixture()
def session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def test_create_patient_persists_document_fields(session):
    service = PatientsService(session)
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


def test_create_patient_duplicate_email_rejected(session):
    service = PatientsService(session)
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
