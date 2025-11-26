#!/usr/bin/env python3
"""
Simple test to verify delete prevention by directly calling the API endpoints
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/v1"

def test_office_with_doctors():
    """Test office deletion with assigned doctors"""
    print("\n" + "="*60)
    print("TEST: Office deletion with assigned doctor")
    print("="*60)
    
    # Create unique office
    timestamp = datetime.now().timestamp()
    office_data = {
        "code": f"TEST_{int(timestamp)}",
        "name": f"Test Office {int(timestamp)}",
        "address": "123 Test St"
    }
    
    response = requests.post(f"{BASE_URL}/offices", json=office_data)
    if response.status_code not in [200, 201]:
        print(f"✗ Failed to create office: {response.status_code} - {response.text}")
        return False
    
    office = response.json()
    print(f"✓ Created office: {office['name']} (ID: {office['id']})")
    
    # Create doctor assigned to this office  
    doctor_data = {
        "email": f"doctor_{int(timestamp)}@test.com",
        "password": "test123",
        "full_name": f"Dr. Test {int(timestamp)}",
        "specialty": "General",
        "license_number": f"LIC_{int(timestamp)}",
        "office_id": office['id']
    }
    
    response = requests.post(f"{BASE_URL}/doctors", json=doctor_data)
    if response.status_code not in [200, 201]:
        print(f"✗ Failed to create doctor: {response.status_code} - {response.text}")
        # Cleanup office
        requests.delete(f"{BASE_URL}/offices/{office['id']}")
        return False
    
    doctor = response.json()
    print(f"✓ Created doctor: {doctor['full_name']} assigned to office")
    
    # Try to delete office (should fail)
    response = requests.delete(f"{BASE_URL}/offices/{office['id']}")
    
    if response.status_code == 400:
        error_detail = response.json().get('detail', '')
        print(f"✓ PASSED: Office deletion prevented")
        print(f"  Error message: {error_detail}")
        
        # Cleanup: unassign doctor then delete
        requests.put(f"{BASE_URL}/doctors/{doctor['id']}", json={"office_id": None})
        requests.delete(f"{BASE_URL}/doctors/{doctor['id']}")
        requests.delete(f"{BASE_URL}/offices/{office['id']}")
        print("✓ Cleanup completed")
        return True
    else:
        print(f"✗ FAILED: Office was deleted (status: {response.status_code})")
        # Cleanup
        requests.delete(f"{BASE_URL}/doctors/{doctor['id']}")
        return False


def test_doctor_with_appointments():
    """Test doctor deletion with appointments"""
    print("\n" + "="*60)
    print("TEST: Doctor deletion with appointments")
    print("="*60)
    
    timestamp = datetime.now().timestamp()
    
    # Create doctor
    doctor_data = {
        "email": f"doctor_appt_{int(timestamp)}@test.com",
        "password": "test123",
        "full_name": f"Dr. Appt Test {int(timestamp)}",
        "specialty": "General",
        "license_number": f"LIC_APPT_{int(timestamp)}"
    }
    
    response = requests.post(f"{BASE_URL}/doctors", json=doctor_data)
    if response.status_code not in [200, 201]:
        print(f"✗ Failed to create doctor: {response.status_code} - {response.text}")
        return False
    
    doctor = response.json()
    print(f"✓ Created doctor: {doctor['full_name']} (ID: {doctor['id']})")
    
    # Create patient
    patient_data = {
        "email": f"patient_{int(timestamp)}@test.com",
        "password": "test123",
        "full_name": f"Patient Test {int(timestamp)}",
        "document_type": "dni",  # lowercase
        "document_number": f"{int(timestamp)}",
        "address": "123 Test Address",  # required field
        "phone": "123456789"  # required field
    }
    
    response = requests.post(f"{BASE_URL}/patients", json=patient_data)
    if response.status_code not in [200, 201]:
        print(f"✗ Failed to create patient: {response.status_code} - {response.text}")
        requests.delete(f"{BASE_URL}/doctors/{doctor['id']}")
        return False
    
    patient = response.json()
    print(f"✓ Created patient: {patient['full_name']} (ID: {patient['id']})")
    
    # Create appointment
    start_time = datetime.now() + timedelta(days=1)
    end_time = start_time + timedelta(hours=1)
    
    appointment_data = {
        "doctor_id": doctor['id'],
        "patient_id": patient['id'],
        "start_at": start_time.isoformat(),
        "end_at": end_time.isoformat(),
        "reason": "Test appointment"
    }
    
    response = requests.post(f"{BASE_URL}/appointments", json=appointment_data)
    if response.status_code not in [200, 201]:
        print(f"✗ Failed to create appointment: {response.status_code} - {response.text}")
        requests.delete(f"{BASE_URL}/doctors/{doctor['id']}")
        requests.delete(f"{BASE_URL}/patients/{patient['id']}")
        return False
    
    appointment = response.json()
    print(f"✓ Created appointment (ID: {appointment['id']})")
    
    # Try to delete doctor (should fail)
    response = requests.delete(f"{BASE_URL}/doctors/{doctor['id']}")
    
    if response.status_code == 400:
        error_detail = response.json().get('detail', '')
        print(f"✓ PASSED: Doctor deletion prevented")
        print(f"  Error message: {error_detail}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/appointments/{appointment['id']}")
        requests.delete(f"{BASE_URL}/doctors/{doctor['id']}")
        requests.delete(f"{BASE_URL}/patients/{patient['id']}")
        print("✓ Cleanup completed")
        return True
    else:
        print(f"✗ FAILED: Doctor was deleted (status: {response.status_code})")
        # Cleanup if appointment still exists
        requests.delete(f"{BASE_URL}/appointments/{appointment['id']}")
        requests.delete(f"{BASE_URL}/patients/{patient['id']}")
        return False


if __name__ == "__main__":
    print("\n🧪 Starting Delete Prevention API Tests")
    print("="*60)
    
    results = []
    
    try:
        results.append(("Office deletion with doctors", test_office_with_doctors()))
        results.append(("Doctor deletion with appointments", test_doctor_with_appointments()))
    except Exception as e:
        print(f"\n✗ Test suite failed with exception: {e}")
        import traceback
        traceback.print_exc()
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{status}: {test_name}")
    
    all_passed = all(result[1] for result in results) if results else False
    print("\n" + "="*60)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
    else:
        print("❌ SOME TESTS FAILED")
    print("="*60 + "\n")
