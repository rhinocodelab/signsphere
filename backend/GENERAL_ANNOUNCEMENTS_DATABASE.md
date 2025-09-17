# General Announcements Database Table

## Overview
The `general_announcements` table stores general announcements created by users in the SignSphere system. Each announcement can be translated to multiple languages and includes ISL video generation capabilities.

## Table Structure

### Table Name
`general_announcements`

### Columns

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | Integer | Primary Key, Index | Unique identifier for the announcement |
| `title` | String(255) | Not Null, Index | Title of the announcement |
| `category` | String(100) | Not Null, Index | Category of the announcement |
| `english_content` | Text | Not Null | English version of the announcement |
| `hindi_content` | Text | Nullable | Hindi translation |
| `marathi_content` | Text | Nullable | Marathi translation |
| `gujarati_content` | Text | Nullable | Gujarati translation |
| `ai_model_type` | String(10) | Not Null, Default: 'male' | AI model used for ISL generation |
| `isl_video_path` | String(500) | Nullable | Path to generated ISL video |
| `audio_path` | String(500) | Nullable | Path to audio file |
| `is_translated` | Boolean | Not Null, Default: False | Whether translations are available |
| `is_active` | Boolean | Not Null, Default: True, Index | Whether announcement is active |
| `created_by` | Integer | Not Null, Foreign Key, Index | ID of user who created the announcement |
| `created_at` | DateTime | Not Null, Default: now() | Creation timestamp |
| `updated_at` | DateTime | Nullable, Auto-update | Last update timestamp |

## Constraints

### Check Constraints
1. **AI Model Type**: Must be either 'male' or 'female'
2. **Category**: Must be one of the predefined categories:
   - Arrival
   - Departure
   - Delay
   - Platform Change
   - Safety
   - Weather
   - General Information
   - Emergency
   - Maintenance
   - Other

### Indexes
1. **Primary Index**: `id` (Primary Key)
2. **Search Index**: `title`, `category` (GIN index for full-text search)
3. **User Index**: `created_by` (Foreign Key index)
4. **Status Index**: `is_active` (Boolean index for filtering)

## Relationships

### Foreign Keys
- `created_by` → `users.id` (Many-to-One relationship)

### SQLAlchemy Relationships
- `creator`: Relationship to User model (back_populates="general_announcements")

## Usage Examples

### Creating a New Announcement
```python
from app.models.general_announcement import GeneralAnnouncement
from app.db.session import SessionLocal

db = SessionLocal()

announcement = GeneralAnnouncement(
    title="Train Arrival Notice",
    category="Arrival",
    english_content="Train 12345 is arriving at platform 2",
    hindi_content="ट्रेन 12345 प्लेटफॉर्म 2 पर आ रही है",
    ai_model_type="male",
    created_by=1  # User ID
)

db.add(announcement)
db.commit()
```

### Querying Announcements
```python
# Get all active announcements
active_announcements = db.query(GeneralAnnouncement).filter(
    GeneralAnnouncement.is_active == True
).all()

# Get announcements by category
arrival_announcements = db.query(GeneralAnnouncement).filter(
    GeneralAnnouncement.category == "Arrival"
).all()

# Get announcements by creator
user_announcements = db.query(GeneralAnnouncement).filter(
    GeneralAnnouncement.created_by == user_id
).all()
```

## API Integration

### Pydantic Schemas
- `GeneralAnnouncementBase`: Base schema with common fields
- `GeneralAnnouncementCreate`: Schema for creating new announcements
- `GeneralAnnouncementUpdate`: Schema for updating existing announcements
- `GeneralAnnouncement`: Schema for reading announcements
- `GeneralAnnouncementWithCreator`: Schema including creator information

### Validation Rules
- Title: 1-255 characters
- Category: Must be from predefined list
- English content: Minimum 1 character
- AI model type: Must be 'male' or 'female'
- All other fields: Optional with appropriate validation

## File Paths

### Model Definition
- `backend/app/models/general_announcement.py`

### Schema Definition
- `backend/app/schemas/general_announcement.py`

### Database Initialization
- `backend/app/db/init_db.py` (updated to include new model)

### Table Creation Script
- `backend/create_general_announcements_table.py`

## Migration Instructions

### For New Installations
The table will be created automatically when running the database initialization script.

### For Existing Installations
Run the table creation script:
```bash
cd backend
python create_general_announcements_table.py
```

### Verification
After creation, verify the table exists:
```sql
SELECT name FROM sqlite_master WHERE type='table' AND name='general_announcements';
```

## Security Considerations

1. **User Authorization**: Only authenticated users can create announcements
2. **Data Validation**: All input is validated through Pydantic schemas
3. **File Path Security**: ISL video and audio paths should be validated
4. **Content Filtering**: Consider implementing content moderation for announcements

## Performance Considerations

1. **Indexes**: Proper indexing on frequently queried fields
2. **Full-Text Search**: GIN index for efficient text searching
3. **Pagination**: Implement pagination for large result sets
4. **Caching**: Consider caching frequently accessed announcements

## Future Enhancements

1. **Soft Delete**: Implement soft delete functionality
2. **Versioning**: Track announcement versions and changes
3. **Approval Workflow**: Add approval process for announcements
4. **Analytics**: Track announcement usage and effectiveness
5. **Bulk Operations**: Support for bulk import/export of announcements