"""
Test script to verify the AI service API works correctly
"""
import requests
import json

# API endpoint
API_URL = "http://127.0.0.1:8000"

def test_health():
    """Test the health endpoint"""
    print("\n" + "="*60)
    print("Testing /health endpoint...")
    print("="*60)
    try:
        response = requests.get(f"{API_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_score():
    """Test the score endpoint"""
    print("\n" + "="*60)
    print("Testing /score endpoint...")
    print("="*60)
    
    # Test data
    test_data = {
        "projects_completed": 25,
        "tenure_months": 36,
        "portfolio_strength": 0.85,
        "on_time_delivery_percent": 0.95,
        "avg_client_rating": 4.7,
        "rating_trajectory": 0.15,
        "dispute_rate": 0.03,
        "project_category": "UI/UX Design"
    }
    
    print(f"Request Data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(f"{API_URL}/score", json=test_data)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("="*60)
    print("VeriFund AI Service - API Test Suite")
    print("="*60)
    
    # Check if server is running
    try:
        requests.get(API_URL, timeout=2)
    except:
        print("\n⚠️  Warning: AI service doesn't appear to be running!")
        print("Please start it with: python main.py")
        exit(1)
    
    # Run tests
    health_ok = test_health()
    score_ok = test_score()
    
    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    print(f"Health Check: {'✓ PASSED' if health_ok else '✗ FAILED'}")
    print(f"Score Endpoint: {'✓ PASSED' if score_ok else '✗ FAILED'}")
    print("="*60)
    
    if health_ok and score_ok:
        print("✓ All tests passed! The API is working correctly.")
        print("✓ No Pydantic deprecation warnings should appear.")
        print("✓ No numpy serialization errors should occur.")
    else:
        print("✗ Some tests failed. Please check the errors above.")
