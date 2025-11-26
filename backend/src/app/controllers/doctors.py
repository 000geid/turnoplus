from app.db.broker import get_dbbroker
from app.schemas.auth import DoctorLoginResponse, LoginRequest
from app.schemas.pagination import PaginatedResponse
from app.schemas.user import Doctor, DoctorCreate, DoctorUpdate, Patient
from app.services.doctors import DoctorsService


def list_doctors() -> list[Doctor]:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = DoctorsService(session)
        return svc.list()


def list_doctors_paginated(page: int = 1, size: int = 10) -> PaginatedResponse[Doctor]:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = DoctorsService(session)
        return svc.list_paginated(page=page, size=size)


def get_doctor(doctor_id: int) -> Doctor | None:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = DoctorsService(session)
        return svc.get(doctor_id)


def create_doctor(data: DoctorCreate) -> Doctor:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = DoctorsService(session)
        return svc.create(data)


def update_doctor(doctor_id: int, data: DoctorUpdate) -> Doctor | None:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = DoctorsService(session)
        return svc.update(doctor_id, data)


def delete_doctor(doctor_id: int) -> bool:
    """Delete a doctor. Raises ValueError if doctor has appointments."""
    broker = get_dbbroker()
    with broker.session() as session:
        svc = DoctorsService(session)
        return svc.delete(doctor_id)


def get_doctor_patients(doctor_id: int) -> list[Patient]:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = DoctorsService(session)
        return svc.get_patients_for_doctor(doctor_id)


def get_doctor_patients_paginated(doctor_id: int, page: int = 1, size: int = 10) -> PaginatedResponse[Patient]:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = DoctorsService(session)
        return svc.get_patients_for_doctor_paginated(doctor_id, page=page, size=size)


def login_doctor(data: LoginRequest) -> DoctorLoginResponse | None:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = DoctorsService(session)
        result = svc.authenticate(data.email, data.password)
        if not result:
            return None

        doctor, token = result
        return DoctorLoginResponse(access_token=token, user=doctor)
