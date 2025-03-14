import pytest
import sys
import os
from unittest.mock import patch, MagicMock
from services.googleplaces_service import GooglePlacesService

# Add the parent directory to the path so we can import modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

@pytest.fixture
def google_places_service():
    """Create a GooglePlacesService with a mock API key"""
    with patch.dict('os.environ', {'GOOGLE_PLACES_API_KEY': 'test_api_key'}):
        service = GooglePlacesService()
        return service

class TestNearbySearch:
    @patch('requests.post')
    def test_nearby_search_success(self, mock_post, google_places_service):
        """Test nearby_search with a successful API response"""
        # Create a mock response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "places": [
                {
                    "id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
                    "displayName": {"text": "Test Place"},
                    "formattedAddress": "123 Test St, Testville",
                    "location": {"latitude": 40.7128, "longitude": -74.0060},
                    "rating": 4.5,
                    "userRatingCount": 100,
                    "types": ["tourist_attraction", "point_of_interest"],
                    "primaryType": "tourist_attraction",
                    "photos": [{"name": "photo-reference-123"}],
                    "websiteUri": "https://example.com",
                    "businessStatus": "OPERATIONAL"
                }
            ]
        }
        mock_post.return_value = mock_response
        
        # Call the method
        results = google_places_service.nearby_search(
            latitude=40.7128,
            longitude=-74.0060,
            radius=1000,
            type="tourist_attraction"
        )
        
        # Verify the result
        assert len(results) == 1
        assert results[0].place_id == "ChIJN1t_tDeuEmsRUsoyG83frY4"
        assert results[0].name == "Test Place"
        assert results[0].rating == 4.5
        assert results[0].photo_name == "photo-reference-123"
        
        # Verify the correct API call was made
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert kwargs['json']['includedTypes'] == ['tourist_attraction']
        assert kwargs['json']['locationRestriction']['circle']['center']['latitude'] == 40.7128
        assert 'X-Goog-Api-Key' in kwargs['headers']

    @patch('requests.post')
    def test_nearby_search_error_handling(self, mock_post, google_places_service):
        """Test nearby_search error handling"""
        # Create a mock error response
        mock_post.side_effect = Exception("API Error")
        
        # Call the method and expect it to raise the exception
        with pytest.raises(Exception) as excinfo:
            google_places_service.nearby_search(
                latitude=40.7128,
                longitude=-74.0060
            )
        
        # Verify the error was caught and re-raised
        assert "API Error" in str(excinfo.value)

class TestGetPlaceDetails:
    @patch('requests.get')
    def test_get_place_details_success(self, mock_get, google_places_service):
        """Test get_place_details with a successful API response"""
        # Create a mock response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
            "displayName": {"text": "Test Place"},
            "formattedAddress": "123 Test St, Testville",
            "location": {"latitude": 40.7128, "longitude": -74.0060},
            "rating": 4.5,
            "userRatingCount": 100,
            "types": ["tourist_attraction", "point_of_interest", "cuisine.italian"],
            "primaryType": "tourist_attraction",
            "photos": [{"name": "photo-reference-123"}],
            "websiteUri": "https://example.com",
            "regularOpeningHours": {
                "weekdayDescriptions": [
                    "Monday: 9:00 AM – 5:00 PM",
                    "Tuesday: 9:00 AM – 5:00 PM"
                ]
            }
        }
        mock_get.return_value = mock_response
        
        # Call the method
        result = google_places_service.get_place_details("ChIJN1t_tDeuEmsRUsoyG83frY4")
        
        # Verify the result
        assert result["place_id"] == "ChIJN1t_tDeuEmsRUsoyG83frY4"
        assert result["name"] == "Test Place"
        assert result["coordinates"]["lat"] == 40.7128
        assert result["coordinates"]["lng"] == -74.0060
        assert "Monday: 9:00 AM – 5:00 PM" in result["opening_hours"]
        assert "Italian" in result["cuisine"]
        
        # Verify the correct API call was made
        mock_get.assert_called_once()
        args, kwargs = mock_get.call_args
        assert 'X-Goog-Api-Key' in kwargs['headers']

    @patch('requests.get')
    def test_get_place_details_not_google_id(self, mock_get, google_places_service):
        """Test get_place_details with a non-Google place ID"""
        result = google_places_service.get_place_details("non-google-id")
        
        # Should return None without making an API call
        assert result is None
        mock_get.assert_not_called()

