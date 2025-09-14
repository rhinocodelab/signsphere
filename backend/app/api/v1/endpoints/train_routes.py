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
    """Create a new train route"""
    train_route_service = get_train_route_service(db)

    # Check if train route already exists
    existing_route = train_route_service.get_train_route_by_number(
        train_route.train_number)
    if existing_route:
        raise HTTPException(
            status_code=400,
            detail=f"Train route with number {train_route.train_number} already exists"
        )

    return train_route_service.create_train_route(train_route)


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
