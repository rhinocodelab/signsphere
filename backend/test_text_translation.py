#!/usr/bin/env python3
"""
Test script for Text Translation API endpoint
"""

import requests
import json

# Test configuration
BASE_URL = "https://localhost:5001"  # Backend URL
ENDPOINT = "/api/v1/text-translation/translate"

def test_text_translation():
    """Test the text translation endpoint"""
    
    print("🧪 Testing Text Translation API")
    print("=" * 50)
    
    # Test data - Gujarati text to translate to English
    test_data = {
        "text": "હેલો, તમે કેમ છો?",
        "source_language_code": "gu-IN",
        "target_language_code": "en-IN"
    }
    
    print(f"📝 Test Data:")
    print(f"   Text: {test_data['text']}")
    print(f"   Source Language: {test_data['source_language_code']}")
    print(f"   Target Language: {test_data['target_language_code']}")
    print()
    
    try:
        # Make the API request
        print("🚀 Sending translation request...")
        response = requests.post(
            f"{BASE_URL}{ENDPOINT}",
            json=test_data,
            verify=False,  # Skip SSL verification for local testing
            timeout=30
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Translation successful!")
            print(f"   Original Text: {result['original_text']}")
            print(f"   Translated Text: {result['translated_text']}")
            print(f"   Source Language: {result['source_language_code']}")
            print(f"   Target Language: {result['target_language_code']}")
            if result.get('confidence'):
                print(f"   Confidence: {result['confidence']}")
        else:
            print("❌ Translation failed!")
            try:
                error = response.json()
                print(f"   Error: {error.get('detail', 'Unknown error')}")
            except:
                print(f"   Error: {response.text}")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def test_supported_languages():
    """Test the supported languages endpoint"""
    
    print("\n🌍 Testing Supported Languages API")
    print("=" * 50)
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/text-translation/supported-languages",
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Supported languages retrieved!")
            print(f"   Target Language: {result['target_language']}")
            print(f"   Supported Source Languages:")
            for code, name in result['supported_source_languages'].items():
                print(f"     - {code}: {name}")
        else:
            print(f"❌ Failed to get supported languages: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_health_check():
    """Test the health check endpoint"""
    
    print("\n🏥 Testing Health Check API")
    print("=" * 50)
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/text-translation/health",
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Health check successful!")
            print(f"   Status: {result['status']}")
            print(f"   Service: {result['service']}")
            if result.get('gcp_project'):
                print(f"   GCP Project: {result['gcp_project']}")
            print(f"   Supported Languages: {result['supported_languages']}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    # Disable SSL warnings for local testing
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    # Run tests
    test_health_check()
    test_supported_languages()
    test_text_translation()
    
    print("\n🎉 Testing completed!")