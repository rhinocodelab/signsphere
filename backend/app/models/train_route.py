from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class TrainRoute(Base):
    __tablename__ = "train_routes"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String(10), unique=True, nullable=False, index=True)
    train_name = Column(String(200), nullable=False)
    from_station_code = Column(String(10), nullable=False, index=True)
    from_station = Column(String(100), nullable=False)
    to_station_code = Column(String(10), nullable=False, index=True)
    to_station = Column(String(100), nullable=False)
    is_translated = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship with TrainRouteTranslation
    translations = relationship(
        "TrainRouteTranslation", back_populates="train_route")

    def __repr__(self):
        return f"<TrainRoute(train_number='{self.train_number}', train_name='{self.train_name}', from_station='{self.from_station}', to_station='{self.to_station}')>"
