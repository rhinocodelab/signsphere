# Speech Recognition API Documentation

## Overview

The Speech Recognition API provides synchronous speech-to-text conversion using Google Cloud Speech-to-Text API. It supports multiple Indian languages and includes features like audio preprocessing, caching, and comprehensive error handling.

## Base URL

```
https://localhost:5001/api/v1/speech-recognition
```

## Authentication

The API uses GCP Application Credentials from the backend environment. Ensure `GOOGLE_APPLICATION_CREDENTIALS` is set in your `.env` file.

## Endpoints

### 1. Transcribe Audio

**POST** `/transcribe`

Convert audio file to text using GCP Speech-to-Text API.

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `file` | File | Yes | - | Audio file to transcribe |
| `language_code` | String | Yes | - | Language code (e.g., "gu-IN", "hi-IN") |
| `sample_rate` | Integer | No | 44100 | Audio sample rate in Hz |
| `enable_automatic_punctuation` | Boolean | No | true | Enable automatic punctuation |
| `enable_word_time_offsets` | Boolean | No | true | Enable word-level timing |

#### Supported Languages

| Code | Language |
|------|----------|
| `en-IN` | English (India) |
| `hi-IN` | Hindi (India) |
| `mr-IN` | Marathi (India) |
| `gu-IN` | Gujarati (India) |

#### Supported Audio Formats

- **WAV** (Linear PCM)
- **FLAC** (Free Lossless Audio Codec)
- **MP3** (MPEG Audio Layer III)
- **OGG** (Ogg Vorbis)

#### Request Example

```bash
curl -X POST "https://localhost:5001/api/v1/speech-recognition/transcribe" \
  -F "file=@audio.wav" \
  -F "language_code=hi-IN" \
  -F "enable_automatic_punctuation=true" \
  -F "enable_word_time_offsets=true" \
  -k
```

#### Response Format

```json
{
  "success": true,
  "transcript": "आप कैसे हैं?",
  "confidence": 0.95,
  "language_code": "hi-IN",
  "duration": 3.2,
  "word_count": 3,
  "word_time_offsets": [
    {
      "word": "आप",
      "start_time": 0.5,
      "end_time": 0.8
    },
    {
      "word": "कैसे",
      "start_time": 0.9,
      "end_time": 1.2
    },
    {
      "word": "हैं",
      "start_time": 1.3,
      "end_time": 1.6
    }
  ],
  "cached": false,
  "audio_info": {
    "sample_rate": 44100,
    "duration": 3.2,
    "file_extension": "wav",
    "encoding": "LINEAR16",
    "channels": 1,
    "file_size": 1024000
  }
}
```

#### Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 | Unsupported language code or audio format |
| 400 | File size too large (>10MB) |
| 400 | Audio duration exceeds 60 seconds |
| 400 | No speech detected in audio |
| 429 | Speech recognition quota exceeded |
| 500 | GCP Speech API error |
| 500 | Internal server error |

### 2. Get Supported Languages

**GET** `/supported-languages`

Get list of supported languages.

#### Response Example

```json
{
  "supported_languages": {
    "gu-IN": "Gujarati (India)",
    "hi-IN": "Hindi (India)",
    "en-IN": "English (India)"
  },
  "total_count": 12
}
```

### 3. Get Supported Formats

**GET** `/supported-formats`

Get list of supported audio formats.

#### Response Example

```json
{
  "supported_formats": ["wav", "flac", "mp3", "ogg"],
  "total_count": 4
}
```

### 4. Clear Cache

**DELETE** `/cache`

Clear all cached transcripts.

#### Response Example

```json
{
  "success": true,
  "message": "Cleared 5 cached transcripts",
  "cleared_count": 5
}
```

### 5. Get Cache Statistics

**GET** `/cache/stats`

Get cache statistics.

#### Response Example

```json
{
  "total_files": 5,
  "total_size_bytes": 1024000,
  "total_size_mb": 1.02,
  "cache_directory": "cache/transcripts"
}
```

## Features

### 1. Audio Preprocessing

- **Resampling**: Automatically resamples audio to optimal sample rate
- **Normalization**: Normalizes audio levels for better recognition
- **Silence Removal**: Removes silence from beginning and end
- **Format Conversion**: Converts to WAV format for processing

### 2. Caching System

- **File-based Cache**: Caches transcripts based on file hash and language
- **Automatic Cache**: Automatically caches successful transcriptions
- **Cache Management**: Provides endpoints to view and clear cache
- **Performance**: Avoids re-processing identical audio files

### 3. Error Handling

