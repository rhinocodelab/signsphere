from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.deps import get_db
from app.services.train_route import get_train_route_service, TrainRouteService
from app.schemas.train_route import TrainRoute, TrainRouteCreate, TrainRouteUpdate

router = APIRouter()


@router.post("/", response_model=TrainRoute)
def create_train_route(
    train_route: TrainRouteCreate,
    db: Session = Depends(get_db)
):
    """Create a new train route and automatically generate translations"""
    train_route_service = get_train_route_service(db)

    # Check if train route already exists
    existing_route = train_route_service.get_train_route_by_number(
        train_route.train_number)
    if existing_route:
        raise HTTPException(
            status_code=400,
            detail=f"Train route with number {train_route.train_number} already exists"
        )

    # Create the train route
    created_route = train_route_service.create_train_route(train_route)

    # Automatically generate translations
    try:
        from app.services.train_route_translation import get_train_route_translation_service
        from app.schemas.train_route_translation import TranslationRequest

        translation_service = get_train_route_translation_service(db)

        # Create translation request
        translation_request = TranslationRequest(
            train_route_id=created_route.id,
            train_name_en=created_route.train_name,
            from_station_en=created_route.from_station,
            to_station_en=created_route.to_station,
            source_language_code="en"
        )

        # Generate and save translations
        translation_response = translation_service.translate_train_route(
            translation_request)

        # Create translation record
        from app.schemas.train_route_translation import TrainRouteTranslationCreate
        translation_data = TrainRouteTranslationCreate(
            train_route_id=translation_response.train_route_id,
            train_name_en=translation_response.train_name_en,
            from_station_en=translation_response.from_station_en,
            to_station_en=translation_response.to_station_en,
            train_name_hi=translation_response.train_name_hi,
            from_station_hi=translation_response.from_station_hi,
            to_station_hi=translation_response.to_station_hi,
            train_name_mr=translation_response.train_name_mr,
            from_station_mr=translation_response.from_station_mr,
            to_station_mr=translation_response.to_station_mr,
            train_name_gu=translation_response.train_name_gu,
            from_station_gu=translation_response.from_station_gu,
            to_station_gu=translation_response.to_station_gu
        )

        # Save translation to database
        translation_service.create_train_route_translation(translation_data)

    except Exception as e:
        # If translation fails, log the error but don't fail the route creation
        print(f"Auto-translation failed for route {created_route.id}: {e}")
        # The route is still created successfully, just without translations

    return created_route


@router.get("/", response_model=List[TrainRoute])
def get_train_routes(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000,
                       description="Number of records to return"),
    db: Session = Depends(get_db)
):
    """Get all train routes with pagination"""
    train_route_service = get_train_route_service(db)
    return train_route_service.get_train_routes(skip=skip, limit=limit)


@router.get("/search", response_model=List[TrainRoute])
def search_train_routes(
    q: str = Query(..., min_length=1,
                   description="Search query for train number or name"),
    db: Session = Depends(get_db)
):
    """Search train routes by train number or name"""
    train_route_service = get_train_route_service(db)
    return train_route_service.search_train_routes(q)


@router.get("/{train_route_id}", response_model=TrainRoute)
def get_train_route(
    train_route_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific train route by ID"""
    train_route_service = get_train_route_service(db)
    train_route = train_route_service.get_train_route(train_route_id)
    if not train_route:
        raise HTTPException(status_code=404, detail="Train route not found")
    return train_route


@router.get("/by-number/{train_number}", response_model=TrainRoute)
def get_train_route_by_number(
    train_number: str,
    db: Session = Depends(get_db)
):
    """Get a specific train route by train number"""
    train_route_service = get_train_route_service(db)
    train_route = train_route_service.get_train_route_by_number(train_number)
    if not train_route:
        raise HTTPException(status_code=404, detail="Train route not found")
    return train_route


@router.put("/{train_route_id}", response_model=TrainRoute)
def update_train_route(
    train_route_id: int,
    train_route_update: TrainRouteUpdate,
    db: Session = Depends(get_db)
):
    """Update a train route"""
    train_route_service = get_train_route_service(db)
    train_route = train_route_service.update_train_route(
        train_route_id, train_route_update)
    if not train_route:
        raise HTTPException(status_code=404, detail="Train route not found")
    return train_route


@router.delete("/{train_route_id}")
def delete_train_route(
    train_route_id: int,
    db: Session = Depends(get_db)
):
    """Delete a train route"""
    train_route_service = get_train_route_service(db)
    success = train_route_service.delete_train_route(train_route_id)
    if not success:
        raise HTTPException(status_code=404, detail="Train route not found")
    return {"message": "Train route deleted successfully"}


@router.delete("/")
def clear_all_train_routes(
    db: Session = Depends(get_db)
):
    """Clear all train routes from the database"""
    train_route_service = get_train_route_service(db)
    deleted_count = train_route_service.clear_all_train_routes()
    return {"message": f"Successfully cleared {deleted_count} train routes"}
