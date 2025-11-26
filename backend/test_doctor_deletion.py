#!/usr/bin/env python3
"""Test doctor deletion with manual appointment creation"""
import sys
from pathlib import Path
from datetime import datetime, timedelta

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir / 'src'))

from app.services.doctors import DoctorsService
from app.services.patients import PatientsService
from app.schemas.user import DoctorCreate, PatientCreate
from app.db.broker import get_dbbroker
from app.models.appointment import Appointment as AppointmentModel

print("\n🧪 Testing Doctor Deletion with Appointments")
print("="*60)

doctor_svc = DoctorsService()
patient_svc = PatientsService()

try:
    # Create doctor
    timestamp = int(datetime.now().timestamp())
    doctor = doctor_svc.create(DoctorCreate(
        email=f"doc_del_test_{timestamp}@test.com",
        password="test123",
        full_name=f"Dr. Delete Test {timestamp}",
        specialty="General",
        license_number=f"DEL{timestamp}"
    ))
    print(f"✓ Created doctor: {doctor.full_name} (ID: {doctor.id})")
    
    # Create patient
    patient = patient_svc.create(PatientCreate(
        email=f"pat_del_test_{timestamp}@test.com",
        password="test123",
        full_name=f"Patient Delete Test {timestamp}",
        document_type="dni",
        document_number=f"{timestamp}",
        address="123 Test",
        phone="123456789"
    ))
    print(f"✓ Created patient: {patient.full_name} (ID: {patient.id})")
    
    # Create appointment directly in DB
    broker = get_dbbroker()
    with broker.session() as session:
        appointment = AppointmentModel(
            doctor_id=doctor.id,
            patient_id=patient.id,
            start_at=datetime.now() + timedelta(days=1),
            end_at=datetime.now() + timedelta(days=1, hours=1)
        )
        session.add(appointment)
        session.flush()
        appointment_id = appointment.id
        print(f"✓ Created appointment (ID: {appointment_id})")
    
    # Try to delete doctor (should fail)
    print(f"\nAttempting to delete doctor {doctor.id}...")
    try:
        doctor_svc.delete(doctor.id)
        print("✗ FAILED: Doctor was deleted despite having appointments!")
        result = False
    except ValueError as e:
        print(f"✓ PASSED: Doctor deletion prevented")
        print(f"  Error message: {str(e)}")
        result = True
    
    # Cleanup
    print("\nCleaning up...")
    with broker.session() as session:
        appt = session.get(AppointmentModel, appointment_id)
        if appt:
            session.delete(appt)
            session.flush()
    doctor_svc.delete(doctor.id)
    patient_svc.delete(patient.id)
    print("✓ Cleanup completed")
    
    print("\n" + "="*60)
    if result:
        print("🎉 TEST PASSED!")
    else:
        print("❌ TEST FAILED")
    print("="*60 + "\n")
    
    sys.exit(0 if result else 1)
    
except Exception as e:
    print(f"\n✗ Test failed with exception: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
