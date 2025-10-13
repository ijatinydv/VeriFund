#!/usr/bin/env python3
"""
Test script for UPI Cash-Out API endpoint
Tests the /api/payout/upi-qr/:projectId endpoint
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:5001"
API_ENDPOINT = "/api/payout/upi-qr"

def test_upi_endpoint():
    """Test the UPI QR code generation endpoint"""
    
    print("🧪 Testing UPI Cash-Out API Endpoint\n")
    print("=" * 60)
    
    # You'll need to replace these with actual values from your database
    PROJECT_ID = "YOUR_PROJECT_ID_HERE"  # Replace with actual project ID
    AUTH_TOKEN = "YOUR_JWT_TOKEN_HERE"   # Replace with actual JWT token
    
    # Test 1: Unauthorized request (no token)
    print("\n📋 Test 1: Unauthorized Request (No Token)")
    print("-" * 60)
    try:
        response = requests.get(f"{BASE_URL}{API_ENDPOINT}/{PROJECT_ID}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 401:
            print("✅ PASS: Correctly rejected unauthorized request")
        else:
            print("❌ FAIL: Should have returned 401")
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    # Test 2: Authorized request with valid token
    print("\n📋 Test 2: Authorized Request (With Token)")
    print("-" * 60)
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}{API_ENDPOINT}/{PROJECT_ID}",
            headers=headers
        )
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS: UPI QR Code Generated")
            print("\n📊 Response Data:")
            print(json.dumps(data, indent=2))
            
            # Validate response structure
            if data.get('success') and data.get('data', {}).get('upiString'):
                print("\n✅ PASS: Response has correct structure")
                print(f"\n🔗 UPI String: {data['data']['upiString']}")
                print(f"💰 Payout Amount: ₹{data['data']['payoutAmount']}")
                print(f"📁 Project: {data['data']['projectTitle']}")
                print(f"👤 Creator: {data['data']['creatorName']}")
            else:
                print("❌ FAIL: Response missing required fields")
        else:
            print(f"❌ FAIL: Unexpected status code")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    # Test 3: Invalid project ID
    print("\n📋 Test 3: Invalid Project ID")
    print("-" * 60)
    try:
        response = requests.get(
            f"{BASE_URL}{API_ENDPOINT}/invalid_id_12345",
            headers=headers
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code in [400, 404, 500]:
            print("✅ PASS: Correctly handled invalid project ID")
        else:
            print("❌ FAIL: Should have returned error status")
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    print("\n" + "=" * 60)
    print("🏁 Testing Complete")
    print("\n📝 Note: Replace PROJECT_ID and AUTH_TOKEN with real values")
    print("   Get token by logging in via frontend and checking localStorage")

if __name__ == "__main__":
    test_upi_endpoint()
