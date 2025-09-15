from fastapi import APIRouter, HTTPException
from google.cloud import translate_v3
from google.cloud.exceptions import GoogleCloudError
import logging
import os
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Supported source languages for Indian languages
SUPPORTED_SOURCE_LANGUAGES = {
    "gu-IN": "Gujarati (India)",
    "hi-IN": "Hindi (India)", 
    "mr-IN": "Marathi (India)",
    "en-IN": "English (India)"
}

# Target language is always English (India)
TARGET_LANGUAGE = "en-IN"

class TranslationRequest(BaseModel):
    text: str
    source_language_code: str
    target_language_code: str = TARGET_LANGUAGE

class TranslationResponse(BaseModel):
    success: bool
    original_text: str
    translated_text: str
    source_language_code: str
    target_language_code: str
    confidence: Optional[float] = None
    error: Optional[str] = None

def translate_text(
    text: str,
    source_language_code: str,
    target_language_code: str = TARGET_LANGUAGE
) -> dict:
    """Translate text from source language to target language using GCP Translate API.
    
    Args:
        text: The content to translate
        source_language_code: The code of the source language (e.g., "gu-IN", "hi-IN")
        target_language_code: The code of the target language (always "en-IN")
    
    Returns:
        dict: Translation result with original and translated text
    """
    try:
        logger.info(f"Starting translation: {source_language_code} -> {target_language_code}")
        logger.info(f"Text to translate: {text[:100]}{'...' if len(text) > 100 else ''}")
        
        # Initialize Translation client
        client = translate_v3.TranslationServiceClient()
        
        # Get project ID from environment, settings, or service account file
        project_id = os.environ.get("GOOGLE_CLOUD_PROJECT") or settings.GCP_PROJECT_ID
        
        if not project_id:
            # Try to extract project ID from service account credentials file
            credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
            if credentials_path and os.path.exists(credentials_path):
                try:
                    import json
                    with open(credentials_path, 'r') as f:
                        credentials_data = json.load(f)
                        project_id = credentials_data.get('project_id')
                        logger.info(f"Extracted project ID from credentials file: {project_id}")
                except Exception as e:
                    logger.warning(f"Failed to read credentials file: {e}")
            
            if not project_id:
                raise Exception("GOOGLE_CLOUD_PROJECT environment variable not set and could not extract from credentials file")
        
        parent = f"projects/{project_id}/locations/global"
        logger.info(f"Using GCP project: {project_id}")
        
        # MIME type of the content to translate
        mime_type = "text/plain"
        
        # Translate text from source to target language
        logger.info("Sending translation request to GCP Translate API...")
        response = client.translate_text(
            contents=[text],
            parent=parent,
            mime_type=mime_type,
            source_language_code=source_language_code,
            target_language_code=target_language_code,
        )
        
        logger.info(f"Translation response received: {len(response.translations)} translations")
        
        # Process the translation results
        if not response.translations:
            raise Exception("No translation results received from GCP API")
        
        translation = response.translations[0]
        translated_text = translation.translated_text
        
        logger.info(f"Translation completed successfully")
        logger.info(f"Original: {text[:50]}{'...' if len(text) > 50 else ''}")
        logger.info(f"Translated: {translated_text[:50]}{'...' if len(translated_text) > 50 else ''}")
        
        return {
            "success": True,
            "original_text": text,
            "translated_text": translated_text,
            "source_language_code": source_language_code,
            "target_language_code": target_language_code,
            "confidence": getattr(translation, 'confidence', None)
        }
        
    except GoogleCloudError as e:
        logger.error(f"GCP Translate API error: {e}")
        error_msg = str(e).lower()
        if "quota" in error_msg:
            raise Exception("Translation quota exceeded. Please try again later.")
        elif "permission" in error_msg or "auth" in error_msg:
            raise Exception("GCP authentication error. Please check your credentials.")
        elif "invalid" in error_msg:
            raise Exception("Invalid language code or text provided.")
        else:
            raise Exception(f"GCP Translate API error: {str(e)}")
    except Exception as e:
        logger.error(f"Translation error: {e}")
        raise Exception(f"Translation failed: {str(e)}")

@router.post("/translate", response_model=TranslationResponse)
async def translate_text_endpoint(request: TranslationRequest):
    """
    Translate text from source language to target language (always English)
    
    Args:
        request: TranslationRequest containing text, source_language_code, and target_language_code
    
    Returns:
        TranslationResponse with original and translated text
    """
    try:
        # Validate source language code
        if request.source_language_code not in SUPPORTED_SOURCE_LANGUAGES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported source language: {request.source_language_code}. Supported languages: {list(SUPPORTED_SOURCE_LANGUAGES.keys())}"
            )
        
        # Validate target language code (should always be en-IN)
        if request.target_language_code != TARGET_LANGUAGE:
            raise HTTPException(
                status_code=400,
                detail=f"Target language must be {TARGET_LANGUAGE}. Got: {request.target_language_code}"
            )
        
        # Validate text input
        if not request.text or not request.text.strip():
            raise HTTPException(
                status_code=400,
                detail="Text to translate cannot be empty"
            )
        
        if len(request.text.strip()) > 10000:  # GCP limit
            raise HTTPException(
                status_code=400,
                detail="Text too long. Maximum 10,000 characters allowed."
            )
        
        logger.info(f"Translation request: {request.source_language_code} -> {request.target_language_code}")
        logger.info(f"Text length: {len(request.text)} characters")
        
        # Perform translation
        result = translate_text(
            text=request.text,
            source_language_code=request.source_language_code,
            target_language_code=request.target_language_code
        )
        
        return TranslationResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Translation endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}"
        )

@router.get("/supported-languages")
async def get_supported_languages():
    """Get list of supported source languages for translation"""
    return {
        "supported_source_languages": SUPPORTED_SOURCE_LANGUAGES,
        "target_language": TARGET_LANGUAGE,
        "total_count": len(SUPPORTED_SOURCE_LANGUAGES),
        "description": "All translations are converted to English (India)"
    }

@router.get("/health")
async def health_check():
    """Health check endpoint for text translation service"""
    try:
        # Test GCP client initialization
        client = translate_v3.TranslationServiceClient()
        project_id = os.environ.get("GOOGLE_CLOUD_PROJECT") or settings.GCP_PROJECT_ID
        
        if not project_id:
            # Try to extract project ID from service account credentials file
            credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
            if credentials_path and os.path.exists(credentials_path):
                try:
                    import json
                    with open(credentials_path, 'r') as f:
                        credentials_data = json.load(f)
                        project_id = credentials_data.get('project_id')
                except Exception as e:
                    logger.warning(f"Failed to read credentials file: {e}")
            
            if not project_id:
                return {
                    "status": "error",
                    "message": "GOOGLE_CLOUD_PROJECT not configured and could not extract from credentials file"
                }
        
        return {
            "status": "healthy",
            "service": "text-translation",
            "gcp_project": project_id,
            "supported_languages": len(SUPPORTED_SOURCE_LANGUAGES)
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Service unhealthy: {str(e)}"
        }