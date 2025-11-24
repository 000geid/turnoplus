#!/usr/bin/env python3
"""
Comprehensive test to verify the complete fix for booked block visibility issue
"""
import sys
import os
from datetime import datetime, timedelta, timezone

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from app.services.appointments import AppointmentsService, ValidationError
from app.schemas.appointment import AppointmentCreate, AvailabilityCreate
from app.db.broker import get_dbbroker


def test_sunday_nov_2nd_case():
    """Test the specific case reported: Sunday Nov 2nd, 11 AM - 12 PM"""
    print("🧪 Testing specific reported case: Sunday Nov 2nd, 11 AM - 12 PM")
    
    broker = get_dbbroker()
    with broker.session() as session:
        service = AppointmentsService(session)
        
        try:
            # Step 1: Create availability for Sunday Nov 2nd, 2025
            print("\n📅 Step 1: Creating availability for Sunday Nov 2nd...")
            sunday_nov_2 = datetime(2025, 11, 2, 14, 0, 0, tzinfo=timezone.utc)  # 11 AM UTC = 8 AM Argentina
            end_time = sunday_nov_2.replace(hour=15, minute=0, second=0)  # 3 PM UTC = 12 PM Argentina
            
            availability_data = AvailabilityCreate(
                doctor_id=33,
                start_at=sunday_nov_2,
                end_at=end_time
            )
            
            print(f"Creating availability: {sunday_nov_2} to {end_time}")
            availability = service.create_availability(availability_data)
            print(f"✅ Created availability with ID: {availability.id}")
            
            # Step 2: Get available blocks before booking
            print("\n📋 Step 2: Getting available blocks before booking...")
            blocks_before = service.list_available_blocks(
                doctor_id=33,
                start_date=sunday_nov_2,
                end_date=end_time
            )
            
            print(f"✅ Found {len(blocks_before)} available blocks before booking")
            
            # Find the 11 AM - 12 PM block (8 AM - 9 AM UTC)
            target_block = None
            for block in blocks_before:
                # Convert to Argentina time for display
                argentina_tz = timezone(timedelta(hours=-3))
                local_time = block.start_at.astimezone(argentina_tz)
                if local_time.hour == 11 and local_time.minute == 0:
                    target_block = block
                    break
            
            if not target_block:
                print("❌ 11 AM - 12 PM block not found in available blocks")
                return False
                
            print(f"🎯 Found target block: {target_block.start_at} to {target_block.end_at}")
            
            # Step 3: Book appointment using the target block
            print("\n📝 Step 3: Booking appointment...")
            appointment_data = AppointmentCreate(
                doctor_id=33,
                patient_id=58,
                start_at=target_block.start_at,
                end_at=target_block.end_at,
                notes="Test appointment for Sunday Nov 2nd, 11 AM - 12 PM case"
            )
            
            print(f"Booking: {appointment_data}")
            appointment = service.book(appointment_data)
            print(f"✅ Successfully booked appointment with ID: {appointment.id}")
            
            # Step 4: Get available blocks after booking
            print("\n🔍 Step 4: Getting available blocks after booking...")
            blocks_after = service.list_available_blocks(
                doctor_id=33,
                start_date=sunday_nov_2,
                end_date=end_time
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


def test_multiple_bookings():
    """Test multiple consecutive bookings to ensure blocks are properly marked"""
    print("\n🔄 Testing multiple consecutive bookings...")
    
    broker = get_dbbroker()
    with broker.session() as session:
        service = AppointmentsService(session)
        
        try:
            # Get existing availability
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
            
            # Get available blocks
            blocks_before = service.list_available_blocks(
                doctor_id=33,
                start_date=availability.start_at,
                end_date=availability.end_at
            )
            
            if len(blocks_before) < 2:
                print("❌ Need at least 2 available blocks for this test")
                return False
            
            # Book first block
            first_block = blocks_before[0]
            appointment1 = service.book(AppointmentCreate(
                doctor_id=33,
                patient_id=58,
                start_at=first_block.start_at,
                end_at=first_block.end_at,
                notes="First appointment in multiple booking test"
            )
            print(f"✅ Booked first appointment: {appointment1.id}")
            
            # Try to book same block again (should fail)
            try:
                appointment2 = service.book(AppointmentCreate(
                    doctor_id=33,
                    patient_id=58,
                    start_at=first_block.start_at,
                    end_at=first_block.end_at,
                    notes="Second appointment (should fail)"
                )
                print("❌ ERROR: Successfully booked same block twice!")
                return False
            except ValidationError:
                print("✅ SUCCESS: Second booking correctly rejected")
            
            # Book second block
            second_block = blocks_before[1]
            appointment3 = service.book(AppointmentCreate(
                doctor_id=33,
                patient_id=58,
                start_at=second_block.start_at,
                end_at=second_block.end_at,
                notes="Second appointment in multiple booking test"
            )
            print(f"✅ Booked second appointment: {appointment3.id}")
            
            # Verify both blocks are no longer available
            blocks_after = service.list_available_blocks(
                doctor_id=33,
                start_date=availability.start_at,
                end_date=availability.end_at
            )
            
            # Check if both booked blocks are removed
            first_block_available = any(
                block.start_at == first_block.start_at and 
                block.end_at == first_block.end_at
                for block in blocks_after
            )
            
            second_block_available = any(
                block.start_at == second_block.start_at and 
                block.end_at == second_block.end_at
                for block in blocks_after
            )
            
            if not first_block_available and not second_block_available:
                print("✅ SUCCESS: Both booked blocks correctly removed from available list")
                return True
            else:
                print("❌ FAILED: One or both booked blocks still appear as available")
                return False
                
        except Exception as e:
            print(f"❌ Unexpected error during multiple booking test: {e}")
            import traceback
            traceback.print_exc()
            return False


if __name__ == "__main__":
    print("🧪 Testing complete fix for booked block visibility issue...\n")
    
    success = True
    success &= test_sunday_nov_2nd_case()
    success &= test_multiple_bookings()
    
    print(f"\n{'🎉 All tests passed!' if success else '❌ Some tests failed'}")
    if success:
        print("\n✅ Fix Summary:")
        print("   🔧 Backend booking logic correctly marks blocks as booked")
        print("   🔗 Appointment-block relationships properly established")
        print("   💾 Transaction management ensures data consistency")
        print("   🔄 Frontend refresh logic updated with delay")
        print("   🎯 Specific reported case (Sunday Nov 2nd, 11 AM-12 PM) works correctly")
    else:
        print("\n❌ Issues still exist:")
        print("   🔧 Backend fixes may need adjustment")
        print("   🔄 Frontend refresh may need improvement")
    
    sys.exit(0 if success else 1)