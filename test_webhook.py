#!/usr/bin/env python3
"""
Test Script for Live AI Re-Scoring Feature

This script tests the webhook endpoint by sending a simulated GitHub webhook payload.
Usage: python test_webhook.py <project_id>
"""

import sys
import requests
import json
from datetime import datetime

# Configuration
AI_SERVICE_URL = "http://localhost:8000"
BACKEND_URL = "http://localhost:5000"

def test_webhook(project_id):
    """
    Send a test webhook to the AI service
    """
    
    # Simulated GitHub webhook payload
    test_payloads = [
        {
            "name": "Feature Addition",
            "payload": {
                "ref": "refs/heads/main",
                "head_commit": {
                    "message": "feat: add new dashboard feature",
                    "author": {
                        "name": "Test Developer",
                        "email": "dev@test.com"
                    },
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                },
                "repository": {
                    "name": "test-repo",
                    "full_name": "testuser/test-repo",
                    "url": "https://github.com/testuser/test-repo"
                }
            }
        },
        {
            "name": "Bug Fix",
            "payload": {
                "ref": "refs/heads/main",
                "head_commit": {
                    "message": "fix: resolve login issue",
                    "author": {
                        "name": "Test Developer",
                        "email": "dev@test.com"
                    },
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                },
                "repository": {
                    "name": "test-repo",
                    "full_name": "testuser/test-repo",
                    "url": "https://github.com/testuser/test-repo"
                }
            }
        },
        {
            "name": "Regular Commit (No Score Increase)",
            "payload": {
                "ref": "refs/heads/main",
                "head_commit": {
                    "message": "update readme",
                    "author": {
                        "name": "Test Developer",
                        "email": "dev@test.com"
                    },
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                },
                "repository": {
                    "name": "test-repo",
                    "full_name": "testuser/test-repo",
                    "url": "https://github.com/testuser/test-repo"
                }
            }
        }
    ]
    
    print("="*80)
    print("Live AI Re-Scoring Feature - Test Script")
    print("="*80)
    print(f"Project ID: {project_id}")
    print(f"AI Service: {AI_SERVICE_URL}")
    print(f"Backend: {BACKEND_URL}")
    print("="*80)
    
    # Test health endpoints first
    print("\n[1/4] Checking service health...")
    try:
        ai_health = requests.get(f"{AI_SERVICE_URL}/", timeout=5)
        if ai_health.status_code == 200:
            print("✓ AI Service is running")
        else:
            print(f"✗ AI Service returned status {ai_health.status_code}")
    except Exception as e:
        print(f"✗ AI Service is not accessible: {e}")
        return
    
    try:
        backend_health = requests.get(f"{BACKEND_URL}/api/integrations/health", timeout=5)
        if backend_health.status_code == 200:
            print("✓ Backend is running")
        else:
            print(f"✗ Backend returned status {backend_health.status_code}")
    except Exception as e:
        print(f"✗ Backend is not accessible: {e}")
        return
    
    # Test each webhook payload
    print(f"\n[2/4] Testing webhooks (sending {len(test_payloads)} test commits)...")
    
    for i, test_case in enumerate(test_payloads, 1):
        print(f"\n--- Test Case {i}: {test_case['name']} ---")
        print(f"Commit Message: '{test_case['payload']['head_commit']['message']}'")
        
        webhook_url = f"{AI_SERVICE_URL}/webhook/github/{project_id}"
        
        try:
            response = requests.post(
                webhook_url,
                json=test_case['payload'],
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Webhook processed successfully")
                print(f"  - Score Increase: +{data.get('scoreIncrease', 0)} points")
                print(f"  - Message: {data.get('message', 'N/A')}")
                
                if data.get('scoreIncrease', 0) > 0:
                    print(f"  ✓ Score increase triggered!")
                else:
                    print(f"  ✗ No score increase (commit not meaningful)")
            else:
                print(f"✗ Webhook failed: {response.status_code}")
                print(f"  Response: {response.text}")
                
        except Exception as e:
            print(f"✗ Error sending webhook: {e}")
    
    print("\n[3/4] Checking if backend received updates...")
    print("Note: Check your backend console for score update logs")
    
    print("\n[4/4] Testing complete!")
    print("\n" + "="*80)
    print("Next Steps:")
    print("1. Open CreatorDashboard in browser: http://localhost:5173")
    print("2. Watch for score animation in the next 5 seconds (polling interval)")
    print("3. Look for toast notification: '🎉 Your potential score increased...'")
    print("="*80)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_webhook.py <project_id>")
        print("\nExample: python test_webhook.py 673ab1234567890abcdef123")
        print("\nTip: Get your project ID from MongoDB or browser DevTools")
        sys.exit(1)
    
    project_id = sys.argv[1]
    test_webhook(project_id)
