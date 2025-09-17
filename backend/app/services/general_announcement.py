import os
import json
import shutil
import uuid
from pathlib import Path
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from google.cloud import translate_v3
from app.models.general_announcement import GeneralAnnouncement
from app.schemas.general_announcement import GeneralAnnouncementCreate, GeneralAnnouncementUpdate


class GeneralAnnouncementService:
    def __init__(self, db: Session):
        self.db = db
        self._setup_gcp_client()

    def _setup_gcp_client(self):
        """Setup Google Cloud Translation client using credentials from frontend/config/isl.json"""
        try:
            # Path to the GCP credentials file
            credentials_path = os.path.join(os.path.dirname(
                __file__), "../../../frontend/config/isl.json")

            # Set the environment variable for Google Cloud credentials
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path

            # Get project ID from the credentials file
            with open(credentials_path, 'r') as f:
                credentials_data = json.load(f)
                self.project_id = credentials_data.get("project_id")

            # Initialize Translation client
            self.translate_client = translate_v3.TranslationServiceClient()
            self.parent = f"projects/{self.project_id}/locations/global"

        except Exception as e:
            print(f"Error setting up GCP client: {e}")
            self.translate_client = None
            self.project_id = None
            self.parent = None

    def translate_text(self, text: str, target_language: str, source_language: str = "en") -> str:
        """Translate text using Google Cloud Translation API"""
        if not self.translate_client or not self.parent:
            raise Exception(
                "Google Cloud Translation client not properly initialized")

        try:
            response = self.translate_client.translate_text(
                contents=[text],
                parent=self.parent,
                mime_type="text/plain",
                source_language_code=source_language,
                target_language_code=target_language,
            )

            if response.translations:
                return response.translations[0].translated_text
            else:
                print(f"No translation returned for text: {text}")
                return text  # Return original text if no translation

        except Exception as e:
            print(f"Translation error: {e}")
            return text  # Return original text if translation fails

    def translate_announcement(self, english_text: str) -> Dict[str, str]:
        """Translate English announcement to Hindi, Marathi, and Gujarati"""
        translations = {}
        
        try:
            # Translate to Hindi
            translations['hindi'] = self.translate_text(
                english_text, target_language="hi", source_language="en"
            )
            
            # Translate to Marathi
            translations['marathi'] = self.translate_text(
                english_text, target_language="mr", source_language="en"
            )
            
            # Translate to Gujarati
            translations['gujarati'] = self.translate_text(
                english_text, target_language="gu", source_language="en"
            )
            
            return translations
            
        except Exception as e:
            print(f"Translation error: {e}")
            # Return original text for all languages if translation fails
            return {
                'hindi': english_text,
                'marathi': english_text,
                'gujarati': english_text
            }

    def create_general_announcement(self, announcement_data: GeneralAnnouncementCreate, created_by: int) -> GeneralAnnouncement:
        """Create a new general announcement"""
        # First create the announcement without the video path
        db_announcement = GeneralAnnouncement(
            title=announcement_data.title,
            category=announcement_data.category,
            english_content=announcement_data.english_content,
            hindi_content=announcement_data.hindi_content,
            marathi_content=announcement_data.marathi_content,
            gujarati_content=announcement_data.gujarati_content,
            ai_model_type=announcement_data.ai_model_type,
            isl_video_path=None,  # Will be updated after video is saved
            audio_path=announcement_data.audio_path,
            is_translated=bool(announcement_data.hindi_content or announcement_data.marathi_content or announcement_data.gujarati_content),
            created_by_id=created_by
        )
        
        self.db.add(db_announcement)
        self.db.commit()
        self.db.refresh(db_announcement)
        
        # If there's a temporary video URL, save it to permanent location
        if announcement_data.isl_video_path:
            permanent_video_path = self.save_isl_video_to_permanent_location(
                announcement_data.isl_video_path, 
                db_announcement.id
            )
            
            if permanent_video_path:
                # Update the announcement with the permanent video path
                db_announcement.isl_video_path = permanent_video_path
                self.db.commit()
                self.db.refresh(db_announcement)
                print(f"Updated announcement {db_announcement.id} with permanent video path: {permanent_video_path}")
                
                # Clean up temporary video file
                self.cleanup_temp_video(announcement_data.isl_video_path)
            else:
                print(f"Failed to save video for announcement {db_announcement.id}")
        
        return db_announcement

    def save_isl_video_to_permanent_location(self, temp_video_url: str, announcement_id: int) -> Optional[str]:
        """
        Save ISL video from temporary location to permanent location in public/videos/isl-general-announcements
        Returns the permanent video path or None if failed
        """
        try:
            # Extract video ID from the preview URL
            # URL format: /api/v1/isl-video-generation/preview/{video_id}
            if '/preview/' not in temp_video_url:
                print(f"Invalid temp video URL format: {temp_video_url}")
                return None
            
            video_id = temp_video_url.split('/preview/')[-1]
            
            # Define paths
            project_root = Path(__file__).parent.parent.parent.parent
            temp_video_path = project_root / "backend" / "temp" / "isl-videos" / f"{video_id}.mp4"
            permanent_dir = project_root / "frontend" / "public" / "videos" / "isl-general-announcements"
            
            # Ensure permanent directory exists
            permanent_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate permanent filename
            permanent_filename = f"announcement_{announcement_id}_{video_id}.mp4"
            permanent_video_path = permanent_dir / permanent_filename
            
            # Check if temp video exists
            if not temp_video_path.exists():
                print(f"Temp video file not found: {temp_video_path}")
                return None
            
            # Copy video to permanent location
            shutil.copy2(temp_video_path, permanent_video_path)
            
            # Return the public URL path
            permanent_url = f"/videos/isl-general-announcements/{permanent_filename}"
            print(f"Video saved to permanent location: {permanent_url}")
            
            return permanent_url
            
        except Exception as e:
            print(f"Error saving ISL video to permanent location: {e}")
            return None

    def cleanup_temp_video(self, temp_video_url: str) -> bool:
        """
        Clean up temporary video file after it's been saved to permanent location
        Returns True if cleanup was successful, False otherwise
        """
        try:
            # Extract video ID from the preview URL
            if '/preview/' not in temp_video_url:
                return False
            
            video_id = temp_video_url.split('/preview/')[-1]
            
            # Define temp video path
            project_root = Path(__file__).parent.parent.parent.parent
            temp_video_path = project_root / "backend" / "temp" / "isl-videos" / f"{video_id}.mp4"
            
            # Remove temp video file
            if temp_video_path.exists():
                temp_video_path.unlink()
                print(f"Cleaned up temp video: {temp_video_path}")
                return True
            else:
                print(f"Temp video file not found for cleanup: {temp_video_path}")
                return False
                
        except Exception as e:
            print(f"Error cleaning up temp video: {e}")
            return False

    def delete_isl_video_file(self, video_path: str) -> bool:
        """
        Delete ISL video file from permanent location
        Returns True if deletion was successful, False otherwise
        """
        try:
            # Handle both relative and absolute paths
            if video_path.startswith('/') and not video_path.startswith('/videos/'):
                # Absolute path
                video_file_path = Path(video_path)
            else:
                # Relative path from public directory (remove leading slash if present)
                project_root = Path(__file__).parent.parent.parent.parent
                clean_path = video_path.lstrip('/')
                video_file_path = project_root / "frontend" / "public" / clean_path
            
            print(f"Looking for video file at: {video_file_path}")
            
            # Check if file exists and delete it
            if video_file_path.exists():
                video_file_path.unlink()
                print(f"Deleted ISL video file: {video_file_path}")
                return True
            else:
                print(f"ISL video file not found for deletion: {video_file_path}")
                return False
                
        except Exception as e:
            print(f"Error deleting ISL video file: {e}")
            return False

    def get_general_announcement(self, announcement_id: int) -> Optional[GeneralAnnouncement]:
        """Get a general announcement by ID"""
        return self.db.query(GeneralAnnouncement).filter(
            GeneralAnnouncement.id == announcement_id
        ).first()

    def get_general_announcements(
        self, 
        skip: int = 0, 
        limit: int = 100,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
        created_by: Optional[int] = None
    ) -> list[GeneralAnnouncement]:
        """Get general announcements with optional filtering"""
        query = self.db.query(GeneralAnnouncement)
        
        if category:
            query = query.filter(GeneralAnnouncement.category == category)
        if is_active is not None:
            query = query.filter(GeneralAnnouncement.is_active == is_active)
        if created_by:
            query = query.filter(GeneralAnnouncement.created_by == created_by)
            
        return query.offset(skip).limit(limit).all()

    def update_general_announcement(
        self, 
        announcement_id: int, 
        announcement_update: GeneralAnnouncementUpdate
    ) -> Optional[GeneralAnnouncement]:
        """Update a general announcement"""
        db_announcement = self.get_general_announcement(announcement_id)
        if not db_announcement:
            return None

        update_data = announcement_update.dict(exclude_unset=True)
        
        # Update is_translated flag if any translation fields are updated
        if any(field in update_data for field in ['hindi_content', 'marathi_content', 'gujarati_content']):
            update_data['is_translated'] = bool(
                update_data.get('hindi_content') or 
                update_data.get('marathi_content') or 
                update_data.get('gujarati_content')
            )

        for field, value in update_data.items():
            setattr(db_announcement, field, value)

        self.db.commit()
        self.db.refresh(db_announcement)
        return db_announcement

    def delete_general_announcement(self, announcement_id: int) -> bool:
        """Delete a general announcement and its associated ISL video file"""
        db_announcement = self.get_general_announcement(announcement_id)
        if not db_announcement:
            return False

        # Delete the associated ISL video file if it exists
        if db_announcement.isl_video_path:
            self.delete_isl_video_file(db_announcement.isl_video_path)

        # Delete the announcement from database
        self.db.delete(db_announcement)
        self.db.commit()
        return True

    def search_general_announcements(self, search_query: str, skip: int = 0, limit: int = 100) -> list[GeneralAnnouncement]:
        """Search general announcements by title or content"""
        query = self.db.query(GeneralAnnouncement).filter(
            GeneralAnnouncement.is_active == True
        ).filter(
            (GeneralAnnouncement.title.ilike(f"%{search_query}%")) |
            (GeneralAnnouncement.english_content.ilike(f"%{search_query}%")) |
            (GeneralAnnouncement.category.ilike(f"%{search_query}%"))
        )
        
        return query.offset(skip).limit(limit).all()


def get_general_announcement_service(db: Session) -> GeneralAnnouncementService:
    """Get an instance of GeneralAnnouncementService"""
    return GeneralAnnouncementService(db)