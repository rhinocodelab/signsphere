#!/usr/bin/env python3
"""
Test script for ISL Video Generation API endpoint
"""

import requests
import json
import time

# Test configuration
BASE_URL = "https://localhost:5001"  # Backend URL

def test_generate_isl_video():
    """Test the ISL video generation endpoint"""
    
    print("🎬 Testing ISL Video Generation API")
    print("=" * 50)
    
    # Test data - using words that exist in the video library
    test_data = {
        "text": "train platform",
        "model": "male",
        "user_id": 1
    }
    
    print(f"📝 Test Data:")
    print(f"   Text: {test_data['text']}")
    print(f"   Model: {test_data['model']}")
    print(f"   User ID: {test_data['user_id']}")
    print()
    
    try:
        # Make the API request
        print("🚀 Sending video generation request...")
        response = requests.post(
            f"{BASE_URL}/api/v1/isl-video-generation/generate",
            json=test_data,
            verify=False,  # Skip SSL verification for local testing
            timeout=60  # Longer timeout for video processing
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Video generation successful!")
            print(f"   Temp Video ID: {result['temp_video_id']}")
            print(f"   Preview URL: {result['preview_url']}")
            print(f"   Video Duration: {result.get('video_duration', 'N/A')} seconds")
            print(f"   Signs Used: {result['signs_used']}")
            print(f"   Signs Skipped: {result['signs_skipped']}")
            
            # Test preview endpoint
            if result.get('preview_url'):
                print(f"\n🔍 Testing preview endpoint...")
                preview_response = requests.get(
                    f"{BASE_URL}{result['preview_url']}",
                    verify=False,
                    timeout=30
                )
                print(f"   Preview Status: {preview_response.status_code}")
                if preview_response.status_code == 200:
                    print("   ✅ Preview video accessible")
                else:
                    print("   ❌ Preview video not accessible")
            
            return result.get('temp_video_id')
        else:
            print("❌ Video generation failed!")
            try:
                error = response.json()
                print(f"   Error: {error.get('detail', 'Unknown error')}")
            except:
                print(f"   Error: {response.text}")
            return None
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None

def test_save_isl_video(temp_video_id):
    """Test the ISL video save endpoint"""
    
    if not temp_video_id:
        print("❌ No temp video ID to save")
        return
    
    print(f"\n💾 Testing ISL Video Save API")
    print("=" * 50)
    
    # Test data
    test_data = {
        "temp_video_id": temp_video_id,
        "user_id": 1
    }
    
    print(f"📝 Test Data:")
    print(f"   Temp Video ID: {test_data['temp_video_id']}")
    print(f"   User ID: {test_data['user_id']}")
    print()
    
    try:
        # Make the API request
        print("🚀 Sending video save request...")
        response = requests.post(
            f"{BASE_URL}/api/v1/isl-video-generation/save",
            json=test_data,
            verify=False,  # Skip SSL verification for local testing
            timeout=30
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Video save successful!")
            print(f"   Final Video URL: {result['final_video_url']}")
            print(f"   Video ID: {result['video_id']}")
            print(f"   Filename: {result['filename']}")
        else:
            print("❌ Video save failed!")
            try:
                error = response.json()
                print(f"   Error: {error.get('detail', 'Unknown error')}")
            except:
                print(f"   Error: {response.text}")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def test_supported_models():
    """Test the supported models endpoint"""
    
    print("\n🤖 Testing Supported Models API")
    print("=" * 50)
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/isl-video-generation/supported-models",
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Supported models retrieved!")
            print(f"   Models: {result['supported_models']}")
            print(f"   Total Count: {result['total_count']}")
        else:
            print(f"❌ Failed to get supported models: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_health_check():
    """Test the health check endpoint"""
    
    print("\n🏥 Testing Health Check API")
    print("=" * 50)
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/isl-video-generation/health",
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Health check successful!")
            print(f"   Status: {result['status']}")
            print(f"   Service: {result['service']}")
            print(f"   FFmpeg Available: {result['ffmpeg_available']}")
            print(f"   Directories OK: {result['directories_ok']}")
            print(f"   Supported Models: {result['supported_models']}")
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
    test_supported_models()
    
    # Test video generation and save
    temp_video_id = test_generate_isl_video()
    if temp_video_id:
        # Wait a moment before saving
        print("\n⏳ Waiting 2 seconds before saving...")
        time.sleep(2)
        test_save_isl_video(temp_video_id)
    
    print("\n🎉 Testing completed!")