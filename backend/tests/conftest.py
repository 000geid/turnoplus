from __future__ import annotations

import os
from datetime import datetime
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import create_engine

import app.models  # noqa: F401 - ensure models register with Base metadata
from app.db.base import Base
from app.db.broker import DBBroker
from app.db import broker as broker_module
from app.db.settings import DatabaseSettings
from app.main import create_app


def _default_test_url() -> str:
    return "mysql+pymysql://turnoplus:turnoplus@localhost:3306/turnoplus_test"


@pytest.fixture(scope="session")
def db_url() -> str:
    """Resolved database URL for tests."""
    return os.getenv("TEST_DATABASE_URL") or os.getenv("DATABASE_URL") or _default_test_url()


@pytest.fixture(scope="session")
def db_engine(db_url: str):
    """Shared engine pointing to the test MySQL database."""
    os.environ["DATABASE_URL"] = db_url
    settings = DatabaseSettings(url=db_url)
    engine = create_engine(settings.url, future=True, echo=settings.echo, pool_pre_ping=True)

    # Ensure schema is present
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture(autouse=True)
def clean_database(db_engine):
    """Truncate all tables between tests so each case starts fresh."""
    with db_engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0;"))
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(text(f"TRUNCATE TABLE {table.name};"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1;"))
        conn.commit()

    yield
    with db_engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0;"))
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(text(f"TRUNCATE TABLE {table.name};"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1;"))
        conn.commit()


@pytest.fixture()
def db_session(db_engine) -> Generator[Session, None, None]:
    """Database session bound to the test engine."""
    SessionLocal = sessionmaker(
        bind=db_engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
        future=True,
    )
    session: Session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def app(db_url: str):
    """FastAPI app wired to the test database."""
    broker_module._dbbroker = DBBroker(DatabaseSettings(url=db_url))
    return create_app()


@pytest.fixture(scope="function")
def client(app):
    """HTTP client for API-level integration tests."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def unique_suffix() -> str:
    """Timestamp-based suffix to avoid clashing emails in shared databases."""
    return datetime.utcnow().strftime("%Y%m%d%H%M%S%f")


@pytest.fixture()
def sample_doctor(db_session, unique_suffix):
    """Create a sample doctor for testing."""
    from app.services.doctors import DoctorsService
    from app.schemas.user import DoctorCreate
    
    service = DoctorsService(db_session)
    return service.create(
        DoctorCreate(
            email=f"doctor.{unique_suffix}@example.com",
            password="doctorpass",
            full_name="Dr. Test Buenos Aires",
            specialty="Clínica Médica",
            license_number=f"LIC-{unique_suffix[-6:]}",
            years_experience=5,
        )
    )


@pytest.fixture()
def sample_patient(db_session, unique_suffix):
    """Create a sample patient for testing."""
    from app.services.patients import PatientsService
    from app.schemas.user import PatientCreate
    
    service = PatientsService(db_session)
    return service.create(
        PatientCreate(
            email=f"patient.{unique_suffix}@example.com",
            password="patientpass",
            full_name="Patient Test",
            document_type="dni",
            document_number=f"DN{unique_suffix[-6:]}",
            address="Test address 123",
            phone="555-1234",
            medical_record_number=f"MRN-{unique_suffix[-6:]}",
        )
    )


@pytest.fixture()
def another_patient(db_session, unique_suffix):
    """Create another sample patient for testing rebooking scenarios."""
    from app.services.patients import PatientsService
    from app.schemas.user import PatientCreate
    
    service = PatientsService(db_session)
    return service.create(
        PatientCreate(
            email=f"patient2.{unique_suffix}@example.com",
            password="patientpass",
            full_name="Another Patient Test",
            document_type="dni",
            document_number=f"DN2{unique_suffix[-6:]}",
            address="Test address 456",
            phone="555-5678",
            medical_record_number=f"MRN2-{unique_suffix[-6:]}",
        )
    )

