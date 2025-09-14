# 🚂 Train Routes API Documentation

## Overview
The Train Routes API provides endpoints to manage train route information in the SignSphere application. This API allows you to create, read, update, delete, and search train routes.

## Database Schema

### TrainRoute Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key, auto-increment |
| `train_number` | String(10) | Unique train number (e.g., "12951") |
| `train_name` | String(200) | Train name (e.g., "Mumbai Rajdhani") |
| `from_station_code` | String(10) | Origin station code (e.g., "BCT") |
| `from_station` | String(100) | Origin station name (e.g., "Mumbai Central") |
| `to_station_code` | String(10) | Destination station code (e.g., "NDLS") |
| `to_station` | String(100) | Destination station name (e.g., "New Delhi") |
| `created_at` | DateTime | Record creation timestamp |
| `updated_at` | DateTime | Record last update timestamp |

## API Endpoints

### Base URL
```
https://localhost:5001/api/v1/train-routes
```

### 1. Create Train Route
**POST** `/train-routes/`

Creates a new train route.

**Request Body:**
```json
{
  "train_number": "12951",
  "train_name": "Mumbai Rajdhani",
  "from_station_code": "BCT",
  "from_station": "Mumbai Central",
  "to_station_code": "NDLS",
  "to_station": "New Delhi"
}
```

**Response:**
```json
{
  "id": 1,
  "train_number": "12951",
  "train_name": "Mumbai Rajdhani",
  "from_station_code": "BCT",
  "from_station": "Mumbai Central",
  "to_station_code": "NDLS",
  "to_station": "New Delhi",
  "created_at": "2025-01-27T10:30:00Z",
  "updated_at": null
}
```

### 2. Get All Train Routes
**GET** `/train-routes/`

Retrieves all train routes with pagination.

**Query Parameters:**
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Number of records to return (default: 100, max: 1000)

**Response:**
```json
[
  {
    "id": 1,
    "train_number": "12951",
    "train_name": "Mumbai Rajdhani",
    "from_station_code": "BCT",
    "from_station": "Mumbai Central",
    "to_station_code": "NDLS",
    "to_station": "New Delhi",
    "created_at": "2025-01-27T10:30:00Z",
    "updated_at": null
  }
]
```

### 3. Search Train Routes
**GET** `/train-routes/search?q={query}`

Searches train routes by train number or name.

**Query Parameters:**
- `q` (required): Search query (minimum 1 character)

**Response:**
```json
[
  {
    "id": 1,
    "train_number": "12951",
    "train_name": "Mumbai Rajdhani",
    "from_station_code": "BCT",
    "from_station": "Mumbai Central",
    "to_station_code": "NDLS",
    "to_station": "New Delhi",
    "created_at": "2025-01-27T10:30:00Z",
    "updated_at": null
  }
]
```

### 4. Get Train Route by ID
**GET** `/train-routes/{train_route_id}`

Retrieves a specific train route by its ID.

**Response:**
```json
{
  "id": 1,
  "train_number": "12951",
  "train_name": "Mumbai Rajdhani",
  "from_station_code": "BCT",
  "from_station": "Mumbai Central",
  "to_station_code": "NDLS",
  "to_station": "New Delhi",
  "created_at": "2025-01-27T10:30:00Z",
  "updated_at": null
}
```

### 5. Get Train Route by Number
**GET** `/train-routes/by-number/{train_number}`

Retrieves a specific train route by its train number.

**Response:**
```json
{
  "id": 1,
  "train_number": "12951",
  "train_name": "Mumbai Rajdhani",
  "from_station_code": "BCT",
  "from_station": "Mumbai Central",
  "to_station_code": "NDLS",
  "to_station": "New Delhi",
  "created_at": "2025-01-27T10:30:00Z",
  "updated_at": null
}
```

### 6. Update Train Route
**PUT** `/train-routes/{train_route_id}`

Updates an existing train route.

**Request Body:**
```json
{
  "train_name": "Updated Mumbai Rajdhani"
}
```

**Response:**
```json
{
  "id": 1,
  "train_number": "12951",
  "train_name": "Updated Mumbai Rajdhani",
  "from_station_code": "BCT",
  "from_station": "Mumbai Central",
  "to_station_code": "NDLS",
  "to_station": "New Delhi",
  "created_at": "2025-01-27T10:30:00Z",
  "updated_at": "2025-01-27T11:00:00Z"
}
```

### 7. Delete Train Route
**DELETE** `/train-routes/{train_route_id}`

Deletes a train route.

**Response:**
```json
{
  "message": "Train route deleted successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Train route with number 12951 already exists"
}
```

### 404 Not Found
```json
{
  "detail": "Train route not found"
}
```

## Sample Data

The database is pre-populated with the following sample train routes:

| Train # | Train Name | From Station | To Station |
|---------|------------|--------------|------------|
| 12951 | Mumbai Rajdhani | Mumbai Central | New Delhi |
| 12953 | Swarna Jayanti Rajdhani | Mumbai Central | New Delhi |
| 12955 | August Kranti Rajdhani | Mumbai Central | New Delhi |
| 12957 | Mumbai Duronto | Mumbai Central | Ahmedabad |
| 12961 | Ahmedabad Duronto | Ahmedabad | Mumbai Central |
| 12963 | Shatabdi Express | Mumbai Central | Ahmedabad |
| 12965 | Gujarat Express | Mumbai Central | Ahmedabad |
| 19015 | Saurashtra Express | Mumbai Central | Ahmedabad |
| 19017 | Gujarat Mail | Mumbai Central | Ahmedabad |
| 12967 | Golden Temple Mail | Mumbai Central | Amritsar |

## Usage Examples

### Python
```python
import requests

# Get all train routes
response = requests.get("https://localhost:5001/api/v1/train-routes/", verify=False)
routes = response.json()

# Search for trains
response = requests.get("https://localhost:5001/api/v1/train-routes/search?q=Rajdhani", verify=False)
rajdhani_trains = response.json()

# Create a new train route
new_route = {
    "train_number": "TEST123",
    "train_name": "Test Express",
    "from_station_code": "TEST",
    "from_station": "Test Station",
    "to_station_code": "DEST",
    "to_station": "Destination Station"
}
response = requests.post("https://localhost:5001/api/v1/train-routes/", json=new_route, verify=False)
```

### cURL
```bash
# Get all train routes
curl -k "https://localhost:5001/api/v1/train-routes/"

# Search for trains
curl -k "https://localhost:5001/api/v1/train-routes/search?q=Rajdhani"

# Create a new train route
curl -k -X POST "https://localhost:5001/api/v1/train-routes/" \
  -H "Content-Type: application/json" \
  -d '{
    "train_number": "TEST123",
    "train_name": "Test Express",
    "from_station_code": "TEST",
    "from_station": "Test Station",
    "to_station_code": "DEST",
    "to_station": "Destination Station"
  }'
```

## Notes

- All endpoints require HTTPS (self-signed certificate)
- Use `verify=False` in Python requests or `-k` flag in cURL for self-signed certificates
- The API follows RESTful conventions
- All timestamps are in ISO 8601 format with timezone information
- Search is case-insensitive and matches partial strings
