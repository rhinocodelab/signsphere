from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class TrainRouteTranslation(Base):
    __tablename__ = "train_route_translations"

    id = Column(Integer, primary_key=True, index=True)
    train_route_id = Column(Integer, ForeignKey(
        "train_routes.id"), nullable=False, index=True)

    # English (default language)
    train_name_en = Column(String(200), nullable=False)
    from_station_en = Column(String(100), nullable=False)
    to_station_en = Column(String(100), nullable=False)

    # Hindi translations
    train_name_hi = Column(String(200), nullable=True)
    from_station_hi = Column(String(100), nullable=True)
    to_station_hi = Column(String(100), nullable=True)

    # Marathi translations
    train_name_mr = Column(String(200), nullable=True)
    from_station_mr = Column(String(100), nullable=True)
    to_station_mr = Column(String(100), nullable=True)

    # Gujarati translations
    train_name_gu = Column(String(200), nullable=True)
    from_station_gu = Column(String(100), nullable=True)
    to_station_gu = Column(String(100), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship with TrainRoute
    train_route = relationship("TrainRoute", back_populates="translations")

    def __repr__(self):
        return f"<TrainRouteTranslation(train_route_id={self.train_route_id}, train_name_en='{self.train_name_en}')>"
