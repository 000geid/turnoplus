#!/usr/bin/env python3
"""
Script to check if there are any appointments between sample patient (ID: 5) and doctor (ID: 3)
"""

import sys
import os

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from app.db.broker import get_dbbroker
from app.models.appointment import Appointment as AppointmentModel
from app.models.user import User as UserModel
from app.models.doctor import Doctor as DoctorModel
from app.models.patient import Patient as PatientModel
from sqlalchemy import select


def check_sample_appointments():
    """Check for appointments between sample patient and doctor"""
    print("🔍 Checking for appointments between sample patient and doctor...")
    
    broker = get_dbbroker()
    with broker.session() as session:
        try:
            # Get sample patient (ID: 5)
            print("\n👤 Getting sample patient (ID: 5)...")
            patient_stmt = select(UserModel).where(UserModel.id == 5)
            patient_user = session.scalar(patient_stmt)
            
            if not patient_user:
                print("❌ Sample patient not found")
                return False
                
            patient_stmt = select(PatientModel).where(PatientModel.id == 5)
            patient = session.scalar(patient_stmt)
            
            if not patient:
                print("❌ Sample patient profile not found")
                return False
                
            print(f"✅ Found sample patient: {patient_user.full_name} ({patient_user.email})")
            
            # Get sample doctor (ID: 3)
            print("\n👨‍⚕️ Getting sample doctor (ID: 3)...")
            doctor_stmt = select(UserModel).where(UserModel.id == 3)
            doctor_user = session.scalar(doctor_stmt)
            
            if not doctor_user:
                print("❌ Sample doctor not found")
                return False
                
            doctor_stmt = select(DoctorModel).where(DoctorModel.id == 3)
            doctor = session.scalar(doctor_stmt)
            
            if not doctor:
                print("❌ Sample doctor profile not found")
                return False
                
            print(f"✅ Found sample doctor: {doctor_user.full_name} ({doctor_user.email})")
            
            # Check for appointments between them
            print("\n📅 Checking for appointments between patient and doctor...")
            appointment_stmt = select(AppointmentModel).where(
                AppointmentModel.patient_id == 5,
                AppointmentModel.doctor_id == 3
            )
            appointments = session.scalars(appointment_stmt).all()
            
            if appointments:
                print(f"✅ Found {len(appointments)} appointment(s) between patient and doctor:")
                for apt in appointments:
                    print(f"  - ID: {apt.id}, Status: {apt.status}, Start: {apt.start_at}, End: {apt.end_at}")
                    print(f"    Notes: {apt.notes or 'None'}")
                return True
            else:
                print("❌ No appointments found between patient and doctor")
                print("This explains why the patient doesn't appear in the doctor's patient list")
                return False
                
        except Exception as e:
            print(f"❌ Error checking appointments: {e}")
            import traceback
            traceback.print_exc()
            return False


if __name__ == "__main__":
    print("🧪 Checking appointments between sample accounts...\n")
    
    has_appointments = check_sample_appointments()
    
    print(f"\n{'🎉 Found appointments!' if has_appointments else '❌ No appointments found'}")
    if not has_appointments:
        print("To fix this issue, we need to create an appointment between the sample patient and doctor")
    sys.exit(0 if has_appointments else 1)