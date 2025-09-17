from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, CheckConstraint, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class GeneralAnnouncement(Base):
    __tablename__ = "general_announcements"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic Information
    title = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    
    # Content
    english_content = Column(Text, nullable=False)
    hindi_content = Column(Text, nullable=True)
    marathi_content = Column(Text, nullable=True)
    gujarati_content = Column(Text, nullable=True)
    
    # AI Model Information
    ai_model_type = Column(String(10), nullable=False, default='male')
    
    # Media Files
    isl_video_path = Column(String(500), nullable=True)
    audio_path = Column(String(500), nullable=True)
    
    # Status and Metadata
    is_translated = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # User Information
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    creator = relationship("User", back_populates="general_announcements")

    # Constraints
    __table_args__ = (
        CheckConstraint("ai_model_type IN ('male', 'female')", name='check_ai_model_type'),
        CheckConstraint("category IN ('Arrival', 'Departure', 'Delay', 'Platform Change', 'Safety', 'Weather', 'General Information', 'Emergency', 'Maintenance', 'Other')", name='check_category'),
        Index('idx_general_announcements_search', 'title', 'category', postgresql_using='gin'),
        Index('idx_general_announcements_created_by', 'created_by_id'),
        Index('idx_general_announcements_active', 'is_active'),
    )

    def __repr__(self):
        return f"<GeneralAnnouncement(id={self.id}, title='{self.title}', category='{self.category}')>"