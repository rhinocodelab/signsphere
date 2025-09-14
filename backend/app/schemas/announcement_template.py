from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AnnouncementTemplateBase(BaseModel):
    category: str
    english_template: str
    hindi_template: Optional[str] = None
    marathi_template: Optional[str] = None
    gujarati_template: Optional[str] = None
    is_translated: bool = False
    detected_placeholders: Optional[str] = None


class AnnouncementTemplateCreate(AnnouncementTemplateBase):
    pass


class AnnouncementTemplateUpdate(BaseModel):
    category: Optional[str] = None
    english_template: Optional[str] = None
    hindi_template: Optional[str] = None
    marathi_template: Optional[str] = None
    gujarati_template: Optional[str] = None
    is_translated: Optional[bool] = None
    detected_placeholders: Optional[str] = None


class AnnouncementTemplate(AnnouncementTemplateBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TranslationRequest(BaseModel):
    template_id: int
    english_template: str


class TranslationResponse(BaseModel):
    template_id: int
    english_template: str
    hindi_template: str
    marathi_template: str
    gujarati_template: str
