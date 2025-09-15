# Text Translation API Documentation

## Overview
The Text Translation API provides translation services using Google Cloud Translate API. It translates text from Indian languages (Gujarati, Hindi, Marathi, English) to English (India).

## Base URL
```
https://localhost:5001/api/v1/text-translation
```

## Authentication
No authentication required for this endpoint.

## Endpoints

### 1. Translate Text
**POST** `/translate`

Translates text from source language to target language (always English).

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | String | Yes | Text to translate (max 10,000 characters) |
| `source_language_code` | String | Yes | Source language code (see supported languages) |
| `target_language_code` | String | No | Target language code (always "en-IN") |

#### Supported Source Languages

| Code | Language |
|------|----------|
| `gu-IN` | Gujarati (India) |
| `hi-IN` | Hindi (India) |
| `mr-IN` | Marathi (India) |
| `en-IN` | English (India) |

#### Request Example

```bash
curl -X POST "https://localhost:5001/api/v1/text-translation/translate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "હેલો, તમે કેમ છો?",
    "source_language_code": "gu-IN",
    "target_language_code": "en-IN"
  }'
```

#### Response Example

```json
{
  "success": true,
  "original_text": "હેલો, તમે કેમ છો?",
  "translated_text": "Hello, how are you?",
  "source_language_code": "gu-IN",
  "target_language_code": "en-IN",
  "confidence": 0.95
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | Whether translation was successful |
| `original_text` | String | Original input text |
| `translated_text` | String | Translated text |
| `source_language_code` | String | Source language code used |
| `target_language_code` | String | Target language code used |
| `confidence` | Float | Translation confidence score (0-1) |
| `error` | String | Error message (if any) |

### 2. Get Supported Languages
**GET** `/supported-languages`

Returns list of supported source languages for translation.

#### Response Example

```json
{
  "supported_source_languages": {
    "gu-IN": "Gujarati (India)",
    "hi-IN": "Hindi (India)",
    "mr-IN": "Marathi (India)",
    "en-IN": "English (India)"
  },
  "target_language": "en-IN",
  "total_count": 4,
  "description": "All translations are converted to English (India)"
}
```

### 3. Health Check
**GET** `/health`

Checks the health status of the translation service.

#### Response Example

```json
{
  "status": "healthy",
  "service": "text-translation",
  "gcp_project": "your-project-id",
  "supported_languages": 4
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Unsupported source language: fr-FR. Supported languages: ['gu-IN', 'hi-IN', 'mr-IN', 'en-IN']"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Translation failed: GCP authentication error. Please check your credentials."
}
```

## Usage Examples

### Python
```python
import requests

# Translate Gujarati text to English
response = requests.post(
    "https://localhost:5001/api/v1/text-translation/translate",
    json={
        "text": "હેલો, તમે કેમ છો?",
        "source_language_code": "gu-IN"
    },
    verify=False
)

if response.status_code == 200:
    result = response.json()
    print(f"Translated: {result['translated_text']}")
else:
    print(f"Error: {response.json()['detail']}")
```

### JavaScript
```javascript
const translateText = async (text, sourceLanguage) => {
  try {
    const response = await fetch('/api/v1/text-translation/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        source_language_code: sourceLanguage,
        target_language_code: 'en-IN'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.translated_text;
    } else {
      const error = await response.json();
      throw new Error(error.detail);
    }
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
};

// Usage
translateText('હેલો, તમે કેમ છો?', 'gu-IN')
  .then(translated => console.log(translated))
  .catch(error => console.error(error));
```

## Configuration

### Environment Variables
- `GOOGLE_CLOUD_PROJECT`: Your GCP project ID
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to GCP service account JSON file

### GCP Setup
1. Enable the Cloud Translation API in your GCP project
2. Create a service account with Translation API permissions
3. Download the service account JSON key
4. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable

## Rate Limits
- GCP Translation API has its own rate limits
- Maximum text length: 10,000 characters per request
- No specific rate limits implemented in this API

## Notes
- All translations are converted to English (India) - `en-IN`
- The API uses Google Cloud Translate v3 for neural machine translation
- Confidence scores are provided when available from GCP
- The service includes comprehensive error handling and logging