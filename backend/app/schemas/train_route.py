from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TrainRouteBase(BaseModel):
    train_number: str
    train_name: str
    from_station_code: str
    from_station: str
    to_station_code: str
    to_station: str
    is_translated: bool = False


class TrainRouteCreate(TrainRouteBase):
    pass


class TrainRouteUpdate(BaseModel):
    train_number: Optional[str] = None
    train_name: Optional[str] = None
    from_station_code: Optional[str] = None
    from_station: Optional[str] = None
    to_station_code: Optional[str] = None
    to_station: Optional[str] = None
    is_translated: Optional[bool] = None


class TrainRoute(TrainRouteBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
