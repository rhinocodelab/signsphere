from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TrainRouteTranslationBase(BaseModel):
    train_route_id: int
    train_name_en: str
    from_station_en: str
    to_station_en: str


class TrainRouteTranslationCreate(TrainRouteTranslationBase):
    train_name_hi: Optional[str] = None
    from_station_hi: Optional[str] = None
    to_station_hi: Optional[str] = None
    train_name_mr: Optional[str] = None
    from_station_mr: Optional[str] = None
    to_station_mr: Optional[str] = None
    train_name_gu: Optional[str] = None
    from_station_gu: Optional[str] = None
    to_station_gu: Optional[str] = None


class TrainRouteTranslationUpdate(BaseModel):
    train_name_en: Optional[str] = None
    from_station_en: Optional[str] = None
    to_station_en: Optional[str] = None
    train_name_hi: Optional[str] = None
    from_station_hi: Optional[str] = None
    to_station_hi: Optional[str] = None
    train_name_mr: Optional[str] = None
    from_station_mr: Optional[str] = None
    to_station_mr: Optional[str] = None
    train_name_gu: Optional[str] = None
    from_station_gu: Optional[str] = None
    to_station_gu: Optional[str] = None


class TrainRouteTranslation(TrainRouteTranslationBase):
    id: int
    train_number: Optional[str] = None
    train_name_hi: Optional[str] = None
    from_station_hi: Optional[str] = None
    to_station_hi: Optional[str] = None
    train_name_mr: Optional[str] = None
    from_station_mr: Optional[str] = None
    to_station_mr: Optional[str] = None
    train_name_gu: Optional[str] = None
    from_station_gu: Optional[str] = None
    to_station_gu: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Schema for translation request


class TranslationRequest(BaseModel):
    train_route_id: int
    train_name_en: str
    from_station_en: str
    to_station_en: str
    source_language_code: str = "en"

# Schema for translation response


class TranslationResponse(BaseModel):
    train_route_id: int
    train_name_en: str
    from_station_en: str
    to_station_en: str
    train_name_hi: str
    from_station_hi: str
    to_station_hi: str
    train_name_mr: str
    from_station_mr: str
    to_station_mr: str
    train_name_gu: str
    from_station_gu: str
    to_station_gu: str
