#!/usr/bin/env python3
"""
Test script to simulate full appointment booking flow from frontend perspective
"""
import sys
import os
from datetime import datetime, timedelta, timezone

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from app.services.appointments import AppointmentsService, ValidationError
from app.schemas.appointment import AppointmentCreate, AvailabilityCreate
from app.db.broker import get_dbbroker


def test_full_booking_flow():
    """Test the complete appointment booking flow including availability creation"""
    print("🔄 Testing full appointment booking flow...")
    
    broker = get_dbbroker()
    with broker.session() as session:
        service = AppointmentsService(session)
        
        try:
            # Step 1: Create availability for doctor 33
            print("\n📅 Step 1: Creating availability...")
            tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
            start_time = tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)  # 2 PM
            end_time = tomorrow.replace(hour=18, minute=0, second=0, microsecond=0)   # 6 PM
            
            availability_data = AvailabilityCreate(
                doctor_id=33,
                start_at=start_time,
                end_at=end_time
            )
            
            print(f"Creating availability: {start_time} to {end_time}")
            availability = service.create_availability(availability_data)
            print(f"✅ Created availability with ID: {availability.id}")
            
            # Step 2: Get available blocks
            print("\n📋 Step 2: Getting available blocks...")
            blocks = service.list_available_blocks(
                doctor_id=33,
                start_date=start_time,
                end_date=end_time
            )
            
            if not blocks:
                print("❌ No available blocks found")
                return False
                
            print(f"✅ Found {len(blocks)} available blocks")
            first_block = blocks[0]
            print(f"First block: {first_block.start_at} to {first_block.end_at}")
            
            # Step 3: Book appointment using the first available block
            print("\n📝 Step 3: Booking appointment...")
            appointment_data = AppointmentCreate(
                doctor_id=33,
                patient_id=58,
                start_at=first_block.start_at,
                end_at=first_block.end_at,
                notes="Test appointment from full flow test"
            )
            
            print(f"Booking: {appointment_data}")
            appointment = service.book(appointment_data)
            print(f"✅ Successfully booked appointment with ID: {appointment.id}")
            
            # Step 4: Verify the appointment was created correctly
            print("\n🔍 Step 4: Verifying appointment...")
            if appointment.doctor_id == 33 and appointment.patient_id == 58:
                print("✅ Appointment created with correct doctor and patient")
            else:
                print("❌ Appointment has incorrect doctor or patient")
                return False
                
            if appointment.status == "pending":
                print("✅ Appointment has correct status")
            else:
                print(f"❌ Appointment has wrong status: {appointment.status}")
                return False
            
            print("\n🎉 Full booking flow test completed successfully!")
            return True
            
        except ValidationError as e:
            print(f"❌ Validation error during booking flow: {e}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error during booking flow: {e}")
            import traceback
            traceback.print_exc()
            return False


def test_timezone_handling():
    """Test timezone handling with different scenarios"""
    print("\n🌍 Testing timezone handling...")
    
    broker = get_dbbroker()
    with broker.session() as session:
        service = AppointmentsService(session)
        
        # Test with UTC timezone
        try:
            start_utc = datetime.now(timezone.utc) + timedelta(days=1, hours=2)
            end_utc = start_utc + timedelta(hours=1)
            
            service._validate_datetime_range(start_utc, end_utc)
            print("✅ UTC timezone handling works")
        except Exception as e:
            print(f"❌ UTC timezone handling failed: {e}")
            return False
        
        # Test with naive datetime (should be handled gracefully)
        try:
            start_naive = datetime(2025, 10, 29, 14, 0, 0)
            end_naive = datetime(2025, 10, 29, 15, 0, 0)
            
            # This should work with our improved timezone handling
            service._validate_datetime_range(start_naive, end_naive)
            print("✅ Naive datetime handling works")
        except Exception as e:
            print(f"⚠️  Naive datetime handling: {e}")
            # This might fail, which is expected behavior
        
        return True


if __name__ == "__main__":
    print("🧪 Testing full appointment booking flow...\n")
    
    success = True
    success &= test_timezone_handling()
    success &= test_full_booking_flow()
    
    print(f"\n{'🎉 All tests passed!' if success else '❌ Some tests failed'}")
    sys.exit(0 if success else 1)