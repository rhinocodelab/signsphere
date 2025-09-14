from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import subprocess
import asyncio
from pathlib import Path

from app.db.deps import get_db
from app.schemas.isl_video import ISLVideo, ISLVideoCreate, ISLVideoUpdate, ISLVideoSearch
from app.services.isl_video import get_isl_video_service, ISLVideoService

router = APIRouter()


@router.get("/test")
def test_endpoint():
    """Test endpoint to verify the router is working"""
    return {"message": "ISL videos endpoint is working"}


def get_video_duration(video_path: str) -> float:
    """Get video duration using ffprobe"""
    try:
        cmd = [
            "ffprobe", "-v", "quiet", "-show_entries", "format=duration",
            "-of", "csv=p=0", video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            return float(result.stdout.strip())
    except Exception:
        pass
    return 0.0


async def process_video_async(video_id: int, input_path: str, output_folder: str, db: Session):
    """Background video processing with FFmpeg"""
    try:
        # Generate output filename
        filename = os.path.basename(input_path)
        name_without_ext = os.path.splitext(filename)[0]
        output_filename = f"{name_without_ext}_processed.mp4"
        output_path = f"{output_folder}/{output_filename}"

        # FFmpeg command
        cmd = [
            "ffmpeg", "-i", input_path,
            "-vf", "fps=30:round=up,scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-an", "-movflags", "+faststart", "-pix_fmt", "yuv420p",
            output_path, "-y"
        ]

        # Execute FFmpeg
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            # Get video metadata
            duration = get_video_duration(output_path)
            file_size = os.path.getsize(output_path)

            # Remove original file
            if os.path.exists(input_path):
                os.remove(input_path)

            # Rename processed file to original filename
            original_filename = os.path.basename(input_path)
            final_path = f"{output_folder}/{original_filename}"
            os.rename(output_path, final_path)

            # Update database with processed video info
            video_service = get_isl_video_service(db)
            update_data = ISLVideoUpdate(
                video_path=final_path,
                file_size=file_size,
                duration_seconds=duration
            )
            video_service.update_isl_video(video_id, update_data)

            print(f"✅ Video {video_id} processed successfully")

        else:
            # Handle processing error
            video_service = get_isl_video_service(db)
            update_data = ISLVideoUpdate(is_active=False)
            video_service.update_isl_video(video_id, update_data)
            print(
                f"❌ FFmpeg processing failed for video {video_id}: {result.stderr}")

    except Exception as e:
        print(f"❌ Error processing video {video_id}: {e}")
        # Mark as failed in database
        try:
            video_service = get_isl_video_service(db)
            update_data = ISLVideoUpdate(is_active=False)
            video_service.update_isl_video(video_id, update_data)
        except:
            pass


@router.post("/upload", response_model=dict)
async def upload_isl_video(
    file: UploadFile = File(...),
    model_type: str = Form(...),
    display_name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload ISL video with automatic folder creation and processing"""

    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.mp4'):
        raise HTTPException(
            status_code=400, detail="Only MP4 files are allowed")

    # Validate model type
    if model_type not in ['male', 'female']:
        raise HTTPException(
            status_code=400, detail="Model type must be 'male' or 'female'")

    # Extract folder name from filename
    filename = file.filename
    folder_name = os.path.splitext(filename)[0]  # Remove .mp4 extension

    # Create directory structure
    base_path = "/var/www/signsphere/uploads/isl-videos"
    model_path = f"{base_path}/{model_type}-model"
    video_folder = f"{model_path}/{folder_name}"

    # Create folder
    os.makedirs(video_folder, exist_ok=True)

    # Save original file
    original_path = f"{video_folder}/{filename}"
    try:
        content = await file.read()
        with open(original_path, "wb") as buffer:
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to save file: {str(e)}")

    # Create database record
    video_service = get_isl_video_service(db)
    video_data = ISLVideoCreate(
        filename=filename,
        display_name=display_name or folder_name,
        video_path=original_path,
        file_size=len(content),
        model_type=model_type,
        mime_type="video/mp4",
        file_extension="mp4",
        description=description,
        tags=tags,
        is_active=True
    )

    # Save to database
    db_video = video_service.create_isl_video(video_data)

    # Start background processing
    asyncio.create_task(process_video_async(
        db_video.id, original_path, video_folder, db))

    return {
        "message": "Video uploaded successfully",
        "video_id": db_video.id,
        "processing_status": "processing"
    }


@router.get("/", response_model=dict)
def get_isl_videos(
    model_type: Optional[str] = Query(
        None, description="Filter by model type (male/female)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(12, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term"),
    db: Session = Depends(get_db)
):
    """Get ISL videos with pagination and filtering"""

    try:
        print(
            f"Getting videos with model_type={model_type}, page={page}, limit={limit}, search={search}")
        video_service = get_isl_video_service(db)
        print("Video service created successfully")

        # Create search parameters
        search_params = ISLVideoSearch(
            model_type=model_type,
            search_text=search,
            is_active=True,
            limit=limit,
            offset=(page - 1) * limit
        )

        # Get videos
        print("Search parameters created successfully")
        videos = video_service.search_isl_videos(search_params)
        print(f"Found {len(videos)} videos")

        # Get total count for pagination
        total_search_params = ISLVideoSearch(
            model_type=model_type,
            search_text=search,
            is_active=True,
            limit=1000,  # Large limit to get total count
            offset=0
        )
        total_videos = len(
            video_service.search_isl_videos(total_search_params))
        print(f"Total videos: {total_videos}")

        # Convert SQLAlchemy models to dictionaries for serialization
        videos_data = []
        for video in videos:
            video_dict = {
                "id": video.id,
                "filename": video.filename,
                "display_name": video.display_name,
                "video_path": video.video_path,
                "file_size": video.file_size,
                "duration_seconds": float(video.duration_seconds) if video.duration_seconds else None,
                "width": video.width,
                "height": video.height,
                "model_type": video.model_type,
                "mime_type": video.mime_type,
                "file_extension": video.file_extension,
                "description": video.description,
                "tags": video.tags,
                "content_type": video.content_type,
                "is_active": video.is_active,
                "created_at": video.created_at.isoformat() if video.created_at else None,
                "updated_at": video.updated_at.isoformat() if video.updated_at else None
            }
            videos_data.append(video_dict)

        result = {
            "videos": videos_data,
            "total": total_videos,
            "page": page,
            "limit": limit,
            "total_pages": (total_videos + limit - 1) // limit
        }
        print("Returning result successfully")
        return result
    except Exception as e:
        print(f"Error in get_isl_videos: {e}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{video_id}", response_model=ISLVideo)
def get_isl_video(
    video_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific ISL video by ID"""

    video_service = get_isl_video_service(db)
    video = video_service.get_isl_video(video_id)

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    return video


@router.put("/{video_id}", response_model=ISLVideo)
def update_isl_video(
    video_id: int,
    video_update: ISLVideoUpdate,
    db: Session = Depends(get_db)
):
    """Update ISL video metadata"""

    video_service = get_isl_video_service(db)
    video = video_service.update_isl_video(video_id, video_update)

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    return video


@router.delete("/{video_id}")
def delete_isl_video(
    video_id: int,
    db: Session = Depends(get_db)
):
    """Delete ISL video (soft delete)"""

    video_service = get_isl_video_service(db)
    success = video_service.delete_isl_video(video_id)

    if not success:
        raise HTTPException(status_code=404, detail="Video not found")

    return {"message": "Video deleted successfully"}


@router.get("/statistics/summary")
def get_video_statistics(db: Session = Depends(get_db)):
    """Get ISL video statistics"""

    video_service = get_isl_video_service(db)
    stats = video_service.get_video_statistics()

    return stats
