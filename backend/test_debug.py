#!/usr/bin/env python3
"""Quick debug test to check if validation is working"""
import requests
import json

BASE = "http://localhost:8000/api/v1"

# Create office
print("Creating office...")
r = requests.post(f"{BASE}/offices", json={
    "code": "TESTDEBUG",
    "name": "Test Debug Office",
    "address": "123 Test"
})
print(f"Status: {r.status_code}")
print(f"Response: {r.text}")
office = r.json()
office_id = office['id']
print(f"Created office ID: {office_id}\n")

# Create doctor assigned to this office
print("Creating doctor assigned to office...")
r = requests.post(f"{BASE}/doctors", json={
    "email": "testdebug@example.com",
    "password": "test123",
    "full_name": "Dr. Debug Test",
    "specialty": "Testing",
    "license_number": "DEBUG123",
    "office_id": office_id
})
print(f"Status: {r.status_code}")
print(f"Response: {r.text}")
if r.status_code in [200, 201]:
    doctor = r.json()
    print(f"Created doctor ID: {doctor['id']}\n")
else:
    print("Failed to create doctor, exiting")
    exit(1)

# Try to delete office (should fail with 400)
print(f"Attempting to delete office {office_id}...")
r = requests.delete(f"{BASE}/offices/{office_id}")
print(f"Status: {r.status_code}")
print(f"Response: {r.text}")

if r.status_code == 400:
    print("\n✓ SUCCESS: Office deletion was prevented!")
    print(f"Error message: {r.json().get('detail')}")
elif r.status_code == 204:
    print("\n✗ FAILURE: Office was deleted despite having assigned doctor!")
else:
    print(f"\n? UNEXPECTED: Got status {r.status_code}")

# Cleanup
print("\nCleaning up...")
if r.status_code != 204:  # Office wasn't deleted
    requests.put(f"{BASE}/doctors/{doctor['id']}", json={"office_id": None})
    requests.delete(f"{BASE}/doctors/{doctor['id']}")
    requests.delete(f"{BASE}/offices/{office_id}")
    print("Cleaned up")
