#!/usr/bin/env python3
"""
Test script to verify the clear all routes functionality
"""

from app.main import app
from fastapi.testclient import TestClient
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


def test_clear_all_routes():
    """Test the clear all routes functionality"""

    print("🗑️  Testing Clear All Routes Functionality")
    print("=" * 50)

    client = TestClient(app)

    try:
        # Test 1: Login to get a token
        print("1️⃣  Login to get authentication token")
        login_data = {
            "username": "admin",
            "password": "admin"
        }
        response = client.post("/api/v1/auth/login", data=login_data)

        if response.status_code != 200:
            print(f"❌ Login failed: {response.status_code}")
            return

        token_data = response.json()
        access_token = token_data["access_token"]
        print("✅ Login successful")

        # Test 2: Check current number of routes
        print("\n2️⃣  Check current number of train routes")
        response = client.get(
            "/api/v1/train-routes/",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if response.status_code == 200:
            routes = response.json()
            initial_count = len(routes)
            print(f"✅ Found {initial_count} train routes")
        else:
            print(f"❌ Failed to get routes: {response.status_code}")
            return

        if initial_count == 0:
            print("ℹ️  No routes to clear, adding a test route first")
            # Add a test route
            test_route = {
                "train_number": "TEST999",
                "train_name": "Test Route",
                "from_station_code": "TEST",
                "from_station": "Test Station",
                "to_station_code": "DEST",
                "to_station": "Destination Station"
            }
            response = client.post(
                "/api/v1/train-routes/",
                json=test_route,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if response.status_code == 200:
                print("✅ Added test route")
                initial_count = 1
            else:
                print(f"❌ Failed to add test route: {response.status_code}")
                return

        # Test 3: Clear all routes
        print(f"\n3️⃣  Clear all {initial_count} train routes")
        response = client.delete(
            "/api/v1/train-routes/",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if response.status_code == 200:
            result = response.json()
            print(f"✅ {result['message']}")
        else:
            print(f"❌ Failed to clear routes: {response.status_code}")
            print(f"   Response: {response.text}")
            return

        # Test 4: Verify routes are cleared
        print("\n4️⃣  Verify all routes are cleared")
        response = client.get(
            "/api/v1/train-routes/",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if response.status_code == 200:
            routes = response.json()
            final_count = len(routes)
            print(f"✅ Routes after clearing: {final_count}")

            if final_count == 0:
                print("✅ Successfully cleared all routes")
            else:
                print(f"❌ Expected 0 routes, got {final_count}")
        else:
            print(f"❌ Failed to verify cleared routes: {response.status_code}")

        print("\n🎉 Clear all routes test completed!")

    except Exception as e:
        print(f"❌ Error during testing: {e}")


if __name__ == "__main__":
    test_clear_all_routes()
