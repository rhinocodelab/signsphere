from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import io
import json
from app.db.deps import get_db
from app.services.announcement_template import get_announcement_template_service, AnnouncementTemplateService
from app.schemas.announcement_template import (
    AnnouncementTemplate,
    AnnouncementTemplateCreate,
    AnnouncementTemplateUpdate,
    TranslationRequest,
    TranslationResponse
)

router = APIRouter()


@router.post("/", response_model=AnnouncementTemplate)
def create_announcement_template(
    template: AnnouncementTemplateCreate,
    db: Session = Depends(get_db)
):
    """Create a new announcement template"""
    template_service = get_announcement_template_service(db)

    # Validate placeholders
    if not template_service.validate_placeholders(template.english_template):
        raise HTTPException(
            status_code=400, detail="Invalid placeholder format in template")

    # Extract and store placeholders
    placeholders = template_service.extract_placeholders(
        template.english_template)
    template.detected_placeholders = json.dumps(placeholders)

    # Create template
    created_template = template_service.create_announcement_template(template)

    # Auto-translate if not already translated
    if not template.is_translated:
        try:
            translations = template_service.translate_announcement_template(
                created_template.english_template)

            # Update template with translations
            created_template.hindi_template = translations.get('hi')
            created_template.marathi_template = translations.get('mr')
            created_template.gujarati_template = translations.get('gu')
            created_template.is_translated = True

            db.commit()
            db.refresh(created_template)

        except Exception as e:
            print(
                f"Auto-translation failed for template {created_template.id}: {e}")

    return created_template


@router.get("/", response_model=List[AnnouncementTemplate])
def get_announcement_templates(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000,
                       description="Number of records to return"),
    db: Session = Depends(get_db)
):
    """Get all announcement templates with pagination"""
    template_service = get_announcement_template_service(db)
    return template_service.get_announcement_templates(skip=skip, limit=limit)


@router.get("/category/{category}", response_model=List[AnnouncementTemplate])
def get_templates_by_category(
    category: str,
    db: Session = Depends(get_db)
):
    """Get announcement templates by category"""
    template_service = get_announcement_template_service(db)
    templates = template_service.get_templates_by_category(category)
    if not templates:
        raise HTTPException(
            status_code=404, detail=f"No templates found for category: {category}")
    return templates


@router.get("/{template_id}", response_model=AnnouncementTemplate)
def get_announcement_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific announcement template by ID"""
    template_service = get_announcement_template_service(db)
    template = template_service.get_announcement_template(template_id)
    if not template:
        raise HTTPException(
            status_code=404, detail="Announcement template not found")
    return template


@router.put("/{template_id}", response_model=AnnouncementTemplate)
def update_announcement_template(
    template_id: int,
    template_update: AnnouncementTemplateUpdate,
    db: Session = Depends(get_db)
):
    """Update an announcement template"""
    template_service = get_announcement_template_service(db)

    # Validate placeholders if english_template is being updated
    if template_update.english_template:
        if not template_service.validate_placeholders(template_update.english_template):
            raise HTTPException(
                status_code=400, detail="Invalid placeholder format in template")

        # Update detected placeholders
        placeholders = template_service.extract_placeholders(
            template_update.english_template)
        template_update.detected_placeholders = json.dumps(placeholders)

    template = template_service.update_announcement_template(
        template_id, template_update)
    if not template:
        raise HTTPException(
            status_code=404, detail="Announcement template not found")
    return template


@router.delete("/{template_id}")
def delete_announcement_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """Delete an announcement template"""
    template_service = get_announcement_template_service(db)
    success = template_service.delete_announcement_template(template_id)
    if not success:
        raise HTTPException(
            status_code=404, detail="Announcement template not found")
    return {"message": "Announcement template deleted successfully"}


@router.post("/{template_id}/retranslate", response_model=AnnouncementTemplate)
def retranslate_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """Re-translate an announcement template"""
    template_service = get_announcement_template_service(db)
    template = template_service.get_announcement_template(template_id)

    if not template:
        raise HTTPException(
            status_code=404, detail="Announcement template not found")

    try:
        # Generate new translations
        translations = template_service.translate_announcement_template(
            template.english_template)

        # Update template with new translations
        template.hindi_template = translations.get('hi')
        template.marathi_template = translations.get('mr')
        template.gujarati_template = translations.get('gu')
        template.is_translated = True

        db.commit()
        db.refresh(template)

        return template

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Translation failed: {str(e)}")


@router.post("/import")
def import_announcement_templates(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import announcement templates from Excel file with auto-translation"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, detail="File must be an Excel file (.xlsx or .xls)")

    try:
        # Read the Excel file
        contents = file.file.read()
        df = pd.read_excel(io.BytesIO(contents))

        # Validate required columns with flexible matching
        required_columns = ['Announcement Category', 'English Template']
        actual_columns = list(df.columns)

        # Create a mapping for flexible column matching
        column_mapping = {}
        for required_col in required_columns:
            found = False
            for actual_col in actual_columns:
                # Check for exact match first
                if actual_col == required_col:
                    column_mapping[required_col] = actual_col
                    found = True
                    break
                # Check for case-insensitive match
                elif actual_col.lower().strip() == required_col.lower().strip():
                    column_mapping[required_col] = actual_col
                    found = True
                    break
                # Check for common variations
                elif (required_col == 'English Template' and
                      actual_col.lower().replace(' ', '').replace('_', '') == 'englishtemplate'):
                    column_mapping[required_col] = actual_col
                    found = True
                    break

            if not found:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required column: '{required_col}'. Found columns: {actual_columns}"
                )

        template_service = get_announcement_template_service(db)
        imported_count = 0
        total_count = len(df)

        # Process each row
        for index, row in df.iterrows():
            category = str(
                row[column_mapping['Announcement Category']]).strip()
            english_template = str(
                row[column_mapping['English Template']]).strip()

            # Skip if any required field is empty
            if not all([category, english_template]):
                continue

            # Validate placeholders
            if not template_service.validate_placeholders(english_template):
                print(
                    f"Warning: Invalid placeholders in template: {english_template}")
                continue

            # Extract placeholders
            placeholders = template_service.extract_placeholders(
                english_template)

            # Create template
            try:
                template_data = AnnouncementTemplateCreate(
                    category=category,
                    english_template=english_template,
                    detected_placeholders=json.dumps(placeholders),
                    is_translated=False
                )

                # Create the template
                created_template = template_service.create_announcement_template(
                    template_data)

                # Auto-translate
                try:
                    translations = template_service.translate_announcement_template(
                        created_template.english_template)

                    # Update template with translations
                    created_template.hindi_template = translations.get('hi')
                    created_template.marathi_template = translations.get('mr')
                    created_template.gujarati_template = translations.get('gu')
                    created_template.is_translated = True

                    db.commit()
                    db.refresh(created_template)
                    imported_count += 1

                except Exception as e:
                    print(
                        f"Translation failed for template {created_template.id}: {e}")
                    # Template is still created, just without translations
                    imported_count += 1

            except Exception as e:
                print(f"Failed to create template: {e}")
                continue

        return {
            "message": "Import completed successfully",
            "total_count": total_count,
            "imported_count": imported_count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.delete("/")
def clear_all_templates(
    db: Session = Depends(get_db)
):
    """Clear all announcement templates from the database"""
    template_service = get_announcement_template_service(db)
    deleted_count = template_service.clear_all_templates()
    return {"message": f"Successfully cleared {deleted_count} announcement templates"}
