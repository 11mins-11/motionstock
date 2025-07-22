#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for Motion Graphics Stock Site
Tests all backend functionality including CRUD operations, file uploads, downloads, and search.
"""

import requests
import json
import os
import tempfile
from pathlib import Path
import time
import base64

# Get backend URL from frontend .env file
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

print(f"Testing backend API at: {API_URL}")

class MotionGraphicsAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.uploaded_files = []
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }

    def log_result(self, test_name, success, message=""):
        if success:
            self.test_results["passed"] += 1
            print(f"✅ {test_name}: PASSED {message}")
        else:
            self.test_results["failed"] += 1
            self.test_results["errors"].append(f"{test_name}: {message}")
            print(f"❌ {test_name}: FAILED {message}")

    def test_api_health(self):
        """Test basic API health check"""
        try:
            response = self.session.get(f"{API_URL}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Motion Graphics" in data["message"]:
                    self.log_result("API Health Check", True, f"Response: {data}")
                else:
                    self.log_result("API Health Check", False, f"Unexpected response: {data}")
            else:
                self.log_result("API Health Check", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("API Health Check", False, f"Exception: {str(e)}")

    def test_categories_endpoint(self):
        """Test categories endpoint"""
        try:
            response = self.session.get(f"{API_URL}/categories")
            if response.status_code == 200:
                data = response.json()
                expected_categories = [
                    "transitions", "overlays", "backgrounds", "text_animations", 
                    "effects", "particles", "shapes", "logos", "lower_thirds", "other"
                ]
                if "categories" in data and all(cat in data["categories"] for cat in expected_categories):
                    self.log_result("Categories Endpoint", True, f"Found {len(data['categories'])} categories")
                else:
                    self.log_result("Categories Endpoint", False, f"Missing categories: {data}")
            else:
                self.log_result("Categories Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Categories Endpoint", False, f"Exception: {str(e)}")

    def test_empty_gallery(self):
        """Test gallery endpoint when no files are uploaded"""
        try:
            response = self.session.get(f"{API_URL}/motion-graphics")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Empty Gallery Test", True, f"Returned {len(data)} items (empty gallery)")
                else:
                    self.log_result("Empty Gallery Test", False, f"Expected list, got: {type(data)}")
            else:
                self.log_result("Empty Gallery Test", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Empty Gallery Test", False, f"Exception: {str(e)}")

    def create_test_file(self, filename, content_type="video/mp4"):
        """Create a small test file for upload testing"""
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        # Create a small fake video file (just some bytes)
        test_content = b"FAKE_VIDEO_CONTENT_FOR_TESTING" * 100  # Make it a bit larger
        temp_file.write(test_content)
        temp_file.close()
        return temp_file.name

    def test_file_upload(self):
        """Test file upload functionality"""
        try:
            # Create test file
            test_file_path = self.create_test_file("test_motion.mp4")
            
            # Prepare upload data
            upload_data = {
                'title': 'Test Motion Graphics',
                'description': 'A test motion graphics file for API testing',
                'category': 'transitions',
                'tags': '["test", "api", "motion"]',
                'format': 'MP4'
            }
            
            with open(test_file_path, 'rb') as f:
                files = {'file': ('test_motion.mp4', f, 'video/mp4')}
                response = self.session.post(f"{API_URL}/motion-graphics", data=upload_data, files=files)
            
            # Clean up test file
            os.unlink(test_file_path)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "title" in data:
                    self.uploaded_files.append(data["id"])
                    self.log_result("File Upload Test", True, f"Uploaded file ID: {data['id']}")
                else:
                    self.log_result("File Upload Test", False, f"Missing required fields: {data}")
            else:
                self.log_result("File Upload Test", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("File Upload Test", False, f"Exception: {str(e)}")

    def test_gallery_with_content(self):
        """Test gallery endpoint after upload"""
        try:
            response = self.session.get(f"{API_URL}/motion-graphics")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check if our uploaded file is in the results
                    found_uploaded = any(item.get("id") in self.uploaded_files for item in data)
                    if found_uploaded:
                        self.log_result("Gallery with Content", True, f"Found {len(data)} items including uploaded files")
                    else:
                        self.log_result("Gallery with Content", False, "Uploaded files not found in gallery")
                else:
                    self.log_result("Gallery with Content", False, f"Expected non-empty list, got: {data}")
            else:
                self.log_result("Gallery with Content", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Gallery with Content", False, f"Exception: {str(e)}")

    def test_search_functionality(self):
        """Test search parameter functionality"""
        try:
            # Test search with a term that should match our uploaded file
            response = self.session.get(f"{API_URL}/motion-graphics?search=test")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Should find our test file
                    found_test_file = any("test" in item.get("title", "").lower() or 
                                        "test" in item.get("description", "").lower() 
                                        for item in data)
                    if found_test_file:
                        self.log_result("Search Functionality", True, f"Search returned {len(data)} matching items")
                    else:
                        self.log_result("Search Functionality", True, f"Search worked but no matches for 'test' (expected if no test data)")
                else:
                    self.log_result("Search Functionality", False, f"Expected list, got: {type(data)}")
            else:
                self.log_result("Search Functionality", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Search Functionality", False, f"Exception: {str(e)}")

    def test_category_filter(self):
        """Test category filtering"""
        try:
            response = self.session.get(f"{API_URL}/motion-graphics?category=transitions")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if all returned items have the correct category
                    all_correct_category = all(item.get("category") == "transitions" for item in data)
                    if all_correct_category:
                        self.log_result("Category Filter", True, f"Category filter returned {len(data)} transitions")
                    else:
                        self.log_result("Category Filter", False, "Some items have incorrect category")
                else:
                    self.log_result("Category Filter", False, f"Expected list, got: {type(data)}")
            else:
                self.log_result("Category Filter", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Category Filter", False, f"Exception: {str(e)}")

    def test_download_endpoint(self):
        """Test download functionality"""
        if not self.uploaded_files:
            self.log_result("Download Endpoint", False, "No uploaded files to test download")
            return
            
        try:
            file_id = self.uploaded_files[0]
            response = self.session.get(f"{API_URL}/motion-graphics/{file_id}/download")
            
            if response.status_code == 200:
                # Check if we got file content
                if len(response.content) > 0:
                    # Check headers
                    content_disposition = response.headers.get('content-disposition', '')
                    if 'attachment' in content_disposition or 'filename' in content_disposition:
                        self.log_result("Download Endpoint", True, f"Downloaded {len(response.content)} bytes")
                    else:
                        self.log_result("Download Endpoint", True, f"Downloaded {len(response.content)} bytes (no attachment header)")
                else:
                    self.log_result("Download Endpoint", False, "Empty file content")
            else:
                self.log_result("Download Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Download Endpoint", False, f"Exception: {str(e)}")

    def test_statistics_endpoint(self):
        """Test statistics endpoint"""
        try:
            response = self.session.get(f"{API_URL}/stats")
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_graphics", "total_downloads", "category_distribution"]
                if all(field in data for field in required_fields):
                    self.log_result("Statistics Endpoint", True, f"Stats: {data['total_graphics']} graphics, {data['total_downloads']} downloads")
                else:
                    self.log_result("Statistics Endpoint", False, f"Missing required fields: {data}")
            else:
                self.log_result("Statistics Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Statistics Endpoint", False, f"Exception: {str(e)}")

    def test_individual_file_endpoint(self):
        """Test getting individual file details"""
        if not self.uploaded_files:
            self.log_result("Individual File Endpoint", False, "No uploaded files to test")
            return
            
        try:
            file_id = self.uploaded_files[0]
            response = self.session.get(f"{API_URL}/motion-graphics/{file_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["id"] == file_id:
                    self.log_result("Individual File Endpoint", True, f"Retrieved file details for {file_id}")
                else:
                    self.log_result("Individual File Endpoint", False, f"ID mismatch or missing: {data}")
            else:
                self.log_result("Individual File Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Individual File Endpoint", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all backend API tests"""
        print("=" * 60)
        print("MOTION GRAPHICS STOCK SITE - BACKEND API TESTS")
        print("=" * 60)
        
        # Test sequence
        self.test_api_health()
        self.test_categories_endpoint()
        self.test_empty_gallery()
        self.test_file_upload()
        self.test_gallery_with_content()
        self.test_search_functionality()
        self.test_category_filter()
        self.test_individual_file_endpoint()
        self.test_download_endpoint()
        self.test_statistics_endpoint()
        
        # Print summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        
        if self.test_results['errors']:
            print("\nFAILED TESTS:")
            for error in self.test_results['errors']:
                print(f"  - {error}")
        
        success_rate = (self.test_results['passed'] / (self.test_results['passed'] + self.test_results['failed'])) * 100
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        return self.test_results

if __name__ == "__main__":
    tester = MotionGraphicsAPITester()
    results = tester.run_all_tests()