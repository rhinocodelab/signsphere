from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
import os
import tempfile
import google.generativeai as genai
from pathlib import Path

from app.db.deps import get_db
from app.core.config import settings

router = APIRouter()

# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

# Supported audio formats
SUPPORTED_AUDIO_FORMATS = {
    "audio/wav": ".wav",
    "audio/mp3": ".mp3", 
    "audio/aiff": ".aiff",
    "audio/aac": ".aac",
    "audio/ogg": ".ogg",
    "audio/flac": ".flac"
}

def detect_language_from_audio(audio_path: str) -> str:
    """Detect language from audio file using Google Gemini API"""
    audio_file = Path(audio_path)
    if not audio_file.exists():
        raise FileNotFoundError(f"Audio file {audio_path} not found.")
    
    # Prompt to ask for language detection
    user_prompt = "Detect the spoken language in this audio. Reply only with the language name."
    
    try:
        response = genai.generate_content(
            model="gemini-2.0-flash-exp",
            contents=[
                {"role": "user", "parts": [
                    # Include the audio
                    audio_file,
                    user_prompt
                ]}
            ]
        )
        
        # Response.text should contain the language name
        return response.text.strip()
    except Exception as e:
        raise Exception(f"Error detecting language: {str(e)}")

@router.post("/detect-language")
async def detect_language(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Detect language from uploaded audio file"""
    
    # Validate file type
    if file.content_type not in SUPPORTED_AUDIO_FORMATS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported audio format. Supported formats: {list(SUPPORTED_AUDIO_FORMATS.keys())}"
        )
    
    # Validate file size (max 10MB)
    file_size = 0
    content = await file.read()
    file_size = len(content)
    
    if file_size > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(
            status_code=400,
            detail="File size too large. Maximum size is 10MB."
        )
    
    # Create temporary file
    temp_file = None
    try:
        # Create temporary file with proper extension
        file_extension = SUPPORTED_AUDIO_FORMATS[file.content_type]
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Detect language
        detected_language = detect_language_from_audio(temp_file_path)
        
        return {
            "message": "Language detected successfully",
            "filename": file.filename,
            "file_size": file_size,
            "content_type": file.content_type,
            "detected_language": detected_language
        }
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Language detection failed: {str(e)}")
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

@router.get("/supported-formats")
def get_supported_formats():
    """Get list of supported audio formats"""
    return {
        "supported_formats": list(SUPPORTED_AUDIO_FORMATS.keys()),
        "max_file_size_mb": 10
    }