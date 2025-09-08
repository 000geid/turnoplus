from app.schemas.user import Doctor, DoctorCreate, DoctorUpdate


class DoctorsService:
    """Mock implementation: returns sample data, no persistence."""

    def list(self) -> list[Doctor]:
        return [
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

    def get(self, doctor_id: int) -> Doctor | None:
        if doctor_id == 1:
            return self.list()[0]
        return None

    def create(self, data: DoctorCreate) -> Doctor:
        return Doctor(id=2, **data.model_dump())

    def update(self, doctor_id: int, data: DoctorUpdate) -> Doctor | None:
        existing = self.get(doctor_id)
        if not existing:
            return None
        return existing.model_copy(update=data.model_dump(exclude_unset=True))

    def delete(self, doctor_id: int) -> bool:
        return doctor_id == 1

