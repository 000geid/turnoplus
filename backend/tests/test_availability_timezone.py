"""
Tests for doctor availability timezone handling.

This test suite ensures that availability creation and retrieval work correctly
across timezone boundaries, particularly for Buenos Aires (GMT-3).
"""
from datetime import datetime, timezone, timedelta
import pytest

from app.services.appointments import AppointmentsService
from app.schemas.appointment import AvailabilityCreate


def test_december_2025_afternoon_availability(db_session, sample_doctor):
    """
    Test creating availability for December 2025 afternoon doesn't shift dates.
    
    Simulates a doctor in Buenos Aires (GMT-3) creating availability for:
    - Date: December 5, 2025
    - Time: 14:00-18:00 (local time)
    - UTC equivalent: December 5, 17:00 - December 5, 21:00
    """
    service = AppointmentsService(db_session)
    
    # Convert Buenos Aires local time to UTC
    # Dec 5, 2025, 14:00 GMT-3 = Dec 5, 2025, 17:00 UTC
    start_at = datetime(2025, 12, 5, 17, 0, 0, tzinfo=timezone.utc)
    end_at = datetime(2025, 12, 5, 21, 0, 0, tzinfo=timezone.utc)
    
    availability_data = AvailabilityCreate(
        doctor_id=sample_doctor.id,
        start_at=start_at,
        end_at=end_at
    )
    
    result = service.create_availability(availability_data)
    
    # Verify the stored times are correct in UTC
    assert result.start_at.replace(tzinfo=timezone.utc) == start_at
    assert result.end_at.replace(tzinfo=timezone.utc) == end_at
    
    # Verify when displayed in Buenos Aires time, it shows the correct date
    buenos_aires_tz = timezone(timedelta(hours=-3))
    local_start = result.start_at.replace(tzinfo=timezone.utc).astimezone(buenos_aires_tz)
    local_end = result.end_at.replace(tzinfo=timezone.utc).astimezone(buenos_aires_tz)
    
    assert local_start.day == 5
    assert local_start.month == 12
    assert local_start.year == 2025
    assert local_start.hour == 14
    
    assert local_end.day == 5
    assert local_end.month == 12
    assert local_end.hour == 18


def test_december_2025_evening_availability_no_date_shift(db_session, sample_doctor):
    """
    Test evening availability doesn't shift to next day (critical bug case).
    
    This is the original bug: selecting Dec 5, 21:00 would appear as Dec 6.
    
    Simulates:
    - Date: December 5, 2025
    - Time: 21:00-22:00 (Buenos Aires local time)
    - UTC equivalent: December 6, 00:00 - December 6, 01:00
    
    The key is that when converted back to Buenos Aires time, it should
    still show as December 5, 21:00, not December 6.
    """
    service = AppointmentsService(db_session)
    
    # Dec 5, 2025, 21:00 GMT-3 = Dec 6, 2025, 00:00 UTC
    start_at = datetime(2025, 12, 6, 0, 0, 0, tzinfo=timezone.utc)
    end_at = datetime(2025, 12, 6, 1, 0, 0, tzinfo=timezone.utc)
    
    availability_data = AvailabilityCreate(
        doctor_id=sample_doctor.id,
        start_at=start_at,
        end_at=end_at
    )
    
    result = service.create_availability(availability_data)
    
    # Verify UTC times are stored correctly
    assert result.start_at.replace(tzinfo=timezone.utc) == start_at
    assert result.end_at.replace(tzinfo=timezone.utc) == end_at
    
    # The critical check: when converted to Buenos Aires time, should be Dec 5
    buenos_aires_tz = timezone(timedelta(hours=-3))
    local_start = result.start_at.replace(tzinfo=timezone.utc).astimezone(buenos_aires_tz)
    local_end = result.end_at.replace(tzinfo=timezone.utc).astimezone(buenos_aires_tz)
    
    # This is what the user sees - should be Dec 5, not Dec 6!
    assert local_start.day == 5, f"Expected day 5, got {local_start.day}"
    assert local_start.month == 12
    assert local_start.year == 2025
    assert local_start.hour == 21
    
    assert local_end.day == 5
    assert local_end.hour == 22


