#!/usr/bin/env python3
"""
Additional Edge Case Tests for Motion Graphics API
"""

import requests
import json
import tempfile
import os
from pathlib import Path

# Get backend URL
def get_backend_url():
    frontend_env_path = Path("/app/frontend/.env")
    if frontend_env_path.exists():
        with open(frontend_env_path, 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    return "http://localhost:8001"

BASE_URL = get_backend_url()
API_URL = f"{BASE_URL}/api"

def test_invalid_file_upload():
    """Test upload with invalid file type"""
    print("Testing invalid file upload...")
    
    # Create a text file (invalid type)
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".txt")
    temp_file.write(b"This is not a video file")
    temp_file.close()
    
    upload_data = {
        'title': 'Invalid File Test',
        'description': 'Testing invalid file type',
        'category': 'transitions',
        'tags': '[]',
        'format': 'TXT'
    }
    
    try:
        with open(temp_file.name, 'rb') as f:
            files = {'file': ('test.txt', f, 'text/plain')}
            response = requests.post(f"{API_URL}/motion-graphics", data=upload_data, files=files)
        
        os.unlink(temp_file.name)
        
        if response.status_code == 400:
            print("✅ Invalid file upload correctly rejected")
        else:
            print(f"❌ Expected 400, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

def test_invalid_category():
    """Test upload with invalid category"""
    print("Testing invalid category...")
    
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    temp_file.write(b"FAKE_VIDEO_CONTENT")
    temp_file.close()
    
    upload_data = {
        'title': 'Invalid Category Test',
        'description': 'Testing invalid category',
        'category': 'invalid_category',
        'tags': '[]',
        'format': 'MP4'
    }
    
    try:
        with open(temp_file.name, 'rb') as f:
            files = {'file': ('test.mp4', f, 'video/mp4')}
            response = requests.post(f"{API_URL}/motion-graphics", data=upload_data, files=files)
        
        os.unlink(temp_file.name)
        
        if response.status_code == 400:
            print("✅ Invalid category correctly rejected")
        else:
            print(f"❌ Expected 400, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

def test_nonexistent_file_download():
    """Test download of non-existent file"""
    print("Testing non-existent file download...")
    
    try:
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(f"{API_URL}/motion-graphics/{fake_id}/download")
        
        if response.status_code == 404:
            print("✅ Non-existent file download correctly returns 404")
        else:
            print(f"❌ Expected 404, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

def test_pagination():
    """Test pagination parameters"""
    print("Testing pagination...")
    
    try:
        response = requests.get(f"{API_URL}/motion-graphics?limit=5&offset=0")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"✅ Pagination works, returned {len(data)} items")
            else:
                print(f"❌ Expected list, got {type(data)}")
        else:
            print(f"❌ Expected 200, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

def test_complex_search():
    """Test complex search scenarios"""
    print("Testing complex search...")
    
    try:
        # Test empty search
        response = requests.get(f"{API_URL}/motion-graphics?search=")
        if response.status_code == 200:
            print("✅ Empty search handled correctly")
        
        # Test special characters in search
        response = requests.get(f"{API_URL}/motion-graphics?search=@#$%")
        if response.status_code == 200:
            print("✅ Special characters in search handled correctly")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("ADDITIONAL EDGE CASE TESTS")
    print("=" * 50)
    
    test_invalid_file_upload()
    test_invalid_category()
    test_nonexistent_file_download()
    test_pagination()
    test_complex_search()
    
    print("\nEdge case testing completed!")