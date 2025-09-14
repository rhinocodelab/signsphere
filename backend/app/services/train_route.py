from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.train_route import TrainRoute
from app.schemas.train_route import TrainRouteCreate, TrainRouteUpdate


class TrainRouteService:
    def __init__(self, db: Session):
        self.db = db

    def create_train_route(self, train_route: TrainRouteCreate) -> TrainRoute:
        """Create a new train route"""
        db_train_route = TrainRoute(**train_route.dict())
        self.db.add(db_train_route)
        self.db.commit()
        self.db.refresh(db_train_route)
        return db_train_route

    def get_train_route(self, train_route_id: int) -> Optional[TrainRoute]:
        """Get a train route by ID"""
        return self.db.query(TrainRoute).filter(TrainRoute.id == train_route_id).first()

    def get_train_route_by_number(self, train_number: str) -> Optional[TrainRoute]:
        """Get a train route by train number"""
        return self.db.query(TrainRoute).filter(TrainRoute.train_number == train_number).first()

    def get_train_routes(self, skip: int = 0, limit: int = 100) -> List[TrainRoute]:
        """Get all train routes with pagination"""
        return self.db.query(TrainRoute).offset(skip).limit(limit).all()

    def search_train_routes(self, query: str) -> List[TrainRoute]:
        """Search train routes by train number or name"""
        return self.db.query(TrainRoute).filter(
            (TrainRoute.train_number.ilike(f"%{query}%")) |
            (TrainRoute.train_name.ilike(f"%{query}%"))
        ).all()

    def update_train_route(self, train_route_id: int, train_route_update: TrainRouteUpdate) -> Optional[TrainRoute]:
        """Update a train route"""
        db_train_route = self.get_train_route(train_route_id)
        if db_train_route:
            update_data = train_route_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_train_route, field, value)
            self.db.commit()
            self.db.refresh(db_train_route)
        return db_train_route

    def delete_train_route(self, train_route_id: int) -> bool:
        """Delete a train route"""
        db_train_route = self.get_train_route(train_route_id)
        if db_train_route:
            self.db.delete(db_train_route)
            self.db.commit()
            return True
        return False

    def clear_all_train_routes(self) -> int:
        """Clear all train routes from the database"""
        count = self.db.query(TrainRoute).count()
        self.db.query(TrainRoute).delete()
        self.db.commit()
        return count


def get_train_route_service(db: Session) -> TrainRouteService:
    """Dependency to get train route service"""
    return TrainRouteService(db)