- **Comprehensive Validation**: Validates file format, size, and language
- **GCP Error Handling**: Handles quota limits and API errors
- **Graceful Degradation**: Falls back to original file if preprocessing fails
- **Detailed Error Messages**: Provides specific error information

### 4. Performance Optimization

- **Enhanced Model**: Uses GCP's enhanced model for better accuracy
- **Latest Model**: Uses the latest_long model for optimal results
- **Temporary File Management**: Automatically cleans up temporary files
- **Memory Efficient**: Processes files in chunks to manage memory

## Usage Examples

### Python Example

```python
import requests

def transcribe_audio(audio_file_path, language_code="hi-IN"):
    url = "https://localhost:5001/api/v1/speech-recognition/transcribe"
    
    with open(audio_file_path, 'rb') as f:
        files = {'file': (audio_file_path, f, 'audio/wav')}
        data = {
            'language_code': language_code
        }
        
        response = requests.post(url, files=files, data=data, verify=False)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Transcription failed: {response.text}")

# Usage
result = transcribe_audio("audio.wav", "hi-IN")
print(f"Transcript: {result['transcript']}")
print(f"Confidence: {result['confidence']}")
```

### JavaScript Example

```javascript
async function transcribeAudio(audioFile, languageCode = 'hi-IN') {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('language_code', languageCode);
    
    const response = await fetch('/api/v1/speech-recognition/transcribe', {
        method: 'POST',
        body: formData
    });
    
    if (response.ok) {
        return await response.json();
    } else {
        throw new Error(`Transcription failed: ${response.statusText}`);
    }
}

// Usage
const audioFile = document.getElementById('audioFile').files[0];
transcribeAudio(audioFile, 'hi-IN')
    .then(result => {
        console.log('Transcript:', result.transcript);
        console.log('Confidence:', result.confidence);
    })
    .catch(error => console.error('Error:', error));
```

## Configuration

### Environment Variables

```bash
# GCP Configuration
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCP_PROJECT_ID=your-project-id

# Optional: Cache configuration
CACHE_DIR=cache/transcripts
TEMP_AUDIO_DIR=temp/audio
```

### Dependencies

```txt
google-cloud-speech==2.21.0
librosa
soundfile
fastapi
python-multipart
```

## Performance Considerations

### Response Times

- **Short Audio** (< 10 seconds): ~2-3 seconds
- **Medium Audio** (10-30 seconds): ~5-8 seconds
- **Long Audio** (30-60 seconds): ~10-15 seconds

### Optimization Tips

1. **Use WAV format** for best performance
2. **Keep audio files under 10MB** for synchronous processing
3. **Use appropriate sample rate** (16kHz recommended)
4. **Enable caching** for repeated files
5. **Monitor cache size** and clear when needed

## Troubleshooting

### Common Issues

1. **"Failed to initialize GCP Speech client"**
   - Check `GOOGLE_APPLICATION_CREDENTIALS` environment variable
   - Verify service account has Speech-to-Text API access

2. **"Speech recognition quota exceeded"**
   - Check GCP quota limits
   - Consider upgrading quota or using batch processing

3. **"No speech detected in audio file"**
   - Check audio quality and volume
   - Verify language code matches audio content
   - Try different audio preprocessing settings

4. **"Unsupported audio format"**
   - Convert audio to supported format (WAV, FLAC, MP3, OGG)
   - Check file extension and encoding

### Debug Mode

Enable debug logging by setting log level to DEBUG in the application configuration.

## Cost Optimization

### GCP Pricing

- **Standard Model**: $0.006 per 15 seconds
- **Enhanced Model**: $0.009 per 15 seconds
- **Free Tier**: 60 minutes per month

### Cost Reduction Strategies

1. **Use caching** to avoid re-processing
2. **Preprocess audio** to reduce file size
3. **Use appropriate model** (standard vs enhanced)
4. **Monitor usage** and set up billing alerts
5. **Batch processing** for multiple files

## Security Considerations

1. **File Validation**: All uploaded files are validated for format and size
2. **Temporary Files**: Temporary files are automatically cleaned up
3. **Cache Security**: Cache files are stored locally and not exposed via API
4. **Error Handling**: Sensitive information is not exposed in error messages
5. **Rate Limiting**: Consider implementing rate limiting for production use

## Future Enhancements

1. **Async Processing**: Support for longer audio files
2. **Streaming**: Real-time speech recognition
3. **Custom Models**: Support for custom GCP models
4. **Batch Processing**: Process multiple files simultaneously
5. **Webhook Support**: Notify when processing is complete
6. **Audio Quality Analysis**: Analyze audio quality before processing
7. **Multi-language Detection**: Automatic language detection
8. **Speaker Diarization**: Identify different speakers