
import sys
import os
from datetime import datetime, timedelta, timezone

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), "../../src"))

from app.db.broker import get_dbbroker
from app.services.appointments import AppointmentsService
from app.services.doctors import DoctorsService
from app.schemas.user import DoctorCreate
from app.schemas.appointment import AvailabilityCreate

def test_block_deletion():
    broker = get_dbbroker()
    
    # Create unique email for test
    email = f"test_doctor_{datetime.now().timestamp()}@example.com"
    
    with broker.session() as session:
        print(f"Creating doctor {email}...")
        doc_svc = DoctorsService(session)
        doctor = doc_svc.create(DoctorCreate(
            email=email,
            password="password123",
            full_name="Test Doctor",
            specialty="General",
            license_number=f"LIC-{datetime.now().timestamp()}"
        ))
        
        print(f"Doctor created with ID: {doctor.id}")
        
        # Create availability: 9:00 - 11:00 (4 blocks of 30 mins)
        # 9:00-9:30, 9:30-10:00, 10:00-10:30, 10:30-11:00
        appt_svc = AppointmentsService(session)
        
        # Create availability: 12:00 - 15:00 (3 blocks of 60 mins)
        # 12:00-13:00, 13:00-14:00, 14:00-15:00
        appt_svc = AppointmentsService(session)
        
        # Use a future date
        start_at = datetime.now(timezone.utc).replace(hour=12, minute=0, second=0, microsecond=0) + timedelta(days=1)
        end_at = start_at + timedelta(hours=3)
        
        print(f"Creating availability from {start_at} to {end_at}...")
        availability = appt_svc.create_availability(AvailabilityCreate(
            doctor_id=doctor.id,
            start_at=start_at,
            end_at=end_at
        ))
        
        print(f"Availability created with ID: {availability.id}")
        print(f"Blocks created: {len(availability.blocks)}")
        
        # Verify blocks
        blocks = sorted(availability.blocks, key=lambda b: b.start_at)
        for i, block in enumerate(blocks):
            print(f"Block {i}: ID={block.id}, {block.start_at} - {block.end_at}")
            
        # Test Case 1: Delete middle block (Block 1: 13:00-14:00)
        # Should result in:
        # Avail 1: 12:00-13:00 (Block 0)
        # Avail 2: 14:00-15:00 (Block 2)
        block_to_delete = blocks[1]
        print(f"\nDeleting middle block ID={block_to_delete.id} ({block_to_delete.start_at})...")
        
        appt_svc.delete_block(block_to_delete.id)
        
        # Force refresh of session to see changes
        session.expire_all()
        
        # Verify results
        # We need to re-fetch availability for this doctor
        availabilities = appt_svc.list_availability(doctor.id)
        print(f"\nFound {len(availabilities)} availabilities after deletion (expected 2):")
        
        for avail in availabilities:
            print(f"Availability ID={avail.id}: {avail.start_at} - {avail.end_at}")
            for block in avail.blocks:
                print(f"  - Block ID={block.id}: {block.start_at} - {block.end_at}")
                
        if len(availabilities) != 2:
            print("FAIL: Expected 2 availabilities")
            return
            
        # Verify gap
        sorted_avails = sorted(availabilities, key=lambda a: a.start_at)
        gap_start = sorted_avails[0].end_at
        gap_end = sorted_avails[1].start_at
        print(f"Gap is from {gap_start} to {gap_end}")
        
        if gap_start == block_to_delete.start_at and gap_end == block_to_delete.end_at:
            print("SUCCESS: Gap matches deleted block")
        else:
            print("FAIL: Gap does not match deleted block")

if __name__ == "__main__":
    try:
        test_block_deletion()
        print("\nTest completed successfully")
    except Exception as e:
        print(f"\nTest failed: {e}")
        import traceback
        traceback.print_exc()
