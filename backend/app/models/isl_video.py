from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Numeric, CheckConstraint, Index
from sqlalchemy.sql import func
from app.db.base_class import Base


class ISLVideo(Base):
    __tablename__ = "isl_videos"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Video Identification
    filename = Column(String(255), nullable=False, index=True)
    display_name = Column(String(255), nullable=True)
    video_path = Column(String(500), nullable=False, unique=True)
    
    # Video Properties
    file_size = Column(Integer, nullable=False)  # File size in bytes
    duration_seconds = Column(Numeric(8, 2), nullable=True)  # Video duration
    width = Column(Integer, nullable=True)  # Video width in pixels
    height = Column(Integer, nullable=True)  # Video height in pixels
    
    # Model Information
    model_type = Column(String(10), nullable=False, index=True)
    
    # File Information
    mime_type = Column(String(100), nullable=False)
    file_extension = Column(String(10), nullable=False)
    
    # Search and Filtering
    description = Column(Text, nullable=True)
    tags = Column(String(500), nullable=True, index=True)
    content_type = Column(String(100), nullable=True, index=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Constraints
    __table_args__ = (
        CheckConstraint("model_type IN ('male', 'female')", name='check_model_type'),
        CheckConstraint("file_size > 0", name='check_file_size'),
        CheckConstraint("duration_seconds > 0", name='check_duration'),
        Index('idx_isl_videos_search', 'description', 'tags', postgresql_using='gin'),
    )

    def __repr__(self):
        return f"<ISLVideo(id={self.id}, filename='{self.filename}', model_type='{self.model_type}')>"
