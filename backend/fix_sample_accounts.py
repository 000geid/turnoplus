#!/usr/bin/env python3
"""
Script to fix the sample accounts with correct credentials and roles.
"""

import sys
from pathlib import Path

# Add the src directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from sqlalchemy import select
from app.db.broker import get_dbbroker
from app.models import User, Patient, Doctor, Admin, Office
from app.models.enums import UserRole
from app.utils.security import hash_password


def fix_sample_accounts():
    """Fix sample accounts with correct credentials and roles."""
    
    db_broker = get_dbbroker()
    
    with db_broker.session() as session:
        try:
            # 1. Fix doctor account
            print("=== FIXING DOCTOR ACCOUNT ===")
            doctor_user = session.execute(
                select(User).where(User.email == "doctor@example.com")
            ).scalar_one_or_none()
            
            if doctor_user:
                print(f"Found doctor user: {doctor_user.email}")
                
                # Update role and password
                doctor_user.role = UserRole.DOCTOR
                doctor_user.password_hash = hash_password("doctor123")
                print("✅ Updated doctor role to DOCTOR and password")
                
                # Check if doctor profile exists
                doctor_profile = session.execute(
                    select(Doctor).where(Doctor.id == doctor_user.id)
                ).scalar_one_or_none()
                
                if not doctor_profile:
                    print("Creating missing doctor profile...")
                    # Get office ID
                    office = session.execute(
                        select(Office).where(Office.code == "MAIN")
                    ).scalar_one_or_none()
                    
                    if office:
                        new_doctor = Doctor(
                            id=doctor_user.id,
                            license_number="DOC123456",
                            specialty="General Practice",
                            phone="555-0202",
                            years_experience=10,
                            office_id=office.id
                        )
                        session.add(new_doctor)
                        print(f"✅ Created doctor profile with office ID: {office.id}")
                    else:
                        print("❌ Could not find MAIN office!")
                else:
                    print("✅ Doctor profile already exists")
            else:
                print("❌ Doctor user not found!")
            
            # 2. Fix admin account
            print("\n=== FIXING ADMIN ACCOUNT ===")
            admin_user = session.execute(
                select(User).where(User.email == "admin@example.com")
            ).scalar_one_or_none()
            
            if admin_user:
                print(f"Found admin user: {admin_user.email}")
                
                # Update password
                admin_user.password_hash = hash_password("admin123")
                print("✅ Updated admin password")
                
                # Check if admin profile exists
                admin_profile = session.execute(
                    select(Admin).where(Admin.id == admin_user.id)
                ).scalar_one_or_none()
                
                if not admin_profile:
                    print("Creating missing admin profile...")
                    # Get office ID
                    office = session.execute(
                        select(Office).where(Office.code == "MAIN")
                    ).scalar_one_or_none()
                    
                    if office:
                        new_admin = Admin(
                            id=admin_user.id,
                            office_id=office.id,
                            role="System Administrator",
                            permissions=["user_management", "office_management", "system_settings"]
                        )
                        session.add(new_admin)
                        print(f"✅ Created admin profile with office ID: {office.id}")
                    else:
                        print("❌ Could not find MAIN office!")
                else:
                    print("✅ Admin profile already exists")
            else:
                print("❌ Admin user not found!")
            
            # 3. Verify patient account is correct
            print("\n=== VERIFYING PATIENT ACCOUNT ===")
            patient_user = session.execute(
                select(User).where(User.email == "patient@example.com")
            ).scalar_one_or_none()
            
            if patient_user:
                print(f"Found patient user: {patient_user.email}")
                print(f"Role: {patient_user.role}")
                print(f"Active: {patient_user.is_active}")
                
                # Ensure password is correct
                patient_user.password_hash = hash_password("patient123")
                print("✅ Updated patient password to ensure consistency")
            else:
                print("❌ Patient user not found!")
            
            print("\n✅ All accounts fixed successfully!")
            
        except Exception as e:
            print(f"\n❌ Error fixing accounts: {e}")
            raise


if __name__ == "__main__":
    fix_sample_accounts()