#!/usr/bin/env python3
"""
Script to fix existing appointments that don't have proper block relationships
"""
import sys
import os
from datetime import datetime, timedelta, timezone

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from app.db.broker import get_dbbroker
from app.models.appointment import Appointment as AppointmentModel
from app.models.appointment_block import AppointmentBlock as AppointmentBlockModel
from app.models.availability import Availability as AvailabilityModel
from sqlalchemy import select


def fix_appointment_block_relationships():
    """Fix appointments that don't have block relationships"""
    print("🔧 Fixing appointment-block relationships...")
    
    broker = get_dbbroker()
    with broker.session() as session:
        # Find all appointments without block_id
        appointments_without_block = session.scalars(
            select(AppointmentModel)
            .where(AppointmentModel.block_id.is_(None))
        ).all()
        
        print(f"Found {len(appointments_without_block)} appointments without block relationships")
        
        fixed_count = 0
        for appointment in appointments_without_block:
            # Find the corresponding block for this appointment's time range
            block = session.scalars(
                select(AppointmentBlockModel)
                .join(AvailabilityModel, AppointmentBlockModel.availability_id == AvailabilityModel.id)
                .where(AvailabilityModel.doctor_id == appointment.doctor_id)
                .where(AppointmentBlockModel.start_at == appointment.start_at)
                .where(AppointmentBlockModel.end_at == appointment.end_at)
                .where(AppointmentBlockModel.is_booked == False)
            ).first()
            
            if block:
                # Link appointment to block and mark block as booked
                appointment.block_id = block.id
                block.is_booked = True
                fixed_count += 1
                print(f"  ✅ Fixed appointment {appointment.id}: linked to block {block.id}")
            else:
                # Try to find any overlapping block
                block = session.scalars(
                    select(AppointmentBlockModel)
                    .join(AvailabilityModel, AppointmentBlockModel.availability_id == AvailabilityModel.id)
                    .where(AvailabilityModel.doctor_id == appointment.doctor_id)
                    .where(AppointmentBlockModel.start_at <= appointment.start_at)
                    .where(AppointmentBlockModel.end_at >= appointment.end_at)
                    .where(AppointmentBlockModel.is_booked == False)
                ).first()
                
                if block:
                    appointment.block_id = block.id
                    block.is_booked = True
                    fixed_count += 1
                    print(f"  ✅ Fixed appointment {appointment.id}: linked to overlapping block {block.id}")
                else:
                    print(f"  ⚠️  Could not find block for appointment {appointment.id}: {appointment.start_at} to {appointment.end_at}")
        
        # Commit all changes
        session.commit()
        print(f"✅ Fixed {fixed_count} appointment-block relationships")
        return fixed_count


def fix_orphaned_blocks():
    """Fix blocks that are marked as booked but don't have appointments"""
    print("\n🔧 Fixing orphaned blocks...")
    
    broker = get_dbbroker()
    with broker.session() as session:
        # Find all blocks marked as booked
        booked_blocks = session.scalars(
            select(AppointmentBlockModel)
            .where(AppointmentBlockModel.is_booked == True)
        ).all()
        
        print(f"Found {len(booked_blocks)} booked blocks")
        
        orphaned_count = 0
        for block in booked_blocks:
            # Check if there's an appointment for this block
            appointment = session.scalars(
                select(AppointmentModel)
                .where(AppointmentModel.block_id == block.id)
            ).first()
            
            if not appointment:
                # Check if there's an appointment in the same time range for the same doctor
                appointment = session.scalars(
                    select(AppointmentModel)
                    .join(AvailabilityModel, AppointmentModel.availability_id == AvailabilityModel.id)
                    .where(AvailabilityModel.doctor_id == block.availability.doctor_id)
                    .where(AppointmentModel.start_at == block.start_at)
                    .where(AppointmentModel.end_at == block.end_at)
                ).first()
                
                if appointment:
                    # Link the existing appointment to this block
                    appointment.block_id = block.id
                    orphaned_count += 1
                    print(f"  ✅ Linked existing appointment {appointment.id} to block {block.id}")
                else:
                    # Mark block as available since no appointment exists
                    block.is_booked = False
                    orphaned_count += 1
                    print(f"  ✅ Marked orphaned block {block.id} as available")
        
        # Commit all changes
        session.commit()
        print(f"✅ Fixed {orphaned_count} orphaned blocks")
        return orphaned_count


if __name__ == "__main__":
    print("🔧 Fixing existing appointment and block data...\n")
    
    fixed_appointments = fix_appointment_block_relationships()
    fixed_blocks = fix_orphaned_blocks()
    
    print(f"\n🎉 Data fix completed!")
    print(f"   Fixed {fixed_appointments} appointment-block relationships")
    print(f"   Fixed {fixed_blocks} orphaned blocks")
    
    if fixed_appointments > 0 or fixed_blocks > 0:
        print("\n📝 Note: Run the test again to verify the fixes worked:")
        print("   python test_booked_block_visibility.py")