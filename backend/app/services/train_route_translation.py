import os
import json
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from google.cloud import translate_v3
from app.models.train_route_translation import TrainRouteTranslation
from app.models.train_route import TrainRoute
from app.schemas.train_route_translation import TrainRouteTranslationCreate, TrainRouteTranslationUpdate, TranslationRequest, TranslationResponse


class TrainRouteTranslationService:
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
                return text  # Return original text if no translation

        except Exception as e:
            print(f"Translation error: {e}")
            return text  # Return original text if translation fails

    def translate_train_route(self, translation_request: TranslationRequest) -> TranslationResponse:
        """Translate train route information to Hindi, Marathi, and Gujarati"""

        # Get source language code from request
        source_language = translation_request.source_language_code

        # For English, use the same text
        train_name_en = translation_request.train_name_en
        from_station_en = translation_request.from_station_en
        to_station_en = translation_request.to_station_en

        # Translate to Hindi
        train_name_hi = self.translate_text(
            train_name_en, "hi", source_language)
        from_station_hi = self.translate_text(
            from_station_en, "hi", source_language)
        to_station_hi = self.translate_text(
            to_station_en, "hi", source_language)

        # Translate to Marathi
        train_name_mr = self.translate_text(
            train_name_en, "mr", source_language)
        from_station_mr = self.translate_text(
            from_station_en, "mr", source_language)
        to_station_mr = self.translate_text(
            to_station_en, "mr", source_language)

        # Translate to Gujarati
        train_name_gu = self.translate_text(
            train_name_en, "gu", source_language)
        from_station_gu = self.translate_text(
            from_station_en, "gu", source_language)
        to_station_gu = self.translate_text(
            to_station_en, "gu", source_language)

        return TranslationResponse(
            train_route_id=translation_request.train_route_id,
            train_name_en=train_name_en,
            from_station_en=from_station_en,
            to_station_en=to_station_en,
            train_name_hi=train_name_hi,
            from_station_hi=from_station_hi,
            to_station_hi=to_station_hi,
            train_name_mr=train_name_mr,
            from_station_mr=from_station_mr,
            to_station_mr=to_station_mr,
            train_name_gu=train_name_gu,
            from_station_gu=from_station_gu,
            to_station_gu=to_station_gu
        )

    def create_train_route_translation(self, translation_data: TrainRouteTranslationCreate) -> TrainRouteTranslation:
        """Create a new train route translation record"""
        db_translation = TrainRouteTranslation(**translation_data.dict())
        self.db.add(db_translation)

        # Update the train route's is_translated flag to True
        train_route = self.db.query(TrainRoute).filter(
            TrainRoute.id == translation_data.train_route_id).first()
        if train_route:
            train_route.is_translated = True

        self.db.commit()
        self.db.refresh(db_translation)
        return db_translation

    def get_train_route_translation(self, translation_id: int) -> Optional[TrainRouteTranslation]:
        """Get a train route translation by ID"""
        return self.db.query(TrainRouteTranslation).filter(TrainRouteTranslation.id == translation_id).first()

    def get_train_route_translation_by_route_id(self, train_route_id: int) -> Optional[TrainRouteTranslation]:
        """Get a train route translation by train route ID"""
        return self.db.query(TrainRouteTranslation).filter(TrainRouteTranslation.train_route_id == train_route_id).first()

    def update_train_route_translation(self, translation_id: int, translation_update: TrainRouteTranslationUpdate) -> Optional[TrainRouteTranslation]:
        """Update a train route translation"""
        db_translation = self.get_train_route_translation(translation_id)
        if not db_translation:
            return None

        update_data = translation_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_translation, field, value)

        self.db.commit()
        self.db.refresh(db_translation)
        return db_translation

    def delete_train_route_translation(self, translation_id: int) -> bool:
        """Delete a train route translation"""
        db_translation = self.get_train_route_translation(translation_id)
        if not db_translation:
            return False

        # Update the train route's is_translated flag to False
        train_route = self.db.query(TrainRoute).filter(
            TrainRoute.id == db_translation.train_route_id).first()
        if train_route:
            train_route.is_translated = False

        self.db.delete(db_translation)
        self.db.commit()
        return True

    def clear_all_translations(self) -> int:
        """Clear all train route translations"""
        # Count translations before deletion
        count = self.db.query(TrainRouteTranslation).count()

        # Delete all translations
        self.db.query(TrainRouteTranslation).delete()
        self.db.commit()

        return count

    def reset_translation_flags(self) -> int:
        """Reset is_translated flag to False for all train routes"""
        # Count train routes before update
        count = self.db.query(TrainRoute).count()

        # Reset all is_translated flags to False
        self.db.query(TrainRoute).update({TrainRoute.is_translated: False})
        self.db.commit()

        return count


def get_train_route_translation_service(db: Session) -> TrainRouteTranslationService:
    """Dependency to get train route translation service"""
    return TrainRouteTranslationService(db)
