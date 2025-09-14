from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ISLVideoBase(BaseModel):
    filename: str
    display_name: Optional[str] = None
    video_path: str
    file_size: int
    duration_seconds: Optional[Decimal] = None
    width: Optional[int] = None
    height: Optional[int] = None
    model_type: str
    mime_type: str
    file_extension: str
    description: Optional[str] = None
    tags: Optional[str] = None
    content_type: Optional[str] = None
    is_active: bool = True

    @validator('model_type')
    def validate_model_type(cls, v):
        if v not in ['male', 'female']:
            raise ValueError('model_type must be either "male" or "female"')
        return v

    @validator('file_size')
    def validate_file_size(cls, v):
        if v <= 0:
            raise ValueError('file_size must be greater than 0')
        return v

    @validator('duration_seconds')
    def validate_duration(cls, v):
        if v is not None and v <= 0:
            raise ValueError('duration_seconds must be greater than 0')
        return v


class ISLVideoCreate(ISLVideoBase):
    pass


class ISLVideoUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    content_type: Optional[str] = None
    is_active: Optional[bool] = None


class ISLVideo(ISLVideoBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ISLVideoSearch(BaseModel):
    model_type: Optional[str] = None
    content_type: Optional[str] = None
    search_text: Optional[str] = None
    min_duration: Optional[Decimal] = None
    max_duration: Optional[Decimal] = None
    min_file_size: Optional[int] = None
    max_file_size: Optional[int] = None
    is_active: Optional[bool] = True
    limit: int = 50
    offset: int = 0
