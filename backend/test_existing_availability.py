#!/usr/bin/env python3
"""
Test script to verify booked block visibility issue using existing availability
"""
import sys
import os
from datetime import datetime, timedelta, timezone

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from app.services.appointments import AppointmentsService, ValidationError
from app.schemas.appointment import AppointmentCreate
from app.db.broker import get_dbbroker


def test_existing_availability_booking():
    """Test booking with existing availability"""
    print("🧪 Testing booking with existing availability...")
    
    broker = get_dbbroker()
    with broker.session() as session:
        service = AppointmentsService(session)
        
        try:
            # Step 1: Get existing availability for doctor 33
            print("\n📅 Step 1: Getting existing availability...")
            from app.models.availability import Availability as AvailabilityModel
            from sqlalchemy import select
            
            availability = session.scalars(
                select(AvailabilityModel)
                .where(AvailabilityModel.doctor_id == 33)
                .where(AvailabilityModel.start_at >= datetime.now(timezone.utc))
                .order_by(AvailabilityModel.start_at)
            ).first()
            
            if not availability:
                print("❌ No existing availability found for doctor 33")
                return False
                
            print(f"Found availability: {availability.start_at} to {availability.end_at}")
            
            # Step 2: Get available blocks before booking
            print("\n📋 Step 2: Getting available blocks before booking...")
            blocks_before = service.list_available_blocks(
                doctor_id=33,
                start_date=availability.start_at,
                end_date=availability.end_at
            )
            
            print(f"✅ Found {len(blocks_before)} available blocks before booking")
            if not blocks_before:
                print("❌ No available blocks found")
                return False
            
            # Use the first available block
            target_block = blocks_before[0]
            print(f"🎯 Using block: {target_block.start_at} to {target_block.end_at}")
            
            # Step 3: Book appointment using the target block
            print("\n📝 Step 3: Booking appointment...")
            appointment_data = AppointmentCreate(
                doctor_id=33,
                patient_id=58,
                start_at=target_block.start_at,
                end_at=target_block.end_at,
                notes="Test appointment with existing availability"
            )
            
            print(f"Booking: {appointment_data}")
            appointment = service.book(appointment_data)
            print(f"✅ Successfully booked appointment with ID: {appointment.id}")
            
            # Step 4: Get available blocks after booking
            print("\n🔍 Step 4: Getting available blocks after booking...")
            blocks_after = service.list_available_blocks(
                doctor_id=33,
                start_date=availability.start_at,
                end_date=availability.end_at
            )
            
            print(f"✅ Found {len(blocks_after)} available blocks after booking")
            
            # Step 5: Verify the booked block is not in the list
            print("\n🔎 Step 5: Verifying booked block is not available...")
            booked_block_found = False
            for block in blocks_after:
                if block.start_at == target_block.start_at and block.end_at == target_block.end_at:
                    booked_block_found = True
                    print(f"❌ ISSUE REPRODUCED: Booked block still appears as available!")
                    print(f"   Block: {block.start_at} to {block.end_at}, is_booked: {block.is_booked}")
                    break
            
            if not booked_block_found:
                print("✅ SUCCESS: Booked block correctly removed from available list")
                return True
            else:
                print("❌ FAILED: Booked block still appears in available blocks")
                return False
                
        except ValidationError as e:
            print(f"❌ Validation error during test: {e}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error during test: {e}")
            import traceback
            traceback.print_exc()
            return False


if __name__ == "__main__":
    print("🧪 Testing booked block visibility with existing availability...\n")
    
    success = test_existing_availability_booking()
    
    print(f"\n{'🎉 Test passed!' if success else '❌ Test failed'}")
    if not success:
        print("\n📝 Summary:")
        print("   ❌ Booked blocks still appear as available")
        print("   🔧 Backend fixes needed for proper block marking")
    
    sys.exit(0 if success else 1)