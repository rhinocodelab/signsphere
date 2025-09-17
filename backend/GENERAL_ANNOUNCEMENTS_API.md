# General Announcements API Documentation

## Overview
The General Announcements API provides endpoints for managing general announcements in the SignSphere system. It includes translation capabilities using Google Cloud Translation API and full CRUD operations for announcements.

## Base URL
```
https://localhost:5001/api/v1/general-announcements
```

## Authentication
All endpoints require authentication using Bearer token in the Authorization header.

## Endpoints

### 1. Translate Announcement
**POST** `/translate`

Translates English announcement text to Hindi, Marathi, and Gujarati using Google Cloud Translation API.

#### Request Body
```json
{
  "english_text": "Train 12345 is arriving at platform 2"
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `english_text` | String | Yes | English text to translate (max 10,000 characters) |

#### Response Example
```json
{
  "success": true,
  "original_text": "Train 12345 is arriving at platform 2",
  "translations": {
    "hindi": "ट्रेन 12345 प्लेटफॉर्म 2 पर आ रही है",
    "marathi": "ट्रेन 12345 प्लॅटफॉर्म 2 वर येत आहे",
    "gujarati": "ટ્રેન 12345 પ્લેટફોર્મ 2 પર આવી રહી છે"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | Whether translation was successful |
| `original_text` | String | Original input text |
| `translations` | Object | Object containing translations |
| `translations.hindi` | String | Hindi translation |
| `translations.marathi` | String | Marathi translation |
| `translations.gujarati` | String | Gujarati translation |

### 2. Create Announcement
**POST** `/`

Creates a new general announcement.

#### Request Body
```json
{
  "title": "Train Arrival Notice",
  "category": "Arrival",
  "english_content": "Train 12345 is arriving at platform 2",
  "hindi_content": "ट्रेन 12345 प्लेटफॉर्म 2 पर आ रही है",
  "marathi_content": "ट्रेन 12345 प्लॅटफॉर्म 2 वर येत आहे",
  "gujarati_content": "ટ્રેન 12345 પ્લેટફોર્મ 2 પર આવી રહી છે",
  "ai_model_type": "male",
  "isl_video_path": "/videos/arrival-12345.mp4",
  "audio_path": "/audio/arrival-12345.mp3"
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | String | Yes | Announcement title (1-255 characters) |
| `category` | String | Yes | Announcement category (see categories list) |
| `english_content` | String | Yes | English announcement content |
| `hindi_content` | String | No | Hindi translation |
| `marathi_content` | String | No | Marathi translation |
| `gujarati_content` | String | No | Gujarati translation |
| `ai_model_type` | String | No | AI model type ("male" or "female", default: "male") |
| `isl_video_path` | String | No | Path to ISL video file |
| `audio_path` | String | No | Path to audio file |

#### Response Example
```json
{
  "id": 1,
  "title": "Train Arrival Notice",
  "category": "Arrival",
  "english_content": "Train 12345 is arriving at platform 2",
  "hindi_content": "ट्रेन 12345 प्लेटफॉर्म 2 पर आ रही है",
  "marathi_content": "ट्रेन 12345 प्लॅटफॉर्म 2 वर येत आहे",
  "gujarati_content": "ટ્રેન 12345 પ્લેટફોર્મ 2 પર આવી રહી છે",
  "ai_model_type": "male",
  "isl_video_path": "/videos/arrival-12345.mp4",
  "audio_path": "/audio/arrival-12345.mp3",
  "is_translated": true,
  "is_active": true,
  "created_by": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": null
}
```

### 3. Get Announcements
**GET** `/`

Retrieves general announcements with optional filtering and search.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `skip` | Integer | No | Number of records to skip (default: 0) |
| `limit` | Integer | No | Number of records to return (default: 100, max: 1000) |
| `category` | String | No | Filter by category |
| `is_active` | Boolean | No | Filter by active status (default: true) |
| `search` | String | No | Search in title, content, or category |

#### Response Example
```json
[
  {
    "id": 1,
    "title": "Train Arrival Notice",
    "category": "Arrival",
    "english_content": "Train 12345 is arriving at platform 2",
    "hindi_content": "ट्रेन 12345 प्लेटफॉर्म 2 पर आ रही है",
    "marathi_content": "ट्रेन 12345 प्लॅटफॉर्म 2 वर येत आहे",
    "gujarati_content": "ટ્રેન 12345 પ્લેટફોર્મ 2 પર આવી રહી છે",
    "ai_model_type": "male",
    "isl_video_path": "/videos/arrival-12345.mp4",
    "audio_path": "/audio/arrival-12345.mp3",
    "is_translated": true,
    "is_active": true,
    "created_by": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": null,
    "creator_username": "admin",
    "creator_full_name": "Administrator"
  }
]
```

### 4. Get Single Announcement
**GET** `/{announcement_id}`

Retrieves a specific general announcement by ID.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `announcement_id` | Integer | Yes | ID of the announcement |

#### Response Example
```json
{
  "id": 1,
  "title": "Train Arrival Notice",
  "category": "Arrival",
  "english_content": "Train 12345 is arriving at platform 2",
  "hindi_content": "ट्रेन 12345 प्लेटफॉर्म 2 पर आ रही है",
  "marathi_content": "ट्रेन 12345 प्लॅटफॉर्म 2 वर येत आहे",
  "gujarati_content": "ટ્રેન 12345 પ્લેટફોર્મ 2 પર આવી રહી છે",
  "ai_model_type": "male",
  "isl_video_path": "/videos/arrival-12345.mp4",
  "audio_path": "/audio/arrival-12345.mp3",
  "is_translated": true,
  "is_active": true,
  "created_by": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": null,
  "creator_username": "admin",
  "creator_full_name": "Administrator"
}
```

### 5. Update Announcement
**PUT** `/{announcement_id}`

Updates an existing general announcement. Only the creator or admin can update.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `announcement_id` | Integer | Yes | ID of the announcement to update |

#### Request Body
```json
{
  "title": "Updated Train Arrival Notice",
  "category": "Arrival",
  "english_content": "Train 12345 is arriving at platform 3",
  "hindi_content": "ट्रेन 12345 प्लेटफॉर्म 3 पर आ रही है",
  "is_active": false
}
```

All fields are optional. Only provided fields will be updated.

#### Response Example
```json
{
  "id": 1,
  "title": "Updated Train Arrival Notice",
  "category": "Arrival",
  "english_content": "Train 12345 is arriving at platform 3",
  "hindi_content": "ट्रेन 12345 प्लेटफॉर्म 3 पर आ रही है",
  "marathi_content": "ट्रेन 12345 प्लॅटफॉर्म 2 वर येत आहे",
  "gujarati_content": "ટ્રેન 12345 પ્લેટફોર્મ 2 પર આવી રહી છે",
  "ai_model_type": "male",
  "isl_video_path": "/videos/arrival-12345.mp4",
  "audio_path": "/audio/arrival-12345.mp3",
  "is_translated": true,
  "is_active": false,
  "created_by": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:30:00Z"
}
```

### 6. Delete Announcement
**DELETE** `/{announcement_id}`

Deletes a general announcement. Only the creator or admin can delete.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `announcement_id` | Integer | Yes | ID of the announcement to delete |

#### Response Example
```json
{
  "message": "Announcement deleted successfully"
}
```

### 7. Get Categories
**GET** `/categories/list`

Retrieves the list of available announcement categories.

#### Response Example
```json
[
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
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "English text cannot be empty"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions to update this announcement"
}
```

### 404 Not Found
```json
{
  "detail": "Announcement not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Translation failed: Google Cloud Translation client not properly initialized"
}
```

## Usage Examples

### Create and Translate Announcement
```bash
# 1. Translate text
curl -X POST "https://localhost:5001/api/v1/general-announcements/translate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "english_text": "Train 12345 is arriving at platform 2"
  }'

# 2. Create announcement with translations
curl -X POST "https://localhost:5001/api/v1/general-announcements/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Train Arrival Notice",
    "category": "Arrival",
    "english_content": "Train 12345 is arriving at platform 2",
    "hindi_content": "ट्रेन 12345 प्लेटफॉर्म 2 पर आ रही है",
    "marathi_content": "ट्रेन 12345 प्लॅटफॉर्म 2 वर येत आहे",
    "gujarati_content": "ટ્રેન 12345 પ્લેટફોર્મ 2 પર આવી રહી છે",
    "ai_model_type": "male"
  }'
```

### Search Announcements
```bash
curl -X GET "https://localhost:5001/api/v1/general-announcements/?search=train&category=Arrival&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Translation Service

The translation functionality uses Google Cloud Translation API with the following language codes:

- **English**: `en`
- **Hindi**: `hi`
- **Marathi**: `mr`
- **Gujarati**: `gu`

The service automatically handles:
- Text length validation (max 10,000 characters)
- Error handling and fallback to original text
- Proper encoding for Indian languages

## Security

- All endpoints require authentication
- Users can only update/delete their own announcements
- Admins can update/delete any announcement
- Input validation on all fields
- SQL injection protection through SQLAlchemy ORM

## Rate Limiting

- Translation API is subject to Google Cloud Translation API limits
- Consider implementing rate limiting for production use
- Monitor API usage and costs

## Dependencies

- Google Cloud Translation API
- SQLAlchemy ORM
- FastAPI
- Pydantic for validation