def test_december_2025_early_morning_availability(db_session, sample_doctor):
    """
    Test early morning availability doesn't shift to previous day.
    
    Simulates:
    - Date: December 5, 2025
    - Time: 08:00-09:00 (Buenos Aires local time)
    - UTC equivalent: December 5, 11:00 - December 5, 12:00
    """
    service = AppointmentsService(db_session)
    
    # Dec 5, 2025, 08:00 GMT-3 = Dec 5, 2025, 11:00 UTC
    start_at = datetime(2025, 12, 5, 11, 0, 0, tzinfo=timezone.utc)
    end_at = datetime(2025, 12, 5, 12, 0, 0, tzinfo=timezone.utc)
    
    availability_data = AvailabilityCreate(
        doctor_id=sample_doctor.id,
        start_at=start_at,
        end_at=end_at
    )
    
    result = service.create_availability(availability_data)
    
    # Verify when displayed in Buenos Aires time
    buenos_aires_tz = timezone(timedelta(hours=-3))
    local_start = result.start_at.replace(tzinfo=timezone.utc).astimezone(buenos_aires_tz)
    
    assert local_start.day == 5
    assert local_start.month == 12
    assert local_start.hour == 8


def test_year_boundary_december_31_to_january_1(db_session, sample_doctor):
    """
    Test availability creation across year boundary.
    
    Simulates:
    - Date: December 31, 2025
    - Time: 23:00-00:00 (crosses midnight, Buenos Aires local time)
    - UTC equivalent: January 1, 2026, 02:00 - January 1, 2026, 03:00
    """
    service = AppointmentsService(db_session)
    
    # Dec 31, 2025, 23:00 GMT-3 = Jan 1, 2026, 02:00 UTC
    start_at = datetime(2026, 1, 1, 2, 0, 0, tzinfo=timezone.utc)
    end_at = datetime(2026, 1, 1, 3, 0, 0, tzinfo=timezone.utc)
    
    availability_data = AvailabilityCreate(
        doctor_id=sample_doctor.id,
        start_at=start_at,
        end_at=end_at
    )
    
    result = service.create_availability(availability_data)
    
    # Verify when displayed in Buenos Aires time, shows Dec 31, 2025
    buenos_aires_tz = timezone(timedelta(hours=-3))
    local_start = result.start_at.replace(tzinfo=timezone.utc).astimezone(buenos_aires_tz)
    
    assert local_start.day == 31
    assert local_start.month == 12
    assert local_start.year == 2025
    assert local_start.hour == 23


def test_january_2026_availability(db_session, sample_doctor):
    """
    Test availability creation for dates in 2026.
    
    Simulates:
    - Date: January 15, 2026
    - Time: 14:00-18:00 (Buenos Aires local time)
    """
    service = AppointmentsService(db_session)
    
    # Jan 15, 2026, 14:00 GMT-3 = Jan 15, 2026, 17:00 UTC
    start_at = datetime(2026, 1, 15, 17, 0, 0, tzinfo=timezone.utc)
    end_at = datetime(2026, 1, 15, 21, 0, 0, tzinfo=timezone.utc)
    
    availability_data = AvailabilityCreate(
        doctor_id=sample_doctor.id,
        start_at=start_at,
        end_at=end_at
    )
    
    result = service.create_availability(availability_data)
    
    # Verify correct date in local timezone
    buenos_aires_tz = timezone(timedelta(hours=-3))
    local_start = result.start_at.replace(tzinfo=timezone.utc).astimezone(buenos_aires_tz)
    
    assert local_start.day == 15
    assert local_start.month == 1
    assert local_start.year == 2026


def test_list_availability_preserves_timezone(db_session, sample_doctor):
    """
    Test that listing availability returns correct timezone-aware datetimes.
    """
    service = AppointmentsService(db_session)
    
    # Create availability for Dec 5, 2025, 21:00-22:00 Buenos Aires time
    start_at = datetime(2025, 12, 6, 0, 0, 0, tzinfo=timezone.utc)
    end_at = datetime(2025, 12, 6, 1, 0, 0, tzinfo=timezone.utc)
    
    service.create_availability(AvailabilityCreate(
        doctor_id=sample_doctor.id,
        start_at=start_at,
        end_at=end_at
    ))
    
    # List availability
    availability_list = service.list_availability(sample_doctor.id)
    
    assert len(availability_list) > 0
    
    # Verify the returned data has correct timezone info
    first_avail = availability_list[0]
    assert first_avail.start_at.replace(tzinfo=timezone.utc) == start_at
    assert first_avail.end_at.replace(tzinfo=timezone.utc) == end_at
    
    # Verify when converted to Buenos Aires time, shows intended date
    buenos_aires_tz = timezone(timedelta(hours=-3))
    local_start = first_avail.start_at.replace(tzinfo=timezone.utc).astimezone(buenos_aires_tz)
    
    assert local_start.day == 5
    assert local_start.month == 12
    assert local_start.hour == 21
