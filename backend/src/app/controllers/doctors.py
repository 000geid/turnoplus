from app.schemas.auth import DoctorLoginResponse, LoginRequest
from app.schemas.user import Doctor, DoctorCreate, DoctorUpdate
from app.services.doctors import DoctorsService


svc = DoctorsService()


def list_doctors() -> list[Doctor]:
    return svc.list()


def get_doctor(doctor_id: int) -> Doctor | None:
    return svc.get(doctor_id)


def create_doctor(data: DoctorCreate) -> Doctor:
    return svc.create(data)


def update_doctor(doctor_id: int, data: DoctorUpdate) -> Doctor | None:
    return svc.update(doctor_id, data)


def delete_doctor(doctor_id: int) -> bool:
    return svc.delete(doctor_id)


def login_doctor(data: LoginRequest) -> DoctorLoginResponse | None:
    result = svc.authenticate(data.email, data.password)
    if not result:
        return None

    doctor, token = result
    return DoctorLoginResponse(access_token=token, user=doctor)
