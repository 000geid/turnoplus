from fastapi import APIRouter, HTTPException, Query

from app.controllers.doctors import (
    create_doctor,
    delete_doctor,
    get_doctor,
    get_doctor_patients,
    get_doctor_patients_paginated,
    login_doctor,
    list_doctors,
    list_doctors_paginated,
    update_doctor,
)
from app.controllers.appointments import get_doctor_availability, get_available_blocks
from app.schemas.auth import DoctorLoginResponse, LoginRequest
from app.schemas.pagination import PaginatedResponse
from app.schemas.user import Doctor, DoctorCreate, DoctorUpdate, Patient
from app.schemas.appointment import AppointmentBlock


router = APIRouter()


@router.get("/", response_model=list[Doctor])
def route_list_doctors():
    return list_doctors()


@router.get("/paginated", response_model=PaginatedResponse[Doctor])
def route_list_doctors_paginated(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Items per page")
):
    return list_doctors_paginated(page=page, size=size)


@router.get("/{doctor_id}", response_model=Doctor)
def route_get_doctor(doctor_id: int):
    data = get_doctor(doctor_id)
    if not data:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return data


@router.post("/login", response_model=DoctorLoginResponse)
def route_login_doctor(data: LoginRequest):
    response = login_doctor(data)
    if not response:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return response


@router.post("/", response_model=Doctor, status_code=201)
def route_create_doctor(data: DoctorCreate):
    return create_doctor(data)


@router.put("/{doctor_id}", response_model=Doctor)
def route_update_doctor(doctor_id: int, data: DoctorUpdate):
    item = update_doctor(doctor_id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return item


@router.get("/{doctor_id}/patients", response_model=list[Patient])
def route_get_doctor_patients(doctor_id: int):
    patients = get_doctor_patients(doctor_id)
    if not patients and get_doctor(doctor_id) is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return patients


@router.get("/{doctor_id}/patients/paginated", response_model=PaginatedResponse[Patient])
def route_get_doctor_patients_paginated(
    doctor_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Items per page")
):
    patients = get_doctor_patients_paginated(doctor_id, page=page, size=size)
    if not patients.items and get_doctor(doctor_id) is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return patients


@router.delete("/{doctor_id}", status_code=204)
def route_delete_doctor(doctor_id: int):
    try:
        ok = delete_doctor(doctor_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Doctor not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{doctor_id}/availability")
def route_get_doctor_availability(doctor_id: int):
    """Get doctor's availability with blocks."""
    return get_doctor_availability(doctor_id)


@router.get("/{doctor_id}/available-blocks")
def route_get_available_blocks(
    doctor_id: int,
    start_date: str,
    end_date: str
):
    """Get available appointment blocks for a doctor within a date range."""
    from datetime import datetime
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Parsing dates: start_date={start_date}, end_date={end_date}")
        
        # Handle different ISO format variations
        if start_date.endswith('Z'):
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        else:
            start = datetime.fromisoformat(start_date)
            
        if end_date.endswith('Z'):
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        else:
            end = datetime.fromisoformat(end_date)
        
        # Ensure both datetimes have timezone info
        if start.tzinfo is None:
            start = start.replace(tzinfo=datetime.timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=datetime.timezone.utc)
            
        logger.info(f"Parsed dates: start={start}, end={end}")
        
        # Validate date range
        if start >= end:
            raise HTTPException(status_code=400, detail="Start date must be before end date")
            
        return get_available_blocks(doctor_id, start, end)
    except ValueError as e:
        logger.error(f"Date parsing error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error in available blocks: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
