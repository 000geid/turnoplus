from datetime import date

from app.schemas.user import Patient, PatientCreate, PatientUpdate


class PatientsService:
    """Mock implementation: returns sample data, no persistence."""

    def list(self) -> list[Patient]:
        return [
            Patient(
                id=1,
                email="patient1@example.com",
                password="***",
                is_active=True,
                is_superuser=False,
                full_name="Patient One",
                date_of_birth=date(1990, 1, 1),
                medical_record_number="MRN-001",
                emergency_contact="EC Person",
            )
        ]

    def get(self, patient_id: int) -> Patient | None:
        if patient_id == 1:
            return self.list()[0]
        return None

    def create(self, data: PatientCreate) -> Patient:
        return Patient(id=2, **data.model_dump())

    def update(self, patient_id: int, data: PatientUpdate) -> Patient | None:
        existing = self.get(patient_id)
        if not existing:
            return None
        return existing.model_copy(update=data.model_dump(exclude_unset=True))

    def delete(self, patient_id: int) -> bool:
        return patient_id == 1

