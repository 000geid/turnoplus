"""
Tests for appointment cancellation functionality.

This test suite verifies that cancelling appointments correctly frees the
associated availability blocks, allowing other patients to rebook the slots.
"""
from datetime import datetime, timezone, timedelta
import pytest

from app.services.appointments import AppointmentsService
from app.schemas.appointment import AvailabilityCreate, AppointmentCreate
from app.models.enums import AppointmentStatus
from app.models.appointment import Appointment as AppointmentModel


def test_cancellation_frees_availability_block(db_session, sample_doctor, sample_patient):
    """Test that cancelling an appointment frees the availability block."""
    service = AppointmentsService(db_session)
    
    # Create availability for tomorrow
    start_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(days=1)
    end_time = start_time + timedelta(hours=2)
    
    availability = service.create_availability(AvailabilityCreate(
        doctor_id=sample_doctor.id,
        start_at=start_time,
        end_at=end_time
    ))
    
    # Get available blocks before booking
    blocks_before = service.list_available_blocks(
        sample_doctor.id, start_time, end_time
    )
    assert len(blocks_before) > 0, "Should have available blocks"
    initial_available_count = len(blocks_before)
    
    # Book appointment (consumes a block)
    first_block = blocks_before[0]
    appointment = service.book(AppointmentCreate(
        doctor_id=sample_doctor.id,
        patient_id=sample_patient.id,
        start_at=first_block.start_at,
        end_at=first_block.end_at,
        notes="Test booking to be cancelled"
    ))
    
    # Verify appointment was created and block is linked
    assert appointment.id is not None
    assert appointment.status == AppointmentStatus.PENDING
    
    # Verify block is booked (one less available)
    blocks_after_booking = service.list_available_blocks(
        sample_doctor.id, start_time, end_time
    )
    assert len(blocks_after_booking) == initial_available_count - 1, "Block should be consumed"
    
    # Cancel the appointment
    cancelled = service.cancel(appointment.id)
    assert cancelled.status == AppointmentStatus.CANCELED
    
    # Verify block is freed (back to original count)
    blocks_after_cancel = service.list_available_blocks(
        sample_doctor.id, start_time, end_time
    )
    assert len(blocks_after_cancel) == initial_available_count, "Block should be freed after cancellation"


def test_rebook_cancelled_slot(db_session, sample_doctor, sample_patient, another_patient):
    """Test that another patient can book a slot freed by cancellation."""
    service = AppointmentsService(db_session)
    
    # Create availability
    start_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(days=1)
    end_time = start_time + timedelta(hours=1)
    
    service.create_availability(AvailabilityCreate(
        doctor_id=sample_doctor.id,
        start_at=start_time,
        end_at=end_time
    ))
    
    # Get the first available block
    blocks = service.list_available_blocks(sample_doctor.id, start_time, end_time)
    assert len(blocks) > 0
    target_block = blocks[0]
    
    # Patient 1 books the slot
    appointment1 = service.book(AppointmentCreate(
        doctor_id=sample_doctor.id,
        patient_id=sample_patient.id,
        start_at=target_block.start_at,
        end_at=target_block.end_at,
        notes="Patient 1 booking"
    ))
    
    # Verify slot is no longer available
    blocks_after_booking = service.list_available_blocks(sample_doctor.id, start_time, end_time)
    assert len(blocks_after_booking) == len(blocks) - 1
    
    # Patient 1 cancels
    service.cancel(appointment1.id)
    
    # Verify slot is available again
    blocks_after_cancel = service.list_available_blocks(sample_doctor.id, start_time, end_time)
    assert len(blocks_after_cancel) == len(blocks), "Slot should be available after cancellation"
    
    # Patient 2 should be able to book the same slot
    appointment2 = service.book(AppointmentCreate(
        doctor_id=sample_doctor.id,
        patient_id=another_patient.id,
        start_at=target_block.start_at,
        end_at=target_block.end_at,
        notes="Patient 2 rebooking cancelled slot"
    ))
    
    assert appointment2.id != appointment1.id, "Should be a different appointment"
    assert appointment2.status == AppointmentStatus.PENDING
    
    # Verify the slot is consumed again
    blocks_final = service.list_available_blocks(sample_doctor.id, start_time, end_time)
    assert len(blocks_final) == len(blocks) - 1, "Slot should be consumed by patient 2"


def test_cancel_without_block(db_session, sample_doctor, sample_patient):
    """Test cancelling appointment without associated block doesn't crash."""
    service = AppointmentsService(db_session)
    
    # Create appointment directly without going through normal booking flow
    # (simulates legacy data or appointments created differently)
    start_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(days=1)
    
    appointment = AppointmentModel(
        doctor_id=sample_doctor.id,
        patient_id=sample_patient.id,
        start_at=start_time,
        end_at=start_time + timedelta(hours=1),
        status=AppointmentStatus.PENDING,
        block_id=None  # No block linked
    )
    db_session.add(appointment)
    db_session.flush()
    
    # Should not crash when cancelling
    cancelled = service.cancel(appointment.id)
    assert cancelled.status == AppointmentStatus.CANCELED


