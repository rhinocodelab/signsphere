from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.base_class import Base


class AnnouncementTemplate(Base):
    __tablename__ = "announcement_templates"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False, index=True)
    english_template = Column(Text, nullable=False)
    hindi_template = Column(Text, nullable=True)
    marathi_template = Column(Text, nullable=True)
    gujarati_template = Column(Text, nullable=True)
    is_translated = Column(Boolean, default=False, nullable=False)
    # JSON string of placeholders
    detected_placeholders = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
