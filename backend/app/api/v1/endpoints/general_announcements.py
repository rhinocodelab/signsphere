from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.deps import get_db
from app.services.general_announcement import get_general_announcement_service, GeneralAnnouncementService
from app.models.general_announcement import GeneralAnnouncement
from app.schemas.general_announcement import (
    GeneralAnnouncement as GeneralAnnouncementSchema,
    GeneralAnnouncementCreate,
    GeneralAnnouncementUpdate,
    GeneralAnnouncementWithCreator,
    GeneralAnnouncementTranslationRequest
)
from app.services.user import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/translate", response_model=dict)
def translate_announcement(
    request: GeneralAnnouncementTranslationRequest,
    db: Session = Depends(get_db)
):
    """
    Translate English announcement text to Hindi, Marathi, and Gujarati
    """
    english_text = request.english_text
    
    if not english_text or not english_text.strip():
        raise HTTPException(
            status_code=400,
            detail="English text cannot be empty"
        )
    
    if len(english_text.strip()) > 10000:  # GCP limit
        raise HTTPException(
            status_code=400,
            detail="Text too long. Maximum 10,000 characters allowed."
        )

    translation_service = get_general_announcement_service(db)

    try:
        # Perform translation
        translations = translation_service.translate_announcement(english_text)
        
        return {
            "success": True,
            "original_text": english_text,
            "translations": {
                "hindi": translations['hindi'],
                "marathi": translations['marathi'],
                "gujarati": translations['gujarati']
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}"
        )


@router.post("/", response_model=GeneralAnnouncementSchema)
def create_general_announcement(
    announcement: GeneralAnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new general announcement
    """
    announcement_service = get_general_announcement_service(db)

    try:
        created_announcement = announcement_service.create_general_announcement(
            announcement, current_user.id
        )
        return created_announcement
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create announcement: {str(e)}"
        )


@router.get("/", response_model=List[GeneralAnnouncementWithCreator])
def get_general_announcements(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    category: Optional[str] = Query(None, description="Filter by category"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search in title, content, or category"),
    db: Session = Depends(get_db)
):
    """
    Get general announcements with optional filtering and search
    """
    announcement_service = get_general_announcement_service(db)

    try:
        if search:
            announcements = announcement_service.search_general_announcements(
                search, skip, limit
            )
        else:
            announcements = announcement_service.get_general_announcements(
                skip, limit, category, is_active
            )
        
        # Add creator information
        result = []
        for announcement in announcements:
            creator = db.query(User).filter(User.id == announcement.created_by_id).first()
            announcement_dict = announcement.__dict__.copy()
            announcement_dict['creator_username'] = creator.username if creator else None
            announcement_dict['creator_full_name'] = creator.full_name if creator else None
            result.append(announcement_dict)
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch announcements: {str(e)}"
        )


@router.get("/{announcement_id}", response_model=GeneralAnnouncementWithCreator)
def get_general_announcement(
    announcement_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific general announcement by ID
    """
    announcement_service = get_general_announcement_service(db)

    announcement = announcement_service.get_general_announcement(announcement_id)
    if not announcement:
        raise HTTPException(
            status_code=404,
            detail="Announcement not found"
        )
    
    # Add creator information
    creator = db.query(User).filter(User.id == announcement.created_by_id).first()
    announcement_dict = announcement.__dict__.copy()
    announcement_dict['creator_username'] = creator.username if creator else None
    announcement_dict['creator_full_name'] = creator.full_name if creator else None
    
    return announcement_dict


@router.put("/{announcement_id}", response_model=GeneralAnnouncementSchema)
def update_general_announcement(
    announcement_id: int,
    announcement_update: GeneralAnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a general announcement
    """
    announcement_service = get_general_announcement_service(db)

    # Check if announcement exists
    existing_announcement = announcement_service.get_general_announcement(announcement_id)
    if not existing_announcement:
        raise HTTPException(
            status_code=404,
            detail="Announcement not found"
        )

    # Check if user has permission to update (creator or admin)
    if existing_announcement.created_by != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to update this announcement"
        )

    try:
        updated_announcement = announcement_service.update_general_announcement(
            announcement_id, announcement_update
        )
        return updated_announcement
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update announcement: {str(e)}"
        )


@router.delete("/{announcement_id}")
def delete_general_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a general announcement
    """
    announcement_service = get_general_announcement_service(db)

    # Check if announcement exists
    existing_announcement = announcement_service.get_general_announcement(announcement_id)
    if not existing_announcement:
        raise HTTPException(
            status_code=404,
            detail="Announcement not found"
        )

    # Check if user has permission to delete (creator or admin)
    if existing_announcement.created_by_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to delete this announcement"
        )

    try:
        success = announcement_service.delete_general_announcement(announcement_id)
        if success:
            return {"message": "Announcement deleted successfully"}
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to delete announcement"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete announcement: {str(e)}"
        )


@router.get("/categories/list", response_model=List[str])
def get_announcement_categories():
    """
    Get list of available announcement categories
    """
    return [
        "Arrival",
        "Departure", 
        "Delay",
        "Platform Change",
        "Safety",
        "Weather",
        "General Information",
        "Emergency",
        "Maintenance",
        "Other"
    ]