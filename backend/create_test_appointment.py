#!/usr/bin/env python3
"""
Script to create a test appointment between sample patient and doctor
to establish the relationship needed for medical record creation.
"""

import sys
import os
from datetime import datetime, timedelta, timezone

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from app.services.appointments import AppointmentsService, ValidationError
from app.schemas.appointment import AppointmentCreate, AvailabilityCreate
from app.db.broker import get_dbbroker


def create_test_appointment():
    """Create a test appointment between sample patient (ID: 5) and doctor (ID: 3)"""
    print("🔄 Creating test appointment between sample patient and doctor...")
    
    broker = get_dbbroker()
    with broker.session() as session:
        service = AppointmentsService(session)
        
        try:
            # Step 1: Create availability for sample doctor (ID: 3)
            print("\n📅 Step 1: Creating availability for sample doctor...")
            tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
            start_time = tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)  # 2 PM
            end_time = tomorrow.replace(hour=15, minute=0, second=0, microsecond=0)   # 3 PM
            
            availability_data = AvailabilityCreate(
                doctor_id=3,  # Sample doctor ID
                start_at=start_time,
                end_at=end_time
            )
            
            print(f"Creating availability: {start_time} to {end_time}")
            availability = service.create_availability(availability_data)
            print(f"✅ Created availability with ID: {availability.id}")
            
            # Step 2: Get available blocks
            print("\n📋 Step 2: Getting available blocks...")
            blocks = service.list_available_blocks(
                doctor_id=3,
                start_date=start_time,
                end_date=end_time
            )
            
            if not blocks:
                print("❌ No available blocks found")
                return False
                
            print(f"✅ Found {len(blocks)} available blocks")
            first_block = blocks[0]
            print(f"First block: {first_block.start_at} to {first_block.end_at}")
            
            # Step 3: Book appointment for sample patient (ID: 5)
            print("\n📝 Step 3: Booking appointment for sample patient...")
            appointment_data = AppointmentCreate(
                doctor_id=3,      # Sample doctor ID
                patient_id=5,     # Sample patient ID
                start_at=first_block.start_at,
                end_at=first_block.end_at,
                notes="Test appointment for medical record creation"
            )
            
            print(f"Booking: {appointment_data}")
            appointment = service.book(appointment_data)
            print(f"✅ Successfully booked appointment with ID: {appointment.id}")
            
            # Step 4: Verify the appointment was created correctly
            print("\n🔍 Step 4: Verifying appointment...")
            if appointment.doctor_id == 3 and appointment.patient_id == 5:
                print("✅ Appointment created with correct doctor and patient")
            else:
                print(f"❌ Appointment has incorrect doctor or patient. Got: doctor_id={appointment.doctor_id}, patient_id={appointment.patient_id}")
                return False
                
            if appointment.status == "pending":
                print("✅ Appointment has correct status")
            else:
                print(f"❌ Appointment has wrong status: {appointment.status}")
                return False
            
            print("\n🎉 Test appointment created successfully!")
            print(f"Sample patient (ID: 5) should now appear in Dr. Sarah Doctor's patient list")
            print(f"Appointment ID: {appointment.id}")
            return True
            
        except ValidationError as e:
            print(f"❌ Validation error during appointment creation: {e}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error during appointment creation: {e}")
            import traceback
            traceback.print_exc()
            return False


if __name__ == "__main__":
    print("🧪 Creating test appointment between sample accounts...\n")
    
    success = create_test_appointment()
    
    print(f"\n{'🎉 Test appointment created successfully!' if success else '❌ Failed to create test appointment'}")
    sys.exit(0 if success else 1)