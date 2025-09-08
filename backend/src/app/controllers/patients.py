from app.schemas.user import Patient, PatientCreate, PatientUpdate
from app.services.patients import PatientsService


svc = PatientsService()


def list_patients() -> list[Patient]:
    return svc.list()


def get_patient(patient_id: int) -> Patient | None:
    return svc.get(patient_id)


def create_patient(data: PatientCreate) -> Patient:
    return svc.create(data)


def update_patient(patient_id: int, data: PatientUpdate) -> Patient | None:
    return svc.update(patient_id, data)


def delete_patient(patient_id: int) -> bool:
    return svc.delete(patient_id)

