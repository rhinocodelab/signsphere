from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import io
from app.db.deps import get_db
from app.services.train_route import get_train_route_service, TrainRouteService
from app.schemas.train_route import TrainRoute, TrainRouteCreate, TrainRouteUpdate

router = APIRouter()


@router.post("/", response_model=TrainRoute)
def create_train_route(
    train_route: TrainRouteCreate,
    db: Session = Depends(get_db)
):
    """Create a new train route and automatically generate translations"""
    train_route_service = get_train_route_service(db)

    # Check if train route already exists
    existing_route = train_route_service.get_train_route_by_number(
        train_route.train_number)
    if existing_route:
        raise HTTPException(
            status_code=400,
            detail=f"Train route with number {train_route.train_number} already exists"
        )

    # Create the train route
    created_route = train_route_service.create_train_route(train_route)

    # Automatically generate translations
    try:
        from app.services.train_route_translation import get_train_route_translation_service
        from app.schemas.train_route_translation import TranslationRequest

        translation_service = get_train_route_translation_service(db)

        # Create translation request
        translation_request = TranslationRequest(
            train_route_id=created_route.id,
            train_name_en=created_route.train_name,
            from_station_en=created_route.from_station,
            to_station_en=created_route.to_station,
            source_language_code="en"
        )

        # Generate and save translations
        translation_response = translation_service.translate_train_route(
            translation_request)

        # Create translation record
        from app.schemas.train_route_translation import TrainRouteTranslationCreate
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

        # Save translation to database
        translation_service.create_train_route_translation(translation_data)

    except Exception as e:
        # If translation fails, log the error but don't fail the route creation
        print(f"Auto-translation failed for route {created_route.id}: {e}")
        # The route is still created successfully, just without translations

    return created_route


@router.get("/", response_model=List[TrainRoute])
def get_train_routes(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000,
                       description="Number of records to return"),
    db: Session = Depends(get_db)
):
    """Get all train routes with pagination"""
    train_route_service = get_train_route_service(db)
    return train_route_service.get_train_routes(skip=skip, limit=limit)


@router.get("/search", response_model=List[TrainRoute])
def search_train_routes(
    q: str = Query(..., min_length=1,
                   description="Search query for train number or name"),
    db: Session = Depends(get_db)
):
    """Search train routes by train number or name"""
    train_route_service = get_train_route_service(db)
    return train_route_service.search_train_routes(q)


