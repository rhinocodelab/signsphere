#!/usr/bin/env python3
"""
Script to populate the database with sample train route data
"""

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.train_route import get_train_route_service
from app.schemas.train_route import TrainRouteCreate

def populate_train_routes():
    """Populate the database with sample train route data"""
    
    # Sample train route data based on the XLSX format
    sample_routes = [
        {
            "train_number": "12951",
            "train_name": "Mumbai Rajdhani",
            "from_station_code": "BCT",
            "from_station": "Mumbai Central",
            "to_station_code": "NDLS",
            "to_station": "New Delhi"
        },
        {
            "train_number": "12953",
            "train_name": "Swarna Jayanti Rajdhani",
            "from_station_code": "BCT",
            "from_station": "Mumbai Central",
            "to_station_code": "NDLS",
            "to_station": "New Delhi"
        },
        {
            "train_number": "12955",
            "train_name": "August Kranti Rajdhani",
            "from_station_code": "BCT",
            "from_station": "Mumbai Central",
            "to_station_code": "NDLS",
            "to_station": "New Delhi"
        },
        {
            "train_number": "12957",
            "train_name": "Mumbai Duronto",
            "from_station_code": "BCT",
            "from_station": "Mumbai Central",
            "to_station_code": "ADI",
            "to_station": "Ahmedabad"
        },
        {
            "train_number": "12961",
            "train_name": "Ahmedabad Duronto",
            "from_station_code": "ADI",
            "from_station": "Ahmedabad",
            "to_station_code": "BCT",
            "to_station": "Mumbai Central"
        },
        {
            "train_number": "12963",
            "train_name": "Shatabdi Express",
            "from_station_code": "BCT",
            "from_station": "Mumbai Central",
            "to_station_code": "ADI",
            "to_station": "Ahmedabad"
        },
        {
            "train_number": "12965",
            "train_name": "Gujarat Express",
            "from_station_code": "BCT",
            "from_station": "Mumbai Central",
            "to_station_code": "ADI",
            "to_station": "Ahmedabad"
        },
        {
            "train_number": "19015",
            "train_name": "Saurashtra Express",
            "from_station_code": "BCT",
            "from_station": "Mumbai Central",
            "to_station_code": "ADI",
            "to_station": "Ahmedabad"
        },
        {
            "train_number": "19017",
            "train_name": "Gujarat Mail",
            "from_station_code": "BCT",
            "from_station": "Mumbai Central",
            "to_station_code": "ADI",
            "to_station": "Ahmedabad"
        },
        {
            "train_number": "12967",
            "train_name": "Golden Temple Mail",
            "from_station_code": "BCT",
            "from_station": "Mumbai Central",
            "to_station_code": "ASR",
            "to_station": "Amritsar"
        }
    ]
    
    db = SessionLocal()
    train_route_service = get_train_route_service(db)
    
    try:
        created_count = 0
        skipped_count = 0
        
        for route_data in sample_routes:
            # Check if train route already exists
            existing_route = train_route_service.get_train_route_by_number(route_data["train_number"])
            
            if existing_route:
                print(f"⏭️  Skipping {route_data['train_number']} - {route_data['train_name']} (already exists)")
                skipped_count += 1
            else:
                train_route_create = TrainRouteCreate(**route_data)
                train_route_service.create_train_route(train_route_create)
                print(f"✅ Created {route_data['train_number']} - {route_data['train_name']}")
                created_count += 1
        
        print(f"\n🎉 Population completed!")
        print(f"   Created: {created_count} train routes")
        print(f"   Skipped: {skipped_count} train routes")
        
    except Exception as e:
        print(f"❌ Error populating train routes: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚂 Populating train routes database...")
    print("=" * 50)
    populate_train_routes()
