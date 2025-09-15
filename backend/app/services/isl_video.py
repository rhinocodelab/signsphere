from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
import os
from app.models.isl_video import ISLVideo
from app.schemas.isl_video import ISLVideoCreate, ISLVideoUpdate, ISLVideoSearch


class ISLVideoService:
    def __init__(self, db: Session):
        self.db = db

    def create_isl_video(self, video_data: ISLVideoCreate) -> ISLVideo:
        """Create a new ISL video record"""
        db_video = ISLVideo(**video_data.dict())
        self.db.add(db_video)
        self.db.commit()
        self.db.refresh(db_video)
        return db_video

    def get_isl_video(self, video_id: int) -> Optional[ISLVideo]:
        """Get an ISL video by ID"""
        return self.db.query(ISLVideo).filter(ISLVideo.id == video_id).first()

    def get_isl_videos(self, skip: int = 0, limit: int = 100) -> List[ISLVideo]:
        """Get all ISL videos with pagination"""
        return self.db.query(ISLVideo).offset(skip).limit(limit).all()

    def get_isl_videos_by_model_type(self, model_type: str) -> List[ISLVideo]:
        """Get ISL videos by model type (male/female)"""
        return self.db.query(ISLVideo).filter(
            and_(
                ISLVideo.model_type == model_type,
                ISLVideo.is_active == True
            )
        ).all()

    def search_isl_videos(self, search_params: ISLVideoSearch) -> List[ISLVideo]:
        """Search ISL videos with various filters"""
        query = self.db.query(ISLVideo)
        
        # Apply filters
        if search_params.model_type:
            query = query.filter(ISLVideo.model_type == search_params.model_type)
        
        if search_params.content_type:
            query = query.filter(ISLVideo.content_type == search_params.content_type)
        
        if search_params.is_active is not None:
            query = query.filter(ISLVideo.is_active == search_params.is_active)
        
        if search_params.min_duration:
            query = query.filter(ISLVideo.duration_seconds >= search_params.min_duration)
        
        if search_params.max_duration:
            query = query.filter(ISLVideo.duration_seconds <= search_params.max_duration)
        
        if search_params.min_file_size:
            query = query.filter(ISLVideo.file_size >= search_params.min_file_size)
        
        if search_params.max_file_size:
            query = query.filter(ISLVideo.file_size <= search_params.max_file_size)
        
        # Text search in description and tags
        if search_params.search_text:
            search_term = f"%{search_params.search_text}%"
            query = query.filter(
                or_(
                    ISLVideo.description.ilike(search_term),
                    ISLVideo.tags.ilike(search_term),
                    ISLVideo.filename.ilike(search_term),
                    ISLVideo.display_name.ilike(search_term)
                )
            )
        
        # Apply pagination
        query = query.offset(search_params.offset).limit(search_params.limit)
        
        return query.all()

    def update_isl_video(self, video_id: int, video_update: ISLVideoUpdate) -> Optional[ISLVideo]:
        """Update an ISL video"""
        db_video = self.get_isl_video(video_id)
        if db_video:
            update_data = video_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_video, field, value)
            self.db.commit()
            self.db.refresh(db_video)
        return db_video

    def delete_isl_video(self, video_id: int) -> bool:
        """Delete an ISL video (soft delete and remove file and folder)"""
        import os
        db_video = self.get_isl_video(video_id)
        if db_video:
            # Try to delete the video file from filesystem
            try:
                if os.path.exists(db_video.video_path):
                    os.remove(db_video.video_path)
                    print(f"Deleted video file: {db_video.video_path}")
                    
                    # Try to delete the folder if it's empty
                    video_dir = os.path.dirname(db_video.video_path)
                    try:
                        if os.path.exists(video_dir) and not os.listdir(video_dir):
                            os.rmdir(video_dir)
                            print(f"Deleted empty folder: {video_dir}")
                    except Exception as folder_error:
                        print(f"Error deleting folder {video_dir}: {folder_error}")
                        # Continue even if folder deletion fails
                        
            except Exception as e:
                print(f"Error deleting video file {db_video.video_path}: {e}")
                # Continue with soft delete even if file deletion fails
            
            # Soft delete from database
            db_video.is_active = False
            self.db.commit()
            return True
        return False

    def hard_delete_isl_video(self, video_id: int) -> bool:
        """Permanently delete an ISL video from database and filesystem"""
        import os
        db_video = self.get_isl_video(video_id)
        if db_video:
            # Try to delete the video file from filesystem
            try:
                if os.path.exists(db_video.video_path):
                    os.remove(db_video.video_path)
                    print(f"Deleted video file: {db_video.video_path}")
                    
                    # Try to delete the folder if it's empty
                    video_dir = os.path.dirname(db_video.video_path)
                    try:
                        if os.path.exists(video_dir) and not os.listdir(video_dir):
                            os.rmdir(video_dir)
                            print(f"Deleted empty folder: {video_dir}")
                    except Exception as folder_error:
                        print(f"Error deleting folder {video_dir}: {folder_error}")
                        # Continue even if folder deletion fails
                        
            except Exception as e:
                print(f"Error deleting video file {db_video.video_path}: {e}")
                # Continue with database deletion even if file deletion fails
            
            # Permanently delete from database
            self.db.delete(db_video)
            self.db.commit()
            return True
        return False

    def get_video_statistics(self) -> dict:
        """Get statistics about ISL videos"""
        total_videos = self.db.query(ISLVideo).count()
        active_videos = self.db.query(ISLVideo).filter(ISLVideo.is_active == True).count()
        male_videos = self.db.query(ISLVideo).filter(
            and_(ISLVideo.model_type == 'male', ISLVideo.is_active == True)
        ).count()
        female_videos = self.db.query(ISLVideo).filter(
            and_(ISLVideo.model_type == 'female', ISLVideo.is_active == True)
        ).count()
        
        total_size = self.db.query(func.sum(ISLVideo.file_size)).scalar() or 0
        total_duration = self.db.query(func.sum(ISLVideo.duration_seconds)).scalar() or 0
        
        return {
            "total_videos": total_videos,
            "active_videos": active_videos,
            "male_videos": male_videos,
            "female_videos": female_videos,
            "total_size_bytes": total_size,
            "total_duration_seconds": float(total_duration) if total_duration else 0
        }

    def check_duplicate_video(self, filename: str, model_type: str, file_size: int = None) -> Optional[ISLVideo]:
        """Check if a video with the same filename and model type already exists"""
        query = self.db.query(ISLVideo).filter(
            and_(
                ISLVideo.filename == filename,
                ISLVideo.model_type == model_type,
                ISLVideo.is_active == True
            )
        )
        
        # If file_size is provided, also check for exact file size match
        if file_size is not None:
            query = query.filter(ISLVideo.file_size == file_size)
        
        return query.first()

    def check_duplicate_by_display_name(self, display_name: str, model_type: str) -> Optional[ISLVideo]:
        """Check if a video with the same display name and model type already exists"""
        return self.db.query(ISLVideo).filter(
            and_(
                ISLVideo.display_name == display_name,
                ISLVideo.model_type == model_type,
                ISLVideo.is_active == True
            )
        ).first()

    def get_duplicate_videos(self, filename: str, model_type: str, file_size: int = None) -> List[ISLVideo]:
        """Get all potential duplicate videos (by filename, display_name, or file_size)"""
        duplicates = []
        
        # Check by filename
        filename_duplicate = self.check_duplicate_video(filename, model_type, file_size)
        if filename_duplicate:
            duplicates.append(filename_duplicate)
        
        # Check by display name (if different from filename)
        display_name = os.path.splitext(filename)[0]  # Remove extension
        display_name_duplicate = self.check_duplicate_by_display_name(display_name, model_type)
        if display_name_duplicate and display_name_duplicate not in duplicates:
            duplicates.append(display_name_duplicate)
        
        # If file_size provided, check for videos with same size (potential duplicates)
        if file_size is not None:
            size_duplicates = self.db.query(ISLVideo).filter(
                and_(
                    ISLVideo.model_type == model_type,
                    ISLVideo.file_size == file_size,
                    ISLVideo.is_active == True
                )
            ).all()
            
            for duplicate in size_duplicates:
                if duplicate not in duplicates:
                    duplicates.append(duplicate)
        
        return duplicates


def get_isl_video_service(db: Session) -> ISLVideoService:
    """Dependency to get ISL video service"""
    return ISLVideoService(db)
