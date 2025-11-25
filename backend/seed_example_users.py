#!/usr/bin/env python3
"""
Script to seed example user credentials in the database.
Creates admin, patient, and doctor accounts if they don't already exist.

Example credentials:
- admin@example.com / admin123
- patient@example.com / patient123
- doctor@example.com / doctor123
"""

import sys
from datetime import date
from pathlib import Path

# Add the src directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from sqlalchemy import select

from app.db.broker import get_dbbroker
from app.models import User, Patient, Doctor, Admin, Office
from app.models.enums import UserRole
from app.utils.security import hash_password


def seed_example_users():
    """Seed example user accounts if they don't exist."""
    
    db_broker = get_dbbroker()
    
    with db_broker.session() as session:
        try:
            # 1. Ensure we have an office
            print("Checking for office...")
            office = session.execute(
                select(Office).where(Office.code == "MAIN")
            ).scalar_one_or_none()
            
            if not office:
                print("Creating sample office...")
                office = Office(
                    code="MAIN",
                    name="Main Medical Center",
                    address="123 Health St, Medical City, MC 12345"
                )
                session.add(office)
                session.flush()
                print(f"✓ Created office: {office.name}")
            else:
                print(f"✓ Using existing office: {office.name}")
            
            office_id = office.id
            
            # 2. Create/check admin user
            print("\nChecking admin@example.com...")
            admin_user = session.execute(
                select(User).where(User.email == "admin@example.com")
            ).scalar_one_or_none()
            
            if not admin_user:
                print("Creating admin user...")
                admin_user = User(
                    email="admin@example.com",
                    password_hash=hash_password("admin123"),
                    full_name="Admin User",
                    role=UserRole.ADMIN,
                    is_active=True
                )
                session.add(admin_user)
                session.flush()
                
                admin_profile = Admin(
                    id=admin_user.id,
                    office_id=office_id,
                    role="superadmin",
                    permissions=["user_management", "office_management", "system_settings"]
                )
                session.add(admin_profile)
                print(f"✓ Created admin user (ID: {admin_user.id})")
            else:
                print(f"✓ Admin user already exists (ID: {admin_user.id})")
            
            # 3. Create/check patient user
            print("\nChecking patient@example.com...")
            patient_user = session.execute(
                select(User).where(User.email == "patient@example.com")
            ).scalar_one_or_none()
            
            if not patient_user:
                print("Creating patient user...")
                patient_user = User(
                    email="patient@example.com",
                    password_hash=hash_password("patient123"),
                    full_name="John Patient",
                    role=UserRole.PATIENT,
                    is_active=True
                )
                session.add(patient_user)
                session.flush()
                
                patient_profile = Patient(
                    id=patient_user.id,
                    document_type="dni",
                    document_number="20123456",
                    address="123 Health St, Medical City, MC 12345",
                    phone="555-0101",
                    date_of_birth=date(1985, 5, 15),
                    medical_record_number="MRN001",
                    emergency_contact="Jane Patient (555-0101)"
                )
                session.add(patient_profile)
                print(f"✓ Created patient user (ID: {patient_user.id})")
            else:
                print(f"✓ Patient user already exists (ID: {patient_user.id})")
            
            # 4. Create/check doctor user
            print("\nChecking doctor@example.com...")
            doctor_user = session.execute(
                select(User).where(User.email == "doctor@example.com")
            ).scalar_one_or_none()
            
            if not doctor_user:
                print("Creating doctor user...")
                doctor_user = User(
                    email="doctor@example.com",
                    password_hash=hash_password("doctor123"),
                    full_name="Dr. Sarah Doctor",
                    role=UserRole.DOCTOR,
                    is_active=True
                )
                session.add(doctor_user)
                session.flush()
                
                doctor_profile = Doctor(
                    id=doctor_user.id,
                    license_number="DOC123456",
                    specialty="General Practice",
                    phone="555-0202",
                    years_experience=10,
                    office_id=office_id
                )
                session.add(doctor_profile)
                print(f"✓ Created doctor user (ID: {doctor_user.id})")
            else:
                print(f"✓ Doctor user already exists (ID: {doctor_user.id})")
            
            print("\n" + "="*60)
            print("✅ Example users seeded successfully!")
            print("="*60)
            print("\nAvailable test credentials:")
            print("  • admin@example.com / admin123")
            print("  • patient@example.com / patient123")
            print("  • doctor@example.com / doctor123")
            print("="*60)
            
        except Exception as e:
            print(f"\n❌ Error seeding users: {e}")
            raise


if __name__ == "__main__":
    seed_example_users()
