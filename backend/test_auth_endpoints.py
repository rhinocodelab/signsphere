#!/usr/bin/env python3
"""
Test script to verify the auth endpoints work correctly
"""

from app.main import app
from fastapi.testclient import TestClient
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


def test_auth_endpoints():
    """Test the auth endpoints"""

    print("🔐 Testing Auth Endpoints")
    print("=" * 40)

    client = TestClient(app)

    try:
        # Test 1: Login to get a token
        print("1️⃣  Testing POST /api/v1/auth/login")
        login_data = {
            "username": "admin",
            "password": "admin"
        }
        response = client.post("/api/v1/auth/login", data=login_data)

        if response.status_code == 200:
            print("✅ Login successful")
            token_data = response.json()
            access_token = token_data["access_token"]
            print(f"   Token type: {token_data['token_type']}")
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return

        # Test 2: Test GET /api/v1/auth/me
        print("\n2️⃣  Testing GET /api/v1/auth/me")
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if response.status_code == 200:
            user_data = response.json()
            print("✅ GET /me endpoint works")
            print(f"   Username: {user_data['username']}")
            print(f"   Full name: {user_data['full_name']}")
        else:
            print(f"❌ GET /me failed: {response.status_code}")
            print(f"   Response: {response.text}")

        # Test 3: Test POST /api/v1/auth/test-token
        print("\n3️⃣  Testing POST /api/v1/auth/test-token")
        response = client.post(
            "/api/v1/auth/test-token",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if response.status_code == 200:
            user_data = response.json()
            print("✅ POST /test-token endpoint works")
            print(f"   Username: {user_data['username']}")
        else:
            print(f"❌ POST /test-token failed: {response.status_code}")
            print(f"   Response: {response.text}")

        # Test 4: Test without token (should fail)
        print("\n4️⃣  Testing GET /api/v1/auth/me without token")
        response = client.get("/api/v1/auth/me")

        if response.status_code == 401:
            print("✅ Properly rejects requests without token")
        else:
            print(f"❌ Should have returned 401, got: {response.status_code}")

        print("\n🎉 All auth endpoint tests completed!")

    except Exception as e:
        print(f"❌ Error during testing: {e}")


if __name__ == "__main__":
    test_auth_endpoints()
