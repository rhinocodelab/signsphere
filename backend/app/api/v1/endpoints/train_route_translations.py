from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.deps import get_db
from app.services.train_route_translation import get_train_route_translation_service, TrainRouteTranslationService
from app.models.train_route_translation import TrainRouteTranslation as TrainRouteTranslationModel
from app.schemas.train_route_translation import (
    TrainRouteTranslation,
    TrainRouteTranslationCreate,
    TrainRouteTranslationUpdate,
    TranslationRequest,
    TranslationResponse
)

router = APIRouter()


@router.post("/translate", response_model=TranslationResponse)
def translate_train_route(
    translation_request: TranslationRequest,
    db: Session = Depends(get_db)
):
    """
    Translate train route information from English to Hindi, Marathi, and Gujarati
    using Google Cloud Translate API.
    """
    translation_service = get_train_route_translation_service(db)

    try:
        # Perform translation
        translation_response = translation_service.translate_train_route(
            translation_request)
        return translation_response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}"
        )


@router.post("/translate-and-save", response_model=TrainRouteTranslation)
def translate_and_save_train_route(
    translation_request: TranslationRequest,
    db: Session = Depends(get_db)
):
    """
    Translate train route information and save it to the database.
    """
    translation_service = get_train_route_translation_service(db)

    try:
        # Check if translation already exists for this train route
        existing_translation = translation_service.get_train_route_translation_by_route_id(
            translation_request.train_route_id
        )

        if existing_translation:
            raise HTTPException(
                status_code=400,
                detail=f"Translation already exists for train route ID {translation_request.train_route_id}"
            )

        # Perform translation
        translation_response = translation_service.translate_train_route(
            translation_request)

        # Create translation record
        translation_data = TrainRouteTranslationCreate(
            train_route_id=translation_response.train_route_id,
            train_name_en=translation_response.train_name_en,
            from_station_en=translation_response.from_station_en,
            to_station_en=translation_response.to_station_en,
            train_name_hi=translation_response.train_name_hi,
            from_station_hi=translation_response.from_station_hi,
            to_station_hi=translation_response.to_station_hi,
            train_name_mr=translation_response.train_name_mr,
            from_station_mr=translation_response.from_station_mr,
            to_station_mr=translation_response.to_station_mr,
            train_name_gu=translation_response.train_name_gu,
            from_station_gu=translation_response.from_station_gu,
            to_station_gu=translation_response.to_station_gu
        )

        # Save to database
        saved_translation = translation_service.create_train_route_translation(
            translation_data)
        return saved_translation

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Translation and save failed: {str(e)}"
        )


@router.post("/", response_model=TrainRouteTranslation)
def create_train_route_translation(
    translation: TrainRouteTranslationCreate,
    db: Session = Depends(get_db)
):
    """Create a new train route translation record"""
    translation_service = get_train_route_translation_service(db)

    # Check if translation already exists for this train route
    existing_translation = translation_service.get_train_route_translation_by_route_id(
        translation.train_route_id
    )
    if existing_translation:
        raise HTTPException(
            status_code=400,
            detail=f"Translation already exists for train route ID {translation.train_route_id}"
        )

    return translation_service.create_train_route_translation(translation)


@router.get("/", response_model=List[TrainRouteTranslation])
def get_train_route_translations(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000,
                       description="Number of records to return"),
    db: Session = Depends(get_db)
):
    """Get all train route translations with pagination"""
    from app.models.train_route import TrainRoute
    translation_service = get_train_route_translation_service(db)

    # Query translations with train route data
    results = db.query(
        TrainRouteTranslationModel,
        TrainRoute.train_number
    ).join(
        TrainRoute, TrainRouteTranslationModel.train_route_id == TrainRoute.id
    ).offset(skip).limit(limit).all()

    # Convert to response format
    translations = []
    for translation, train_number in results:
        translation_dict = {
            "id": translation.id,
            "train_route_id": translation.train_route_id,
            "train_number": train_number,
            "train_name_en": translation.train_name_en,
            "from_station_en": translation.from_station_en,
            "to_station_en": translation.to_station_en,
            "train_name_hi": translation.train_name_hi,
            "from_station_hi": translation.from_station_hi,
            "to_station_hi": translation.to_station_hi,
            "train_name_mr": translation.train_name_mr,
            "from_station_mr": translation.from_station_mr,
            "to_station_mr": translation.to_station_mr,
            "train_name_gu": translation.train_name_gu,
            "from_station_gu": translation.from_station_gu,
            "to_station_gu": translation.to_station_gu,
            "created_at": translation.created_at,
            "updated_at": translation.updated_at
        }
        translations.append(translation_dict)

    return translations


@router.get("/{translation_id}", response_model=TrainRouteTranslation)
def get_train_route_translation(
    translation_id: int,
    db: Session = Depends(get_db)
):
    """Get a train route translation by ID"""
    translation_service = get_train_route_translation_service(db)
    translation = translation_service.get_train_route_translation(
        translation_id)
    if not translation:
        raise HTTPException(
            status_code=404, detail="Train route translation not found")
    return translation


@router.get("/route/{train_route_id}", response_model=TrainRouteTranslation)
def get_train_route_translation_by_route_id(
    train_route_id: int,
    db: Session = Depends(get_db)
):
    """Get a train route translation by train route ID"""
    translation_service = get_train_route_translation_service(db)
    translation = translation_service.get_train_route_translation_by_route_id(
        train_route_id)
    if not translation:
        raise HTTPException(
            status_code=404, detail="Train route translation not found")
    return translation


@router.put("/{translation_id}", response_model=TrainRouteTranslation)
def update_train_route_translation(
    translation_id: int,
    translation_update: TrainRouteTranslationUpdate,
    db: Session = Depends(get_db)
):
    """Update a train route translation"""
    translation_service = get_train_route_translation_service(db)
    updated_translation = translation_service.update_train_route_translation(
        translation_id, translation_update)
    if not updated_translation:
        raise HTTPException(
            status_code=404, detail="Train route translation not found")
    return updated_translation


@router.delete("/{translation_id}")
def delete_train_route_translation(
    translation_id: int,
    db: Session = Depends(get_db)
):
    """Delete a train route translation"""
    translation_service = get_train_route_translation_service(db)
    success = translation_service.delete_train_route_translation(
        translation_id)
    if not success:
        raise HTTPException(
            status_code=404, detail="Train route translation not found")
    return {"message": "Train route translation deleted successfully"}


@router.delete("/clear-all")
def clear_all_train_route_translations(
    db: Session = Depends(get_db)
):
    """Clear all train route translations and reset is_translated flags"""
    translation_service = get_train_route_translation_service(db)

    try:
        # Delete all translations
        deleted_count = translation_service.clear_all_translations()

        # Reset is_translated flags for all train routes
        reset_count = translation_service.reset_translation_flags()

        return {
            "message": f"Successfully cleared {deleted_count} translations and reset {reset_count} train route flags"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear translations: {str(e)}"
        )
