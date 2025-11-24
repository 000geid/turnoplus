#!/usr/bin/env python3
"""
Test script to reproduce and verify the booked block visibility issue
"""
import sys
import os
from datetime import datetime, timedelta, timezone

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from app.services.appointments import AppointmentsService, ValidationError
from app.schemas.appointment import AppointmentCreate, AvailabilityCreate
from app.db.broker import get_dbbroker


def test_booked_block_visibility():
    """Test that booked blocks don't appear in available blocks list"""
    print("🧪 Testing booked block visibility...")
    
    broker = get_dbbroker()
    with broker.session() as session:
        service = AppointmentsService(session)
        
        try:
            # Step 1: Create availability for doctor 33 on Sunday Nov 2nd, 2025
            print("\n📅 Step 1: Creating availability for Sunday Nov 2nd...")
            sunday_nov_2 = datetime(2025, 11, 2, 10, 0, 0, tzinfo=timezone.utc)  # 10 AM UTC
            end_time = sunday_nov_2.replace(hour=14, minute=0)  # 2 PM UTC
            
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
            if blocks_before:
                # Find the 11 AM - 12 PM block (which would be 8 AM - 9 AM UTC if in Argentina)
                target_block = None
                for block in blocks_before:
                    # Convert to local time for display (assuming Argentina timezone UTC-3)
                    argentina_tz = timezone(timedelta(hours=-3))
                    local_time = block.start_at.astimezone(argentina_tz)
                    if local_time.hour == 11 and local_time.minute == 0:
                        target_block = block
                        break
                
                if target_block:
                    print(f"🎯 Found target block: {target_block.start_at} to {target_block.end_at}")
                else:
                    print("⚠️  Target block (11 AM - 12 PM) not found, using first block")
                    target_block = blocks_before[0]
            else:
                print("❌ No available blocks found")
                return False
            
            # Step 3: Book appointment using the target block
            print("\n📝 Step 3: Booking appointment...")
            appointment_data = AppointmentCreate(
                doctor_id=33,
                patient_id=58,
                start_at=target_block.start_at,
                end_at=target_block.end_at,
                notes="Test appointment for booked block visibility"
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


def test_database_consistency():
    """Test database consistency between appointments and blocks"""
    print("\n🔗 Testing database consistency...")
    
    broker = get_dbbroker()
    with broker.session() as session:
        from app.models.appointment import Appointment as AppointmentModel
        from app.models.appointment_block import AppointmentBlock as AppointmentBlockModel
        from sqlalchemy import select
        
        # Check for appointments without corresponding block relationship
        appointments_without_block = session.scalars(
            select(AppointmentModel)
            .where(AppointmentModel.block_id.is_(None))
        ).all()
        
        if appointments_without_block:
            print(f"⚠️  Found {len(appointments_without_block)} appointments without block relationship")
            for apt in appointments_without_block[:3]:  # Show first 3
                print(f"   Appointment {apt.id}: {apt.start_at} to {apt.end_at}")
        else:
            print("✅ All appointments have proper block relationships")
        
        # Check for blocks marked as booked without corresponding appointment
        booked_blocks_without_appointment = session.scalars(
            select(AppointmentBlockModel)
            .where(AppointmentBlockModel.is_booked == True)
        ).all()
        
        orphaned_blocks = []
        for block in booked_blocks_without_appointment:
            has_appointment = session.scalars(
                select(AppointmentModel)
                .where(AppointmentModel.block_id == block.id)
            ).first()
            if not has_appointment:
                orphaned_blocks.append(block)
        
        if orphaned_blocks:
            print(f"⚠️  Found {len(orphaned_blocks)} booked blocks without appointments")
            for block in orphaned_blocks[:3]:  # Show first 3
                print(f"   Block {block.id}: {block.start_at} to {block.end_at}")
        else:
            print("✅ All booked blocks have corresponding appointments")
        
        return len(appointments_without_block) == 0 and len(orphaned_blocks) == 0


if __name__ == "__main__":
    print("🧪 Testing booked block visibility issue...\n")
    
    success = True
    success &= test_booked_block_visibility()
    success &= test_database_consistency()
    
    print(f"\n{'🎉 All tests passed!' if success else '❌ Some tests failed'}")
    if not success:
        print("\n📝 Summary:")
        print("   ❌ Booked blocks still appear as available")
        print("   🔧 Backend fixes needed for proper block marking")
        print("   🔄 Transaction management may need improvement")
    
    sys.exit(0 if success else 1)