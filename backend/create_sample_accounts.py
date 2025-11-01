#!/usr/bin/env python3
"""
Script to create sample patient, doctor, and admin accounts in the database.
This script will create the accounts and document their IDs for testing purposes.
"""

import sys
from datetime import date
from pathlib import Path

# Add the src directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from sqlalchemy import select

from app.db.broker import DBBroker, get_dbbroker
from app.models import User, Patient, Doctor, Admin, Office
from app.models.enums import UserRole
from app.utils.security import hash_password


def create_sample_accounts():
    """Create sample accounts and document their IDs."""
    
    # Initialize database connection
    db_broker = get_dbbroker()
    
    with db_broker.session() as session:
        try:
            # 1. Check/Create an office first
            print("Checking for sample office...")
            office_result = session.execute(select(Office).where(Office.code == "MAIN")).scalar_one_or_none()
            if office_result:
                office_id = office_result.id
                print(f"Found existing office with ID: {office_id}")
            else:
                print("Creating sample office...")
                office = Office(
                    code="MAIN",
                    name="Main Medical Center",
                    address="123 Health St, Medical City, MC 12345"
                )
                session.add(office)
                session.flush()  # Get the ID without committing
                office_id = office.id
                print(f"Created office with ID: {office_id}")
            
            # 2. Check/Create patient account
            print("\nChecking for sample patient...")
            patient_result = session.execute(select(User).where(User.email == "patient@example.com")).scalar_one_or_none()
            if patient_result:
                patient_user_id = patient_result.id
                print(f"Found existing patient with User ID: {patient_user_id}")
            else:
                print("Creating sample patient...")
                patient_password = hash_password("patient123")
                patient_user = User(
                    email="patient@example.com",
                    password_hash=patient_password,
                    full_name="John Patient",
                    role=UserRole.PATIENT,
                    is_active=True
                )
                session.add(patient_user)
                session.flush()
                patient_user_id = patient_user.id
                
                patient_profile = Patient(
                    id=patient_user_id,
                    date_of_birth=date(1985, 5, 15),
                    medical_record_number="MRN001",
                    emergency_contact="Jane Patient (555-0101)"
                )
                session.add(patient_profile)
                print(f"Created patient with User ID: {patient_user_id}")
            
            # 3. Check/Create doctor account
            print("\nChecking for sample doctor...")
            doctor_result = session.execute(select(User).where(User.email == "doctor@example.com")).scalar_one_or_none()
            if doctor_result:
                doctor_user_id = doctor_result.id
                print(f"Found existing doctor with User ID: {doctor_user_id}")
            else:
                print("Creating sample doctor...")
                doctor_password = hash_password("doctor123")
                doctor_user = User(
                    email="doctor@example.com",
                    password_hash=doctor_password,
                    full_name="Dr. Sarah Doctor",
                    role=UserRole.DOCTOR,
                    is_active=True
                )
                session.add(doctor_user)
                session.flush()
                doctor_user_id = doctor_user.id
                
                doctor_profile = Doctor(
                    id=doctor_user_id,
                    license_number="DOC123456",
                    specialty="General Practice",
                    phone="555-0202",
                    years_experience=10,
                    office_id=office_id
                )
                session.add(doctor_profile)
                print(f"Created doctor with User ID: {doctor_user_id}")
            
            # 4. Check/Create admin account
            print("\nChecking for sample admin...")
            admin_result = session.execute(select(User).where(User.email == "admin@example.com")).scalar_one_or_none()
            if admin_result:
                admin_user_id = admin_result.id
                print(f"Found existing admin with User ID: {admin_user_id}")
            else:
                print("Creating sample admin...")
                admin_password = hash_password("admin123")
                admin_user = User(
                    email="admin@example.com",
                    password_hash=admin_password,
                    full_name="Admin User",
                    role=UserRole.ADMIN,
                    is_active=True
                )
                session.add(admin_user)
                session.flush()
                admin_user_id = admin_user.id
                
                admin_profile = Admin(
                    id=admin_user_id,
                    office_id=office_id,
                    role="System Administrator",
                    permissions=["user_management", "office_management", "system_settings"]
                )
                session.add(admin_profile)
                print(f"Created admin with User ID: {admin_user_id}")
            
            # Commit all changes - session is already committed by the context manager
            print("\n✅ All sample accounts created successfully!")
            
            # Document the IDs and credentials
            print("\n" + "="*50)
            print("SAMPLE ACCOUNTS DOCUMENTATION")
            print("="*50)
            print(f"\nOffice ID: {office_id}")
            print("Office Code: MAIN")
            print("Office Name: Main Medical Center")
            
            print("\n--- PATIENT ACCOUNT ---")
            print(f"User ID: {patient_user_id}")
            print("Email: patient@example.com")
            print("Password: patient123")
            print("Full Name: John Patient")
            print("Medical Record Number: MRN001")
            print("Date of Birth: 1985-05-15")
            print("Emergency Contact: Jane Patient (555-0101)")
            
            print("\n--- DOCTOR ACCOUNT ---")
            print(f"User ID: {doctor_user_id}")
            print("Email: doctor@example.com")
            print("Password: doctor123")
            print("Full Name: Dr. Sarah Doctor")
            print("License Number: DOC123456")
            print("Specialty: General Practice")
            print("Phone: 555-0202")
            print("Years of Experience: 10")
            print(f"Office ID: {office_id}")
            
            print("\n--- ADMIN ACCOUNT ---")
            print(f"User ID: {admin_user_id}")
            print("Email: admin@example.com")
            print("Password: admin123")
            print("Full Name: Admin User")
            print("Role: System Administrator")
            print("Permissions: user_management, office_management, system_settings")
            print(f"Office ID: {office_id}")
            
            print("\n" + "="*50)
            print("IMPORTANT: Save these credentials for testing!")
            print("="*50)
            
            # Save to a file for future reference
            with open("sample_accounts.txt", "w") as f:
                f.write("SAMPLE ACCOUNTS DOCUMENTATION\n")
                f.write("="*50 + "\n")
                f.write(f"\nOffice ID: {office_id}\n")
                f.write("Office Code: MAIN\n")
                f.write("Office Name: Main Medical Center\n")
                
                f.write("\n--- PATIENT ACCOUNT ---\n")
                f.write(f"User ID: {patient_user_id}\n")
                f.write("Email: patient@example.com\n")
                f.write("Password: patient123\n")
                f.write("Full Name: John Patient\n")
                f.write("Medical Record Number: MRN001\n")
                f.write("Date of Birth: 1985-05-15\n")
                f.write("Emergency Contact: Jane Patient (555-0101)\n")
                
                f.write("\n--- DOCTOR ACCOUNT ---\n")
                f.write(f"User ID: {doctor_user_id}\n")
                f.write("Email: doctor@example.com\n")
                f.write("Password: doctor123\n")
                f.write("Full Name: Dr. Sarah Doctor\n")
                f.write("License Number: DOC123456\n")
                f.write("Specialty: General Practice\n")
                f.write("Phone: 555-0202\n")
                f.write("Years of Experience: 10\n")
                f.write(f"Office ID: {office_id}\n")
                
                f.write("\n--- ADMIN ACCOUNT ---\n")
                f.write(f"User ID: {admin_user_id}\n")
                f.write("Email: admin@example.com\n")
                f.write("Password: admin123\n")
                f.write("Full Name: Admin User\n")
                f.write("Role: System Administrator\n")
                f.write("Permissions: user_management, office_management, system_settings\n")
                f.write(f"Office ID: {office_id}\n")
            
            print("\n📄 Documentation saved to 'sample_accounts.txt'")
            
        except Exception as e:
            print(f"\n❌ Error creating sample accounts: {e}")
            # Session rollback is handled by the context manager
            raise


if __name__ == "__main__":
    create_sample_accounts()