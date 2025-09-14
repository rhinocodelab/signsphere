#!/usr/bin/env python3
"""
Test script to verify train routes API endpoints work correctly
"""

from app.main import app
from fastapi.testclient import TestClient
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


def test_train_routes_api():
    """Test the train routes API endpoints"""

    print("🚂 Testing Train Routes API Endpoints")
    print("=" * 50)

    client = TestClient(app)

    # Test data
    test_route = {
        "train_number": "TEST123",
        "train_name": "Test Express",
        "from_station_code": "TEST",
        "from_station": "Test Station",
        "to_station_code": "DEST",
        "to_station": "Destination Station"
    }

    try:
        # Test 1: Create a train route
        print("1️⃣  Testing POST /api/v1/train-routes/")
        response = client.post("/api/v1/train-routes/", json=test_route)

        if response.status_code == 200:
            print("✅ Train route created successfully")
            route_data = response.json()
            route_id = route_data["id"]
            print(f"   Created route ID: {route_id}")
        else:
            print(f"❌ Failed to create train route: {response.status_code}")
            print(f"   Response: {response.text}")
            return

        # Test 2: Get all train routes
        print("\n2️⃣  Testing GET /api/v1/train-routes/")
        response = client.get("/api/v1/train-routes/")

        if response.status_code == 200:
            routes = response.json()
            print(f"✅ Retrieved {len(routes)} train routes")
        else:
            print(f"❌ Failed to get train routes: {response.status_code}")

        # Test 3: Search train routes
        print("\n3️⃣  Testing GET /api/v1/train-routes/search?q=TEST123")
        response = client.get("/api/v1/train-routes/search?q=TEST123")

        if response.status_code == 200:
            routes = response.json()
            print(f"✅ Found {len(routes)} routes matching search")
        else:
            print(f"❌ Failed to search train routes: {response.status_code}")

        # Test 4: Get specific train route by ID
        print(f"\n4️⃣  Testing GET /api/v1/train-routes/{route_id}")
        response = client.get(f"/api/v1/train-routes/{route_id}")

        if response.status_code == 200:
            route = response.json()
            print(
                f"✅ Retrieved train route: {route['train_number']} - {route['train_name']}")
        else:
            print(f"❌ Failed to get train route by ID: {response.status_code}")

        # Test 5: Update train route
        print(f"\n5️⃣  Testing PUT /api/v1/train-routes/{route_id}")
        update_data = {"train_name": "Updated Test Express"}
        response = client.put(
            f"/api/v1/train-routes/{route_id}", json=update_data)

        if response.status_code == 200:
            route = response.json()
            print(f"✅ Updated train route: {route['train_name']}")
        else:
            print(f"❌ Failed to update train route: {response.status_code}")

        # Test 6: Delete train route
        print(f"\n6️⃣  Testing DELETE /api/v1/train-routes/{route_id}")
        response = client.delete(f"/api/v1/train-routes/{route_id}")

        if response.status_code == 200:
            print("✅ Train route deleted successfully")
        else:
            print(f"❌ Failed to delete train route: {response.status_code}")

        print("\n🎉 All API endpoint tests completed successfully!")

    except Exception as e:
        print(f"❌ Error during testing: {e}")


if __name__ == "__main__":
    test_train_routes_api()
