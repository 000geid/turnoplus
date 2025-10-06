from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from app.repositories.appointments import (
    AppointmentRepository,
    AvailabilityRepository,
    InMemoryAppointmentRepository,
    InMemoryAvailabilityRepository,
    build_appointment_from_create,
    build_availability_from_create,
    ensure_doctor_is_free,
)
from app.schemas.appointment import (
    Appointment,
    AppointmentCreate,
    AppointmentStatus,
    Availability,
    AvailabilityCreate,
    AvailabilityUpdate,
)
from app.services.doctors import DoctorsService
from app.services.patients import PatientsService


class AppointmentError(Exception):
    """Base class for appointment-related errors."""


class NotFoundError(AppointmentError):
    """Raised when an appointment resource cannot be found."""


class ValidationError(AppointmentError):
    """Raised when domain validation fails."""


@dataclass
class AppointmentDependencies:
    appointments: AppointmentRepository
    availability: AvailabilityRepository
    patients: PatientsService
    doctors: DoctorsService


class AppointmentsService:
    """Application service that orchestrates appointments workflow."""

    def __init__(
        self,
        dependencies: Optional[AppointmentDependencies] = None,
    ) -> None:
        deps = dependencies or AppointmentDependencies(
            appointments=InMemoryAppointmentRepository(),
            availability=InMemoryAvailabilityRepository(),
            patients=PatientsService(),
            doctors=DoctorsService(),
        )
        self._appointments = deps.appointments
        self._availability = deps.availability
        self._patients = deps.patients
        self._doctors = deps.doctors

    # --------- Query methods ---------
    def list_for_patient(self, patient_id: int) -> list[Appointment]:
        self._ensure_patient_exists(patient_id)
        return self._appointments.list_by_patient(patient_id)

    def list_for_doctor(self, doctor_id: int) -> list[Appointment]:
        self._ensure_doctor_exists(doctor_id)
        return self._appointments.list_by_doctor(doctor_id)

    def list_availability(self, doctor_id: int) -> list[Availability]:
        self._ensure_doctor_exists(doctor_id)
        return self._availability.list_by_doctor(doctor_id)

    # --------- Command methods ---------
    def book(self, data: AppointmentCreate) -> Appointment:
        self._ensure_patient_exists(data.patient_id)
        self._ensure_doctor_exists(data.doctor_id)
        self._ensure_slot_available(data)

        appointment = build_appointment_from_create(self._appointments, data)
        return self._appointments.add(appointment)

    def cancel(self, appointment_id: int) -> Appointment:
        appointment = self._get_appointment_or_raise(appointment_id)
        if appointment.status == AppointmentStatus.CANCELED:
            return appointment
        appointment = appointment.model_copy(update={"status": AppointmentStatus.CANCELED})
        return self._appointments.save(appointment)

    def confirm(self, appointment_id: int) -> Appointment:
        appointment = self._get_appointment_or_raise(appointment_id)
        if appointment.status == AppointmentStatus.CANCELED:
            raise ValidationError("Cannot confirm a canceled appointment")
        appointment = appointment.model_copy(update={"status": AppointmentStatus.CONFIRMED})
        return self._appointments.save(appointment)

    def complete(self, appointment_id: int) -> Appointment:
        appointment = self._get_appointment_or_raise(appointment_id)
        if appointment.status != AppointmentStatus.CONFIRMED:
            raise ValidationError("Only confirmed appointments can be completed")
        appointment = appointment.model_copy(update={"status": AppointmentStatus.COMPLETED})
        return self._appointments.save(appointment)

    def create_availability(self, data: AvailabilityCreate) -> Availability:
        self._ensure_doctor_exists(data.doctor_id)
        self._deny_overlapping_availability(data)

        availability = build_availability_from_create(self._availability, data)
        return self._availability.add(availability)

    def update_availability(self, availability_id: int, data: AvailabilityUpdate) -> Availability:
        availability = self._availability.get(availability_id)
        if not availability:
            raise NotFoundError("Availability not found")

        updated = availability.model_copy(update=data.model_dump(exclude_unset=True))
        self._deny_overlapping_availability(updated, skip_id=availability_id)
        return self._availability.save(updated)

    # --------- Internal helpers ---------
    def _ensure_patient_exists(self, patient_id: int) -> None:
        if not self._patients.get(patient_id):
            raise ValidationError("Patient not found")

    def _ensure_doctor_exists(self, doctor_id: int) -> None:
        if not self._doctors.get(doctor_id):
            raise ValidationError("Doctor not found")

    def _get_appointment_or_raise(self, appointment_id: int) -> Appointment:
        appointment = self._appointments.get(appointment_id)
        if not appointment:
            raise NotFoundError("Appointment not found")
        return appointment

    def _ensure_slot_available(self, data: AppointmentCreate) -> None:
        appointments = self._appointments.list_by_doctor(data.doctor_id)
        if not ensure_doctor_is_free(
            appointments, start=data.start_at, end=data.end_at
        ):
            raise ValidationError("Doctor already has an appointment in this slot")

        availabilities = self._availability.list_by_doctor(data.doctor_id)
        for availability in availabilities:
            if availability.start_at <= data.start_at and availability.end_at >= data.end_at:
                return
        raise ValidationError("Doctor is not available in this time range")

    def _deny_overlapping_availability(
        self,
        data: AvailabilityCreate | Availability,
        *,
        skip_id: Optional[int] = None,
    ) -> None:
        availabilities = self._availability.list_by_doctor(data.doctor_id)
        for availability in availabilities:
            if skip_id and availability.id == skip_id:
                continue
            if availability.start_at < data.end_at and data.start_at < availability.end_at:
                raise ValidationError("Overlapping availability slot")