def test_cancel_idempotency(db_session, sample_doctor, sample_patient):
    """Test that cancelling twice doesn't cause issues (idempotent operation)."""
    service = AppointmentsService(db_session)
    
    # Create availability
    start_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(days=1)
    end_time = start_time + timedelta(hours=1)
    
    service.create_availability(AvailabilityCreate(
        doctor_id=sample_doctor.id,
        start_at=start_time,
        end_at=end_time
    ))
    
    # Get blocks and book an appointment
    blocks = service.list_available_blocks(sample_doctor.id, start_time, end_time)
    initial_count = len(blocks)
    
    appointment = service.book(AppointmentCreate(
        doctor_id=sample_doctor.id,
        patient_id=sample_patient.id,
        start_at=blocks[0].start_at,
        end_at=blocks[0].end_at,
        notes="Test idempotency"
    ))
    
    # Cancel once
    cancelled_first = service.cancel(appointment.id)
    assert cancelled_first.status == AppointmentStatus.CANCELED
    
    # Verify block is freed
    blocks_after_first_cancel = service.list_available_blocks(sample_doctor.id, start_time, end_time)
    assert len(blocks_after_first_cancel) == initial_count
    
    # Cancel again - should be idempotent (no errors, same result)
    cancelled_second = service.cancel(appointment.id)
    assert cancelled_second.status == AppointmentStatus.CANCELED
    
    # Block should still be free (not double-freed or broken)
    blocks_after_second_cancel = service.list_available_blocks(sample_doctor.id, start_time, end_time)
    assert len(blocks_after_second_cancel) == initial_count


def test_multiple_cancellations_different_slots(db_session, sample_doctor, sample_patient, another_patient):
    """Test cancelling multiple appointments frees all their blocks correctly."""
    service = AppointmentsService(db_session)
    
    # Create availability with multiple blocks
    start_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(days=1)
    end_time = start_time + timedelta(hours=3)
    
    service.create_availability(AvailabilityCreate(
        doctor_id=sample_doctor.id,
        start_at=start_time,
        end_at=end_time
    ))
    
    # Get all blocks
    blocks = service.list_available_blocks(sample_doctor.id, start_time, end_time)
    assert len(blocks) >= 2, "Need at least 2 blocks for this test"
    initial_count = len(blocks)
    
    # Book two different appointments
    appointment1 = service.book(AppointmentCreate(
        doctor_id=sample_doctor.id,
        patient_id=sample_patient.id,
        start_at=blocks[0].start_at,
        end_at=blocks[0].end_at,
        notes="First appointment"
    ))
    
    appointment2 = service.book(AppointmentCreate(
        doctor_id=sample_doctor.id,
        patient_id=another_patient.id,
        start_at=blocks[1].start_at,
        end_at=blocks[1].end_at,
        notes="Second appointment"
    ))
    
    # Verify both blocks are consumed
    blocks_after_booking = service.list_available_blocks(sample_doctor.id, start_time, end_time)
    assert len(blocks_after_booking) == initial_count - 2
    
    # Cancel first appointment
    service.cancel(appointment1.id)
    
    # Verify one block is freed
    blocks_after_first_cancel = service.list_available_blocks(sample_doctor.id, start_time, end_time)
    assert len(blocks_after_first_cancel) == initial_count - 1
    
    # Cancel second appointment
    service.cancel(appointment2.id)
    
    # Verify both blocks are freed
    blocks_after_second_cancel = service.list_available_blocks(sample_doctor.id, start_time, end_time)
    assert len(blocks_after_second_cancel) == initial_count


def test_cancel_confirmed_appointment_frees_block(db_session, sample_doctor, sample_patient):
    """Test that cancelling a confirmed (not just pending) appointment also frees the block."""
    service = AppointmentsService(db_session)
    
    # Create availability and book
    start_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(days=1)
    end_time = start_time + timedelta(hours=1)
    
    service.create_availability(AvailabilityCreate(
        doctor_id=sample_doctor.id,
        start_at=start_time,
        end_at=end_time
    ))
    
    blocks = service.list_available_blocks(sample_doctor.id, start_time, end_time)
    initial_count = len(blocks)
    
    appointment = service.book(AppointmentCreate(
        doctor_id=sample_doctor.id,
        patient_id=sample_patient.id,
        start_at=blocks[0].start_at,
        end_at=blocks[0].end_at,
        notes="To be confirmed then cancelled"
    ))
    
    # Confirm the appointment
    confirmed = service.confirm(appointment.id)
    assert confirmed.status == AppointmentStatus.CONFIRMED
    
    # Cancel the confirmed appointment
    cancelled = service.cancel(appointment.id)
    assert cancelled.status == AppointmentStatus.CANCELED
    
    # Verify block is freed even though appointment was confirmed
    blocks_after_cancel = service.list_available_blocks(sample_doctor.id, start_time, end_time)
    assert len(blocks_after_cancel) == initial_count
