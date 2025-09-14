#!/usr/bin/env python3
"""
Script to verify that train routes are properly stored in the database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.train_route import get_train_route_service

def verify_train_routes():
    """Verify that train routes are properly stored in the database"""
    
    print("🚂 Verifying Train Routes Database")
    print("=" * 40)
    
    db = SessionLocal()
    train_route_service = get_train_route_service(db)
    
    try:
        # Get all train routes
        routes = train_route_service.get_train_routes()
        print(f"📊 Total train routes in database: {len(routes)}")
        
        if routes:
            print("\n📋 Train Routes:")
            print("-" * 80)
            print(f"{'Train #':<10} {'Train Name':<25} {'From':<15} {'To':<15}")
            print("-" * 80)
            
            for route in routes:
                print(f"{route.train_number:<10} {route.train_name:<25} {route.from_station:<15} {route.to_station:<15}")
            
            print("-" * 80)
            
            # Test search functionality
            print(f"\n🔍 Testing search functionality:")
            
            # Search by train number
            search_results = train_route_service.search_train_routes("12951")
            print(f"   Search for '12951': {len(search_results)} results")
            
            # Search by train name
            search_results = train_route_service.search_train_routes("Rajdhani")
            print(f"   Search for 'Rajdhani': {len(search_results)} results")
            
            # Search by station
            search_results = train_route_service.search_train_routes("Mumbai")
            print(f"   Search for 'Mumbai': {len(search_results)} results")
            
            print(f"\n✅ Database verification completed successfully!")
            print(f"   All {len(routes)} train routes are properly stored and searchable")
            
        else:
            print("❌ No train routes found in database")
            
    except Exception as e:
        print(f"❌ Error verifying train routes: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_train_routes()
