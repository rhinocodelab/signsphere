#!/usr/bin/env python3
"""
Test script for speech recognition endpoint
"""

import requests
import json
import os
from pathlib import Path

def test_speech_recognition():
    """Test the speech recognition endpoint"""
    
    # API endpoint
    base_url = "https://localhost:5001/api/v1/speech-recognition"
    
    # Test data
    test_audio_file = "test_audio.wav"  # You'll need to provide a test audio file
    language_code = "hi-IN"  # Hindi
    
    # Check if test audio file exists
    if not os.path.exists(test_audio_file):
        print(f"❌ Test audio file '{test_audio_file}' not found.")
        print("Please provide a test audio file to test the endpoint.")
        return
    
    try:
        # Test 1: Get supported languages
        print("🔍 Testing supported languages endpoint...")
        response = requests.get(f"{base_url}/supported-languages", verify=False)
        if response.status_code == 200:
            languages = response.json()
            print(f"✅ Supported languages: {languages['total_count']} languages")
            print(f"   Sample: {list(languages['supported_languages'].keys())[:5]}")
        else:
            print(f"❌ Failed to get supported languages: {response.status_code}")
        
        # Test 2: Get supported formats
        print("\n🔍 Testing supported formats endpoint...")
        response = requests.get(f"{base_url}/supported-formats", verify=False)
        if response.status_code == 200:
            formats = response.json()
            print(f"✅ Supported formats: {formats['supported_formats']}")
        else:
            print(f"❌ Failed to get supported formats: {response.status_code}")
        
        # Test 3: Transcribe audio
        print(f"\n🔍 Testing audio transcription with {test_audio_file}...")
        
        with open(test_audio_file, 'rb') as f:
            files = {'file': (test_audio_file, f, 'audio/wav')}
            data = {
                'language_code': language_code,
                'enable_automatic_punctuation': True,
                'enable_word_time_offsets': True
            }
            
            response = requests.post(
                f"{base_url}/transcribe",
                files=files,
                data=data,
                verify=False
            )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Transcription successful!")
            print(f"   Transcript: {result['transcript']}")
            print(f"   Confidence: {result['confidence']:.2f}")
            print(f"   Language: {result['language_code']}")
            print(f"   Duration: {result['duration']:.2f}s")
            print(f"   Word count: {result['word_count']}")
            print(f"   Cached: {result['cached']}")
            if result.get('audio_info'):
                audio_info = result['audio_info']
                print(f"   Audio Info: {audio_info['sample_rate']}Hz, {audio_info['channels']} channels, {audio_info['file_extension']} format")
        else:
            print(f"❌ Transcription failed: {response.status_code}")
            print(f"   Error: {response.text}")
        
        # Test 4: Get cache stats
        print("\n🔍 Testing cache stats endpoint...")
        response = requests.get(f"{base_url}/cache/stats", verify=False)
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Cache stats: {stats['total_files']} files, {stats['total_size_mb']} MB")
        else:
            print(f"❌ Failed to get cache stats: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def create_sample_audio():
    """Create a sample audio file for testing"""
    try:
        import numpy as np
        import soundfile as sf
        
        # Generate a simple sine wave as test audio
        sample_rate = 44100
        duration = 2  # seconds
        frequency = 440  # A4 note
        
        t = np.linspace(0, duration, int(sample_rate * duration), False)
        audio = np.sin(2 * np.pi * frequency * t) * 0.3
        
        # Save as WAV file
        sf.write("test_audio.wav", audio, sample_rate)
        print("✅ Created sample audio file: test_audio.wav")
        
    except ImportError:
        print("❌ numpy and soundfile required to create sample audio")
        print("   Install with: pip install numpy soundfile")
    except Exception as e:
        print(f"❌ Failed to create sample audio: {e}")

if __name__ == "__main__":
    print("🧪 Speech Recognition API Test")
    print("=" * 50)
    
    # Check if test audio exists, create if not
    if not os.path.exists("test_audio.wav"):
        print("Creating sample audio file...")
        create_sample_audio()
    
    # Run tests
    test_speech_recognition()
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")