#!/usr/bin/env python3
"""
Simple test script to verify train routes API endpoints
"""

import requests
import json

# Base URL for the API
BASE_URL = "https://localhost:5001/api/v1"

def test_train_routes_api():
    """Test the train routes API endpoints"""
    
    print("🚂 Testing Train Routes API")
    print("=" * 40)
    
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
        print("1️⃣  Testing POST /train-routes/")
        response = requests.post(
            f"{BASE_URL}/train-routes/",
            json=test_route,
            verify=False  # For self-signed certificate
        )
        
        if response.status_code == 200:
            print("✅ Train route created successfully")
            route_data = response.json()
            route_id = route_data["id"]
        else:
            print(f"❌ Failed to create train route: {response.status_code}")
            print(f"   Response: {response.text}")
            return
        
        # Test 2: Get all train routes
        print("\n2️⃣  Testing GET /train-routes/")
        response = requests.get(
            f"{BASE_URL}/train-routes/",
            verify=False
        )
        
        if response.status_code == 200:
            routes = response.json()
            print(f"✅ Retrieved {len(routes)} train routes")
        else:
            print(f"❌ Failed to get train routes: {response.status_code}")
        
        # Test 3: Search train routes
        print("\n3️⃣  Testing GET /train-routes/search?q=TEST123")
        response = requests.get(
            f"{BASE_URL}/train-routes/search?q=TEST123",
            verify=False
        )
        
        if response.status_code == 200:
            routes = response.json()
            print(f"✅ Found {len(routes)} routes matching search")
        else:
            print(f"❌ Failed to search train routes: {response.status_code}")
        
        # Test 4: Get specific train route by ID
        print(f"\n4️⃣  Testing GET /train-routes/{route_id}")
        response = requests.get(
            f"{BASE_URL}/train-routes/{route_id}",
            verify=False
        )
        
        if response.status_code == 200:
            route = response.json()
            print(f"✅ Retrieved train route: {route['train_number']} - {route['train_name']}")
        else:
            print(f"❌ Failed to get train route by ID: {response.status_code}")
        
        # Test 5: Update train route
        print(f"\n5️⃣  Testing PUT /train-routes/{route_id}")
        update_data = {"train_name": "Updated Test Express"}
        response = requests.put(
            f"{BASE_URL}/train-routes/{route_id}",
            json=update_data,
            verify=False
        )
        
        if response.status_code == 200:
            route = response.json()
            print(f"✅ Updated train route: {route['train_name']}")
        else:
            print(f"❌ Failed to update train route: {response.status_code}")
        
        # Test 6: Delete train route
        print(f"\n6️⃣  Testing DELETE /train-routes/{route_id}")
        response = requests.delete(
            f"{BASE_URL}/train-routes/{route_id}",
            verify=False
        )
        
        if response.status_code == 200:
            print("✅ Train route deleted successfully")
        else:
            print(f"❌ Failed to delete train route: {response.status_code}")
        
        print("\n🎉 All tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Make sure the backend server is running")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_train_routes_api()
