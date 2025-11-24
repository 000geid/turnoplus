#!/usr/bin/env python3
"""
Test script to verify authentication role validation fix.

This script tests various combinations of credentials and roles to ensure
that users can only log in with the correct role selection.
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

# Test accounts from sample_accounts.txt
ACCOUNTS = {
    "admin": {"email": "admin@example.com", "password": "admin123"},
    "doctor": {"email": "doctor@example.com", "password": "doctor123"},
    "patient": {"email": "patient@example.com", "password": "patient123"}
}

# Map roles to their correct login endpoints
LOGIN_ENDPOINTS = {
    "admin": "/admins/login",
    "doctor": "/doctors/login",
    "patient": "/users/login"  # Patient login uses users endpoint
}

def test_login(role: str, credentials: dict) -> tuple[bool, str]:
    """Test login with specific role and credentials."""
    endpoint = LOGIN_ENDPOINTS[role]
    url = f"{BASE_URL}{endpoint}"
    
    try:
        response = requests.post(url, json=credentials, timeout=10)
        
        if response.status_code == 200:
            return True, f"✅ SUCCESS: {credentials['email']} logged in as {role}"
        elif response.status_code == 401:
            return False, f"❌ REJECTED: {credentials['email']} correctly denied for {role} role"
        else:
            return False, f"❌ ERROR: {credentials['email']} with {role} returned {response.status_code} - {response.text}"
            
    except requests.exceptions.RequestException as e:
        return False, f"❌ REQUEST ERROR: {e}"

def main():
    print("🔐 Testing Authentication Role Validation")
    print("=" * 50)
    
    # Test valid combinations (should succeed)
    print("\n🟢 VALID COMBINATIONS (should succeed):")
    valid_results = []
    for role in ["admin", "doctor", "patient"]:
        credentials = ACCOUNTS[role]
        success, message = test_login(role, credentials)
        valid_results.append(success)
        print(f"  {message}")
    
    # Test invalid combinations (should fail)
    print("\n🔴 INVALID COMBINATIONS (should fail):")
    invalid_results = []
    test_cases = [
        ("admin", "doctor", "admin@example.com / doctor123"), 
        ("admin", "patient", "admin@example.com / patient123"),
        ("doctor", "admin", "doctor@example.com / admin123"),
        ("doctor", "patient", "doctor@example.com / patient123"),
        ("patient", "admin", "patient@example.com / admin123"),
        ("patient", "doctor", "patient@example.com / doctor123")
    ]
    
    for attempted_role, true_role, description in test_cases:
        credentials = ACCOUNTS[true_role]
        success, message = test_login(attempted_role, credentials)
        invalid_results.append(not success)  # We expect these to fail
        print(f"  {message}")
    
    # Summary
    print("\n📊 SUMMARY:")
    valid_passed = sum(valid_results)
    invalid_passed = sum(invalid_results)
    total_valid = len(valid_results)
    total_invalid = len(invalid_results)
    
    print(f"  Valid logins (should succeed): {valid_passed}/{total_valid}")
    print(f"  Invalid logins (should fail): {invalid_passed}/{total_invalid}")
    
    if valid_passed == total_valid and invalid_passed == total_invalid:
        print("\n✅ ALL TESTS PASSED! Role validation is working correctly.")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED! Role validation may not be working correctly.")
        return 1

if __name__ == "__main__":
    sys.exit(main())