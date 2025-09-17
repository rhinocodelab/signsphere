from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator


class GeneralAnnouncementBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Announcement title")
    category: str = Field(..., description="Announcement category")
    english_content: str = Field(..., min_length=1, description="English announcement content")
    hindi_content: Optional[str] = Field(None, description="Hindi translation")
    marathi_content: Optional[str] = Field(None, description="Marathi translation")
    gujarati_content: Optional[str] = Field(None, description="Gujarati translation")
    ai_model_type: str = Field(default="male", description="AI model type (male/female)")
    isl_video_path: Optional[str] = Field(None, description="Path to ISL video file")
    audio_path: Optional[str] = Field(None, description="Path to audio file")

    @validator('category')
    def validate_category(cls, v):
        valid_categories = [
            'Arrival', 'Departure', 'Delay', 'Platform Change', 
            'Safety', 'Weather', 'General Information', 'Emergency', 
            'Maintenance', 'Other'
        ]
        if v not in valid_categories:
            raise ValueError(f'Category must be one of: {", ".join(valid_categories)}')
        return v

    @validator('ai_model_type')
    def validate_ai_model_type(cls, v):
        if v not in ['male', 'female']:
            raise ValueError('AI model type must be either "male" or "female"')
        return v


class GeneralAnnouncementCreate(GeneralAnnouncementBase):
    pass


class GeneralAnnouncementUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = None
    english_content: Optional[str] = Field(None, min_length=1)
    hindi_content: Optional[str] = None
    marathi_content: Optional[str] = None
    gujarati_content: Optional[str] = None
    ai_model_type: Optional[str] = None
    isl_video_path: Optional[str] = None
    audio_path: Optional[str] = None
    is_active: Optional[bool] = None

    @validator('category')
    def validate_category(cls, v):
        if v is not None:
            valid_categories = [
                'Arrival', 'Departure', 'Delay', 'Platform Change', 
                'Safety', 'Weather', 'General Information', 'Emergency', 
                'Maintenance', 'Other'
            ]
            if v not in valid_categories:
                raise ValueError(f'Category must be one of: {", ".join(valid_categories)}')
        return v

    @validator('ai_model_type')
    def validate_ai_model_type(cls, v):
        if v is not None and v not in ['male', 'female']:
            raise ValueError('AI model type must be either "male" or "female"')
        return v


class GeneralAnnouncementInDBBase(GeneralAnnouncementBase):
    id: int
    is_translated: bool
    is_active: bool
    created_by_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GeneralAnnouncement(GeneralAnnouncementInDBBase):
    pass


class GeneralAnnouncementWithCreator(GeneralAnnouncementInDBBase):
    creator_username: Optional[str] = None
    creator_full_name: Optional[str] = None


class GeneralAnnouncementTranslationRequest(BaseModel):
    english_text: str = Field(..., min_length=1, max_length=10000, description="English text to translate")