@router.get("/{train_route_id}", response_model=TrainRoute)
def get_train_route(
    train_route_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific train route by ID"""
    train_route_service = get_train_route_service(db)
    train_route = train_route_service.get_train_route(train_route_id)
    if not train_route:
        raise HTTPException(status_code=404, detail="Train route not found")
    return train_route


@router.get("/by-number/{train_number}", response_model=TrainRoute)
def get_train_route_by_number(
    train_number: str,
    db: Session = Depends(get_db)
):
    """Get a specific train route by train number"""
    train_route_service = get_train_route_service(db)
    train_route = train_route_service.get_train_route_by_number(train_number)
    if not train_route:
        raise HTTPException(status_code=404, detail="Train route not found")
    return train_route


@router.put("/{train_route_id}", response_model=TrainRoute)
def update_train_route(
    train_route_id: int,
    train_route_update: TrainRouteUpdate,
    db: Session = Depends(get_db)
):
    """Update a train route and re-translate if translatable fields changed"""
    train_route_service = get_train_route_service(db)

    # Get the current route to compare changes
    current_route = train_route_service.get_train_route(train_route_id)
    if not current_route:
        raise HTTPException(status_code=404, detail="Train route not found")

    # Check if any translatable fields are being updated
    update_data = train_route_update.dict(exclude_unset=True)
    translatable_fields = ['train_name', 'from_station', 'to_station']
    needs_retranslation = any(
        field in update_data for field in translatable_fields)

    # Update the train route
    updated_route = train_route_service.update_train_route(
        train_route_id, train_route_update)
    if not updated_route:
        raise HTTPException(status_code=404, detail="Train route not found")

    # Re-translate if translatable fields changed
    if needs_retranslation:
        try:
            from app.services.train_route_translation import get_train_route_translation_service
            from app.schemas.train_route_translation import TranslationRequest, TrainRouteTranslationCreate

            translation_service = get_train_route_translation_service(db)

            # Delete existing translation if it exists
            existing_translation = translation_service.get_train_route_translation_by_route_id(
                train_route_id)
            if existing_translation:
                translation_service.delete_train_route_translation(
                    existing_translation.id)

            # Create new translation request with updated data
            translation_request = TranslationRequest(
                train_route_id=updated_route.id,
                train_name_en=updated_route.train_name,
                from_station_en=updated_route.from_station,
                to_station_en=updated_route.to_station,
                source_language_code="en"
            )

            # Generate and save new translations
            translation_response = translation_service.translate_train_route(
                translation_request)

            # Create new translation record
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

            # Save new translation to database
            translation_service.create_train_route_translation(
                translation_data)

        except Exception as e:
            # If re-translation fails, log the error but don't fail the update
            print(f"Re-translation failed for route {train_route_id}: {e}")
            # The route is still updated successfully, just without new translations

    return updated_route


@router.delete("/{train_route_id}")
def delete_train_route(
    train_route_id: int,
    db: Session = Depends(get_db)
):
    """Delete a train route"""
    train_route_service = get_train_route_service(db)
    success = train_route_service.delete_train_route(train_route_id)
    if not success:
        raise HTTPException(status_code=404, detail="Train route not found")
    return {"message": "Train route deleted successfully"}


@router.delete("/")
def clear_all_train_routes(
    db: Session = Depends(get_db)
):
    """Clear all train routes from the database"""
    train_route_service = get_train_route_service(db)
    deleted_count = train_route_service.clear_all_train_routes()
    return {"message": f"Successfully cleared {deleted_count} train routes"}


@router.post("/import")
def import_train_routes(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import train routes from Excel file, skip existing routes, and auto-translate"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, detail="File must be an Excel file (.xlsx or .xls)")

    try:
        # Read the Excel file
        contents = file.file.read()
        df = pd.read_excel(io.BytesIO(contents))

        # Validate required columns
        required_columns = ['Train Number', 'Train Name', 'From Station Code',
                            'From Station', 'To Station Code', 'To Station']
        missing_columns = [
            col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )

        train_route_service = get_train_route_service(db)
        imported_count = 0
        skipped_count = 0
        total_count = len(df)

        # Process each row
        for index, row in df.iterrows():
            train_number = str(row['Train Number']).strip()
            train_name = str(row['Train Name']).strip()
            from_station_code = str(row['From Station Code']).strip()
            from_station = str(row['From Station']).strip()
            to_station_code = str(row['To Station Code']).strip()
            to_station = str(row['To Station']).strip()

            # Skip if any required field is empty
            if not all([train_number, train_name, from_station_code, from_station, to_station_code, to_station]):
                continue

            # Check if route already exists
            existing_route = train_route_service.get_train_route_by_number(
                train_number)
            if existing_route:
                skipped_count += 1
                continue

            # Create new route
            try:
                route_data = TrainRouteCreate(
                    train_number=train_number,
                    train_name=train_name,
                    from_station_code=from_station_code,
                    from_station=from_station,
                    to_station_code=to_station_code,
                    to_station=to_station
                )

                # Create the route (this will automatically generate translations)
                created_route = train_route_service.create_train_route(
                    route_data)

                # Generate translations
                try:
                    from app.services.train_route_translation import get_train_route_translation_service
                    from app.schemas.train_route_translation import TranslationRequest, TrainRouteTranslationCreate

                    translation_service = get_train_route_translation_service(
                        db)
                    translation_request = TranslationRequest(
                        train_route_id=created_route.id,
                        train_name_en=created_route.train_name,
                        from_station_en=created_route.from_station,
                        to_station_en=created_route.to_station,
                        source_language_code="en"
                    )

                    translation_response = translation_service.translate_train_route(
                        translation_request)
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

                    translation_service.create_train_route_translation(
                        translation_data)
                    imported_count += 1

                except Exception as e:
                    print(f"Translation failed for route {train_number}: {e}")
                    # Route is still created, just without translations
                    imported_count += 1

            except Exception as e:
                print(f"Failed to create route {train_number}: {e}")
                continue

        return {
            "message": f"Import completed successfully",
            "total_count": total_count,
            "imported_count": imported_count,
            "skipped_count": skipped_count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
