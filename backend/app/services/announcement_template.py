import os
import json
import re
from typing import Optional, Dict, List
from sqlalchemy.orm import Session
from google.cloud import translate_v3
from app.models.announcement_template import AnnouncementTemplate
from app.schemas.announcement_template import AnnouncementTemplateCreate, AnnouncementTemplateUpdate


class AnnouncementTemplateService:
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
        """Translate text using Google Cloud Translate"""
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
                return text

        except Exception as e:
            print(f"Translation error: {e}")
            return text

    def _protect_placeholders(self, text: str) -> tuple[str, Dict[str, str]]:
        """Replace placeholders with protected tokens"""
        placeholder_map = {}
        protected_text = text

        # Find all placeholders in the text
        placeholder_pattern = r'\{[^}]+\}'
        placeholders = re.findall(placeholder_pattern, text)

        # Replace each placeholder with a unique token
        for i, placeholder in enumerate(placeholders):
            token = f"PLACEHOLDER_{i+1}"
            placeholder_map[token] = placeholder
            protected_text = protected_text.replace(placeholder, token)

        return protected_text, placeholder_map

    def _restore_placeholders(self, translated_text: str, placeholder_map: Dict[str, str]) -> str:
        """Restore original placeholders in translated text"""
        restored_text = translated_text

        for token, original_placeholder in placeholder_map.items():
            restored_text = restored_text.replace(token, original_placeholder)

        return restored_text

    def extract_placeholders(self, template: str) -> List[str]:
        """Extract all placeholders from template text"""
        placeholder_pattern = r'\{[^}]+\}'
        return re.findall(placeholder_pattern, template)

    def validate_placeholders(self, template: str) -> bool:
        """Validate that all placeholders are properly formatted"""
        placeholder_pattern = r'\{[^}]+\}'
        placeholders = re.findall(placeholder_pattern, template)

        # Check for common issues
        for placeholder in placeholders:
            if not placeholder.startswith('{') or not placeholder.endswith('}'):
                return False
            if len(placeholder) < 3:  # At least {x}
                return False

        return True

    def translate_announcement_template(self, english_template: str) -> Dict[str, str]:
        """Translate announcement template while preserving placeholders"""

        # Step 1: Extract and protect placeholders
        protected_text, placeholder_map = self._protect_placeholders(
            english_template)

        # Step 2: Translate protected text
        translations = {}
        target_languages = ['hi', 'mr', 'gu']

        for lang in target_languages:
            translated_text = self.translate_text(protected_text, lang, "en")
            # Step 3: Restore placeholders in translated text
            final_translation = self._restore_placeholders(
                translated_text, placeholder_map)
            translations[lang] = final_translation

        return translations

    def create_announcement_template(self, template_data: AnnouncementTemplateCreate) -> AnnouncementTemplate:
        """Create a new announcement template"""
        db_template = AnnouncementTemplate(**template_data.dict())
        self.db.add(db_template)
        self.db.commit()
        self.db.refresh(db_template)
        return db_template

    def get_announcement_template(self, template_id: int) -> Optional[AnnouncementTemplate]:
        """Get an announcement template by ID"""
        return self.db.query(AnnouncementTemplate).filter(AnnouncementTemplate.id == template_id).first()

    def get_announcement_templates(self, skip: int = 0, limit: int = 100) -> List[AnnouncementTemplate]:
        """Get all announcement templates with pagination"""
        return self.db.query(AnnouncementTemplate).offset(skip).limit(limit).all()

    def get_templates_by_category(self, category: str) -> List[AnnouncementTemplate]:
        """Get announcement templates by category"""
        return self.db.query(AnnouncementTemplate).filter(AnnouncementTemplate.category == category).all()

    def update_announcement_template(self, template_id: int, template_update: AnnouncementTemplateUpdate) -> Optional[AnnouncementTemplate]:
        """Update an announcement template"""
        db_template = self.get_announcement_template(template_id)
        if db_template:
            update_data = template_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_template, field, value)
            self.db.commit()
            self.db.refresh(db_template)
        return db_template

    def delete_announcement_template(self, template_id: int) -> bool:
        """Delete an announcement template"""
        db_template = self.get_announcement_template(template_id)
        if db_template:
            self.db.delete(db_template)
            self.db.commit()
            return True
        return False

    def clear_all_templates(self) -> int:
        """Clear all announcement templates from the database"""
        count = self.db.query(AnnouncementTemplate).count()
        self.db.query(AnnouncementTemplate).delete()
        self.db.commit()
        return count

    def get_unique_categories(self) -> List[str]:
        """Get all unique announcement categories"""
        categories = self.db.query(
            AnnouncementTemplate.category).distinct().all()
        return [category[0] for category in categories]


def get_announcement_template_service(db: Session) -> AnnouncementTemplateService:
    """Dependency to get announcement template service"""
    return AnnouncementTemplateService(db)
