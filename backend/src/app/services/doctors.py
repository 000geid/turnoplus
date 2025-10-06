from __future__ import annotations

from typing import Dict, List, Optional

from app.schemas.user import Doctor, DoctorCreate, DoctorUpdate


class DoctorsService:
    """In-memory doctor service with mock dataset."""

    def __init__(self) -> None:
        self._doctors: List[Doctor] = [
            Doctor(
                id=1,
                email="doctor1@example.com",
                password="***",
                is_active=True,
                is_superuser=False,
                full_name="Doctor One",
                specialty="Cardiology",
                license_number="LIC-123",
                years_experience=10,
            )
        ]
        self._credentials: Dict[int, str] = {1: "doctor1pass"}

    def _copy(self, doctor: Doctor) -> Doctor:
        return doctor.model_copy()

    def _find_by_id(self, doctor_id: int) -> Optional[Doctor]:
        return next((doctor for doctor in self._doctors if doctor.id == doctor_id), None)

    def _find_by_email(self, email: str) -> Optional[Doctor]:
        return next((doctor for doctor in self._doctors if doctor.email == email), None)

    def list(self) -> list[Doctor]:
        return [self._copy(doctor) for doctor in self._doctors]

    def get(self, doctor_id: int) -> Doctor | None:
        doctor = self._find_by_id(doctor_id)
        return self._copy(doctor) if doctor else None

    def create(self, data: DoctorCreate) -> Doctor:
        payload = data.model_dump()
        password = payload.pop("password")
        new_id = max((doctor.id for doctor in self._doctors), default=0) + 1
        doctor = Doctor(id=new_id, password="***", **payload)
        self._doctors.append(doctor)
        self._credentials[new_id] = password
        return self._copy(doctor)

    def update(self, doctor_id: int, data: DoctorUpdate) -> Doctor | None:
        doctor = self._find_by_id(doctor_id)
        if not doctor:
            return None

        update_payload = data.model_dump(exclude_unset=True)

        if "password" in update_payload:
            new_password = update_payload.pop("password")
            self._credentials[doctor_id] = new_password

        updated_doctor = doctor.model_copy(update=update_payload)
        for idx, existing in enumerate(self._doctors):
            if existing.id == doctor_id:
                self._doctors[idx] = updated_doctor
                break
        return self._copy(updated_doctor)

    def delete(self, doctor_id: int) -> bool:
        for idx, doctor in enumerate(self._doctors):
            if doctor.id == doctor_id:
                del self._doctors[idx]
                self._credentials.pop(doctor_id, None)
                return True
        return False

    def authenticate(self, email: str, password: str) -> tuple[Doctor, str] | None:
        doctor = self._find_by_email(email)
        if not doctor:
            return None

        stored_password = self._credentials.get(doctor.id)
        if stored_password != password or not doctor.is_active:
            return None

        return self._copy(doctor), f"doctor-token-{doctor.id}"
