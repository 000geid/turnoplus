#!/usr/bin/env python3
"""
Debug script to test authentication with sample accounts
"""

import sys
from pathlib import Path

# Add the src directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from sqlalchemy import select
from app.db.broker import get_dbbroker
from app.models import User, Patient, Doctor, Admin, Office
from app.models.enums import UserRole
from app.utils.security import hash_password, verify_password


def test_authentication():
    """Test authentication for all sample accounts"""
    
    db_broker = get_dbbroker()
    
    with db_broker.session() as session:
        # Test patient authentication
        print("=== TESTING PATIENT LOGIN ===")
        patient_user = session.execute(
            select(User).where(User.email == "patient@example.com")
        ).scalar_one_or_none()
        
        if patient_user:
            print(f"Patient found: {patient_user.email}")
            print(f"Password hash: {patient_user.password_hash}")
            print(f"Is active: {patient_user.is_active}")
            print(f"Role: {patient_user.role}")
            
            # Test password verification
            test_password = "patient123"
            is_valid = verify_password(test_password, patient_user.password_hash)
            print(f"Password '{test_password}' is valid: {is_valid}")
        else:
            print("❌ Patient not found!")
        
        # Test doctor authentication
        print("\n=== TESTING DOCTOR LOGIN ===")
        doctor_user = session.execute(
            select(User).where(User.email == "doctor@example.com")
        ).scalar_one_or_none()
        
        if doctor_user:
            print(f"Doctor found: {doctor_user.email}")
            print(f"Password hash: {doctor_user.password_hash}")
            print(f"Is active: {doctor_user.is_active}")
            print(f"Role: {doctor_user.role}")
            
            # Test password verification
            test_password = "doctor123"
            is_valid = verify_password(test_password, doctor_user.password_hash)
            print(f"Password '{test_password}' is valid: {is_valid}")
            
            # Check if doctor profile exists
            doctor_profile = session.execute(
                select(Doctor).where(Doctor.id == doctor_user.id)
            ).scalar_one_or_none()
            if doctor_profile:
                print(f"Doctor profile found - Specialty: {doctor_profile.specialty}")
            else:
                print("❌ Doctor profile not found!")
        else:
            print("❌ Doctor not found!")
        
        # Test admin authentication
        print("\n=== TESTING ADMIN LOGIN ===")
        admin_user = session.execute(
            select(User).where(User.email == "admin@example.com")
        ).scalar_one_or_none()
        
        if admin_user:
            print(f"Admin found: {admin_user.email}")
            print(f"Password hash: {admin_user.password_hash}")
            print(f"Is active: {admin_user.is_active}")
            print(f"Role: {admin_user.role}")
            
            # Test password verification
            test_password = "admin123"
            is_valid = verify_password(test_password, admin_user.password_hash)
            print(f"Password '{test_password}' is valid: {is_valid}")
        else:
            print("❌ Admin not found!")


def test_password_hashing():
    """Test password hashing function"""
    print("\n=== TESTING PASSWORD HASHING ===")
    
    test_password = "doctor123"
    hashed = hash_password(test_password)
    print(f"Password: {test_password}")
    print(f"Hashed: {hashed}")
    
    is_valid = verify_password(test_password, hashed)
    print(f"Verification successful: {is_valid}")
    
    # Test with wrong password
    wrong_password = "wrongpassword"
    is_invalid = verify_password(wrong_password, hashed)
    print(f"Wrong password verification (should be False): {is_invalid}")


if __name__ == "__main__":
    test_password_hashing()
    test_authentication()