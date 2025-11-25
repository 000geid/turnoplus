from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.controllers.appointments import (
    book_appointment,
    cancel_appointment,
    complete_appointment,
    confirm_appointment,
    create_availability,
    delete_availability,
    delete_appointment_block,
    delete_unbooked_blocks,
    list_availability,
    list_doctor_appointments,
    list_patient_appointments,
    list_patient_appointments_filtered,
    update_availability,
)
from app.schemas.appointment import (
    Appointment,
    AppointmentCreate,
    Availability,
    AvailabilityCreate,
    AvailabilityUpdate,
)


router = APIRouter()


@router.get("/patients/{patient_id}", response_model=list[Appointment])
def route_list_patient_appointments(patient_id: int):
    try:
        return list_patient_appointments(patient_id)
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/patients/{patient_id}/filtered", response_model=list[Appointment])
def route_list_patient_appointments_filtered(
    patient_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    try:
        start_dt = datetime.fromisoformat(start_date) if start_date else None
        end_dt = datetime.fromisoformat(end_date) if end_date else None
        
        return list_patient_appointments_filtered(patient_id, start_dt, end_dt)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format: YYYY-MM-DDTHH:MM:SS") from exc
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/doctors/{doctor_id}", response_model=list[Appointment])
def route_list_doctor_appointments(doctor_id: int):
    return list_doctor_appointments(doctor_id)


@router.post("/", response_model=Appointment, status_code=201)
def route_book_appointment(data: AppointmentCreate):
    return book_appointment(data)


@router.post("/{appointment_id}/cancel", response_model=Appointment)
def route_cancel_appointment(appointment_id: int):
    return cancel_appointment(appointment_id)


@router.post("/{appointment_id}/confirm", response_model=Appointment)
def route_confirm_appointment(appointment_id: int):
    return confirm_appointment(appointment_id)


@router.post("/{appointment_id}/complete", response_model=Appointment)
def route_complete_appointment(appointment_id: int):
    return complete_appointment(appointment_id)


@router.get("/doctor/{doctor_id}/availability", response_model=list[Availability])
def route_list_doctor_availability(doctor_id: int):
    return list_availability(doctor_id)


@router.post("/availability", response_model=Availability, status_code=201)
def route_create_availability(data: AvailabilityCreate):
    return create_availability(data)


@router.patch("/availability/{availability_id}", response_model=Availability)
def route_update_availability(availability_id: int, data: AvailabilityUpdate):
    return update_availability(availability_id, data)


@router.delete("/availability/{availability_id}", status_code=204)
def route_delete_availability(availability_id: int):
    delete_availability(availability_id)


@router.delete("/availability/{availability_id}/unbooked", status_code=204)
def route_delete_unbooked_blocks(availability_id: int):
    """Delete only unbooked blocks for an availability. If none remain, availability is removed."""
    try:
        delete_unbooked_blocks(availability_id)
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/blocks/{block_id}", status_code=204)
def route_delete_appointment_block(block_id: int):
    """Delete a specific appointment block."""
    delete_appointment_block(block_id)
