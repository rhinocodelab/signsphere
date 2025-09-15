# ISL Video Generation API Documentation

## Overview
The ISL Video Generation API provides services for creating Indian Sign Language (ISL) videos by stitching together individual sign videos using FFmpeg. It supports both male and female AI models and handles the complete workflow from text input to final video output.

## Base URL
```
https://localhost:5001/api/v1/isl-video-generation
```

## Authentication
No authentication required for this endpoint.

## Endpoints

### 1. Generate ISL Video
**POST** `/generate`

Generates a temporary ISL video by stitching individual sign videos based on input text.

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | String | Yes | English text to convert to ISL video |
| `model` | String | Yes | AI model to use ("male" or "female") |
| `user_id` | Integer | Yes | User ID for tracking |

#### Request Example

```bash
curl -X POST "https://localhost:5001/api/v1/isl-video-generation/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "hello world",
    "model": "male",
    "user_id": 1
  }'
```

#### Response Example

```json
{
  "success": true,
  "temp_video_id": "123e4567-e89b-12d3-a456-426614174000",
  "preview_url": "/api/v1/isl-video-generation/preview/123e4567-e89b-12d3-a456-426614174000",
  "video_duration": 5.2,
  "signs_used": ["hello", "world"],
  "signs_skipped": [],
  "error": null
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | Whether video generation was successful |
| `temp_video_id` | String | Unique ID for temporary video |
| `preview_url` | String | URL to preview the generated video |
| `video_duration` | Float | Duration of generated video in seconds |
| `signs_used` | Array | List of signs that were found and used |
| `signs_skipped` | Array | List of signs that were not found |
| `error` | String | Error message (if any) |

### 2. Preview Video
**GET** `/preview/{video_id}`

Serves the temporary video file for preview.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `video_id` | String | Yes | Temporary video ID from generation response |

#### Response
Returns the MP4 video file for streaming.

### 3. Save ISL Video
**POST** `/save`

Saves the temporary video to permanent storage.

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `temp_video_id` | String | Yes | Temporary video ID to save |
| `user_id` | Integer | Yes | User ID for file organization |

#### Request Example

```bash
curl -X POST "https://localhost:5001/api/v1/isl-video-generation/save" \
  -H "Content-Type: application/json" \
  -d '{
    "temp_video_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": 1
  }'
```

#### Response Example

```json
{
  "success": true,
  "final_video_url": "/api/v1/isl-videos/serve/1/isl_video_20241201_143022_123e4567.mp4",
  "video_id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "isl_video_20241201_143022_123e4567.mp4",
  "error": null
}
```

### 4. Get Supported Models
**GET** `/supported-models`

Returns list of supported AI models.

#### Response Example

```json
{
  "supported_models": ["male", "female"],
  "total_count": 2,
  "description": "Available AI models for ISL video generation"
}
```

### 5. Health Check
**GET** `/health`

Checks the health status of the ISL video generation service.

#### Response Example

```json
{
  "status": "healthy",
  "service": "isl-video-generation",
  "ffmpeg_available": true,
  "directories_ok": true,
  "supported_models": 2,
  "frontend_videos_dir": "/path/to/frontend/public/videos/isl-videos",
  "temp_videos_dir": "/path/to/backend/temp/isl-videos",
  "final_videos_dir": "/path/to/backend/uploads/isl-videos"
}
```

## Video File Structure

### Source Videos
```
frontend/public/videos/isl-videos/
├── male-model/
│   ├── hello.mp4
│   ├── world.mp4
│   ├── 0.mp4
│   ├── 1.mp4
│   └── ...
└── female-model/
    ├── hello.mp4
    ├── world.mp4
    ├── 0.mp4
    ├── 1.mp4
    └── ...
```

### Generated Videos
```
backend/uploads/isl-videos/
├── user_1/
│   ├── isl_video_20241201_143022_123e4567.mp4
│   └── ...
└── user_2/
    └── ...
```

## Text Processing

### Supported Text Format
- **Input**: Plain English text
- **Processing**: 
  - Converts to lowercase
  - Removes punctuation
  - Splits into individual words
  - Maps words to sign video files

### Example Text Processing
```
Input: "Hello, world!"
Processing: ["hello", "world"]
Video Files: ["hello.mp4", "world.mp4"]
```

## Video Generation Process

### 1. Text Analysis
- Parse input text into individual words
- Remove punctuation and normalize case
- Create list of required signs

### 2. Video File Lookup
- Search for corresponding video files in model directory
- Handle missing signs gracefully (skip them)
- Log found and missing signs

### 3. Video Concatenation
- Use FFmpeg to concatenate video files
- Copy streams without re-encoding for speed
- Generate temporary video file

### 4. Temporary Storage
- Save generated video to temp directory
- Generate unique temporary ID
- Provide preview URL for user review

### 5. Permanent Storage
- Move video to user-specific directory
- Generate timestamped filename
- Clean up temporary files

## Error Handling

### Common Errors

#### 400 Bad Request
```json
{
  "detail": "Unsupported model: invalid. Supported: ['male', 'female']"
}
```

#### 404 Not Found
```json
{
  "detail": "Preview video not found or expired"
}
```

#### 500 Internal Server Error
```json
{
  "detail": "Video generation failed: FFmpeg concatenation failed"
}
```

## Usage Examples

### Python
```python
import requests

# Generate video
response = requests.post(
    "https://localhost:5001/api/v1/isl-video-generation/generate",
    json={
        "text": "hello world",
        "model": "male",
        "user_id": 1
    },
    verify=False
)

if response.status_code == 200:
    result = response.json()
    temp_video_id = result['temp_video_id']
    preview_url = result['preview_url']
    
    # Save video
    save_response = requests.post(
        "https://localhost:5001/api/v1/isl-video-generation/save",
        json={
            "temp_video_id": temp_video_id,
            "user_id": 1
        },
        verify=False
    )
    
    if save_response.status_code == 200:
        final_result = save_response.json()
        print(f"Video saved: {final_result['final_video_url']}")
```

### JavaScript
```javascript
const generateISLVideo = async (text, model, userId) => {
  try {
    // Generate video
    const generateResponse = await fetch('/api/v1/isl-video-generation/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model, user_id: userId })
    });
    
    if (generateResponse.ok) {
      const result = await generateResponse.json();
      
      // Preview video
      const videoElement = document.getElementById('preview-video');
      videoElement.src = result.preview_url;
      
      // Save video when user confirms
      const saveResponse = await fetch('/api/v1/isl-video-generation/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temp_video_id: result.temp_video_id,
          user_id: userId
        })
      });
      
      if (saveResponse.ok) {
        const saveResult = await saveResponse.json();
        return saveResult.final_video_url;
      }
    }
  } catch (error) {
    console.error('Video generation error:', error);
  }
};
```

## Configuration

### Required Dependencies
- **FFmpeg**: For video concatenation
- **Python**: subprocess, pathlib, uuid, shutil

### Directory Setup
```bash
# Create necessary directories
mkdir -p backend/temp/isl-videos
mkdir -p backend/uploads/isl-videos
```

### FFmpeg Installation
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# Verify installation
ffmpeg -version
```

## Performance Notes

- **Video Format**: MP4 only
- **Quality**: Uses pre-processed videos (no re-encoding)
- **Concatenation**: Stream copy for fast processing
- **Storage**: Temporary files cleaned up after save
- **Timeout**: 5-minute timeout for video processing

## Security Considerations

- Temporary videos are cleaned up after save
- User-specific directory structure
- No authentication required (adjust as needed)
- File path validation to prevent directory traversal