class TestGetPlacePhoto:
    @patch('requests.get')
    def test_get_place_photo_success(self, mock_get, google_places_service):
        """Test get_place_photo with a successful API response"""
        # Create a mock response with a redirect header
        mock_response = MagicMock()
        mock_response.status_code = 302
        mock_response.headers = {'Location': 'https://example.com/photo.jpg'}
        mock_get.return_value = mock_response
        
        # Call the method
        result = google_places_service.get_place_photo("photo-reference-123")
        
        # Verify the result is the photo URL
        assert result == 'https://example.com/photo.jpg'
        
        # Verify the correct API call was made
        mock_get.assert_called_once()
        args, kwargs = mock_get.call_args
        assert 'key' in kwargs['params']
        assert kwargs['params']['maxWidthPx'] == 400

class TestTextSearch:
    @patch('requests.post')
    def test_text_search_success(self, mock_post, google_places_service):
        """Test text_search with a successful API response"""
        # Create a mock response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "places": [
                {
                    "id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
                    "displayName": {"text": "Pizza Place"},
                    "formattedAddress": "123 Pizza St, New York",
                    "location": {"latitude": 40.7128, "longitude": -74.0060},
                    "rating": 4.2,
                    "userRatingCount": 500,
                    "types": ["restaurant", "food"],
                    "primaryType": "restaurant",
                    "photos": [{"name": "photo-reference-123"}],
                    "websiteUri": "https://example.com/pizza",
                    "editorialSummary": {"text": "Great pizza place"}
                }
            ]
        }
        mock_post.return_value = mock_response
        
        # Call the method
        results = google_places_service.text_search(
            query="pizza in new york",
            latitude=40.7128,
            longitude=-74.0060,
            radius=2000
        )
        
        # Verify the result
        assert len(results) == 1
        assert results[0].place_id == "ChIJN1t_tDeuEmsRUsoyG83frY4"
        assert results[0].name == "Pizza Place"
        assert results[0].rating == 4.2
        assert results[0].description == "Great pizza place"
        
        # Verify the correct API call was made
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert kwargs['json']['textQuery'] == "pizza in new york"
        assert kwargs['json']['locationBias']['circle']['center']['latitude'] == 40.7128
        assert 'X-Goog-Api-Key' in kwargs['headers']

class TestBatchOperations:
    @patch.object(GooglePlacesService, 'get_place_details')
    def test_batch_get_place_details(self, mock_get_place_details, google_places_service):
        """Test batch_get_place_details calling get_place_details for each ID"""
        # Set up mock responses
        mock_get_place_details.side_effect = [
            {"place_id": "id1", "name": "Place 1", "photo_name": "photo1"},
            {"place_id": "id2", "name": "Place 2", "photo_name": "photo2"},
            None  # Simulate a failed request
        ]
        
        # Call the method
        results = google_places_service.batch_get_place_details(["id1", "id2", "id3"])
        
        # Verify the results
        assert len(results) == 2
        assert results["id1"]["name"] == "Place 1"
        assert results["id2"]["name"] == "Place 2"
        assert "id3" not in results
        
        # Verify get_place_details was called for each ID
        assert mock_get_place_details.call_count == 3

    @patch.object(GooglePlacesService, 'get_place_photo')
    def test_batch_get_photos(self, mock_get_place_photo, google_places_service):
        """Test batch_get_photos enriching place details with photo URLs"""
        # Set up mock response
        mock_get_place_photo.return_value = "https://example.com/photo.jpg"
        
        # Create test data
        place_details = {
            "id1": {"place_id": "id1", "name": "Place 1", "photo_name": "photo1"},
            "id2": {"place_id": "id2", "name": "Place 2", "photo_name": None}
        }
        
        # Call the method
        results = google_places_service.batch_get_photos(place_details)
        
        # Verify the results
        assert results["id1"]["image_url"] == "https://example.com/photo.jpg"
        assert "image_url" not in results["id2"]
        
        # Verify get_place_photo was called only for the place with a photo name
        mock_get_place_photo.assert_called_once_with("photo1") 