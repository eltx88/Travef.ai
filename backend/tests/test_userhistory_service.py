import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime

# Only import what we're actually using
from services.userhistory_service import UserHistoryService

@pytest.fixture
def user_history_service():
    """Create a UserHistoryService with mocked dependencies"""
    with patch('services.userhistory_service.FirebaseService', autospec=True) as mock_firebase_base:
        # Create service instance
        service = UserHistoryService()
        
        # Mock POI service
        service.poi_service = MagicMock()
        service.poi_service.get_points = AsyncMock()
        service.poi_service.get_point = AsyncMock()
        service.poi_service.create_or_get_point = AsyncMock()
        
        # Mock the db property
        service.db = MagicMock()
        
        # Mock document and collection references
        mock_doc_ref = MagicMock()
        mock_collection_ref = MagicMock()
        mock_subcollection_ref = MagicMock()
        
        # Set up the chain of references
        service.get_collection_ref = MagicMock(return_value=mock_collection_ref)
        mock_collection_ref.document = MagicMock(return_value=mock_doc_ref)
        mock_doc_ref.collection = MagicMock(return_value=mock_subcollection_ref)
        
        # Mock document creation with auto ID
        mock_new_doc_ref = MagicMock()
        mock_new_doc_ref.id = "new_doc_id"
        mock_subcollection_ref.document = MagicMock(return_value=mock_new_doc_ref)
        
        yield service

class TestSavePOI:
    @pytest.mark.asyncio
    async def test_save_new_poi_basic(self, user_history_service):
        """Test the basic flow of saving a new POI to a user's history"""
        # Setup test data
        user_id = "test_user_123"
        point_id = "poi_123"
        city = "New York"
        
        # Setup query for existing POI check (returns empty list)
        mock_query = MagicMock()
        mock_query.get.return_value = []  # No existing POI
        
        user_history_service.get_collection_ref().document().collection().where = MagicMock(return_value=mock_query)
        mock_query.limit = MagicMock(return_value=mock_query)
        
        # Call the method
        result = await user_history_service.save_poi(user_id, point_id, city)
        
        # Verify document was created and set was called
        assert result == "new_doc_id"
        
        # Verify the document.set method was called with correct data
        user_history_service.get_collection_ref().document().collection().document().set.assert_called_once()
        
        # Get the data that was passed to set()
        set_call_args = user_history_service.get_collection_ref().document().collection().document().set.call_args[0][0]
        assert set_call_args['pointID'] == point_id
        assert set_call_args['status'] is True
        assert set_call_args['city'] == city.lower()

    @pytest.mark.asyncio
    async def test_save_existing_poi(self, user_history_service):
        """Test saving a POI that already exists but with status=False"""
        # Setup test data
        user_id = "test_user_123"
        point_id = "poi_123" 
        city = "New York"
        
        # Mock the existing POI document
        mock_doc = MagicMock()
        mock_doc.id = "existing_poi_id"
        mock_doc.to_dict = MagicMock(return_value={'status': False})
        mock_doc.get = MagicMock(side_effect=lambda field: False if field == 'status' else None)
        mock_doc.reference = MagicMock()
        
        # Setup query that returns existing POI
        mock_query = MagicMock()
        mock_query.get.return_value = [mock_doc]
        
        user_history_service.get_collection_ref().document().collection().where = MagicMock(return_value=mock_query)
        mock_query.limit = MagicMock(return_value=mock_query)
        
        # Call the method
        result = await user_history_service.save_poi(user_id, point_id, city)
        
        # Verify the result and that update was called
        assert result == "existing_poi_id"
        mock_doc.reference.update.assert_called_once()
        
        # Verify correct data was passed to update
        update_call_args = mock_doc.reference.update.call_args[0][0]
        assert update_call_args['status'] is True
        assert 'createdDT' in update_call_args

class TestGetSavedPOIs:
    @pytest.mark.asyncio
    async def test_get_saved_pois(self, user_history_service):
        """Test retrieving saved POIs for a user"""
        # Setup test data
        user_id = "test_user_123"
        city = "New York"
        
        # Create mock document for saved POI
        mock_doc = MagicMock()
        mock_doc.id = "saved_poi_id"
        mock_doc.get = MagicMock(side_effect=lambda field: {
            'pointID': 'poi_123',
            'status': True,
            'createdDT': datetime.now(),
            'city': city.lower()
        }.get(field))
        
        # Setup query that returns saved POI
        mock_query = MagicMock()
        mock_query.get.return_value = [mock_doc]
        
        # Setup where chain
        mock_where = MagicMock(return_value=mock_query)
        mock_where2 = MagicMock(return_value=mock_query)
        user_history_service.get_collection_ref().document().collection().where = mock_where
        mock_query.where = mock_where2
        
        # Call the method
        result = await user_history_service.get_saved_pois(user_id, city)
        
        # Verify the result
        assert len(result) == 1
        assert result[0]['id'] == "saved_poi_id"
        assert result[0]['pointID'] == "poi_123"
        assert result[0]['city'] == city.lower()
        
        # Verify the correct queries were made
        mock_where.assert_called_once_with('status', '==', True)
        mock_where2.assert_called_once_with('city', '==', city.lower())

    @pytest.mark.asyncio
    async def test_get_multiple_saved_pois_for_city(self, user_history_service):
        """Test retrieving multiple saved POIs for a user in a specific city"""
        # Setup test data
        user_id = "test_user_123"
        city = "New York"
        
        # Create data for multiple saved POIs
        poi_data = [
            {
                'pointID': 'poi_123',
                'status': True,
                'createdDT': datetime(2023, 1, 15, 12, 0),
                'city': city.lower()
            },
            {
                'pointID': 'poi_456',
                'status': True,
                'createdDT': datetime(2023, 2, 20, 14, 30),
                'city': city.lower()
            },
            {
                'pointID': 'poi_789',
                'status': True,
                'createdDT': datetime(2023, 3, 10, 9, 45),
                'city': city.lower()
            }
        ]
        
        # Create mock documents - fixing the closure issue
        mock_docs = []
        for i, data in enumerate(poi_data):
            mock_doc = MagicMock()
            mock_doc.id = f"doc_{i}"
            
            # Create a proper closure by using a factory function
            def create_getter(data_dict):
                return lambda field: data_dict.get(field)
            
            # Use the factory function to create a unique getter for each document
            mock_doc.get = MagicMock(side_effect=create_getter(data.copy()))
            mock_docs.append(mock_doc)
        
        # Setup query that returns all saved POIs
        mock_query = MagicMock()
        mock_query.get.return_value = mock_docs
        
        # Setup where chain
        mock_where = MagicMock(return_value=mock_query)
        mock_where2 = MagicMock(return_value=mock_query)
        user_history_service.get_collection_ref().document().collection().where = mock_where
        mock_query.where = mock_where2
        
        # Call the method
        result = await user_history_service.get_saved_pois(user_id, city)
        
        # Print results for debugging
        print(f"Result point IDs: {[poi['pointID'] for poi in result]}")
        
        # Verify the result length
        assert len(result) == 3, "Should return all 3 saved POIs"
        
        # Create a set of pointIDs from the result
        result_point_ids = {poi['pointID'] for poi in result}
        # Create a set of expected pointIDs
        expected_point_ids = {poi['pointID'] for poi in poi_data}
        
        # Verify all pointIDs are present
        assert result_point_ids == expected_point_ids, "Result should contain exactly the expected pointIDs"
        
        # For each POI in the result, verify the data except for the ID
        for poi in result:
            # Find the matching expected data
            expected = next(item for item in poi_data if item['pointID'] == poi['pointID'])
            
            # Verify critical fields match
            assert poi['status'] == expected['status']
            assert poi['city'] == expected['city']
            assert poi['createdDT'] == expected['createdDT']
            
            # Verify ID exists but don't check its specific value
            assert 'id' in poi
        
        # Verify the correct queries were made
        mock_where.assert_called_once_with('status', '==', True)
        mock_where2.assert_called_once_with('city', '==', city.lower())

class TestUnsavePOI:
    @pytest.mark.asyncio
    async def test_save_then_unsave_poi(self, user_history_service):
        """Test the workflow of saving a POI and then unsaving it"""
        # Setup test data
        user_id = "test_user_123"
        point_id = "poi_123"
        city = "New York"
        
        # Step 1: First save the POI
        
        # Mock for saving: no existing POI
        mock_save_query = MagicMock()
        mock_save_query.get.return_value = []
        mock_save_query.limit = MagicMock(return_value=mock_save_query)
        
        # Setup document creation
        mock_new_doc_ref = MagicMock()
        mock_new_doc_ref.id = "saved_poi_id"
        
        # Configure mocks for saving
        user_history_service.get_collection_ref().document().collection().where = MagicMock(return_value=mock_save_query)
        user_history_service.get_collection_ref().document().collection().document = MagicMock(return_value=mock_new_doc_ref)
        
        # Save the POI
        save_result = await user_history_service.save_poi(user_id, point_id, city)
        assert save_result == "saved_poi_id"
        
        # Verify the POI was saved with status=True
        set_call_args = mock_new_doc_ref.set.call_args[0][0]
        assert set_call_args['status'] is True
        
        # Step 2: Now unsave the POI
        
        # Reset the batch mock to ensure it's clean
        user_history_service.db.batch = MagicMock()
        batch_mock = MagicMock()
        user_history_service.db.batch.return_value = batch_mock
        
        # Create a mock document that will be found when querying for the POI to unsave
        mock_existing_doc = MagicMock()
        mock_existing_doc.id = "saved_poi_id"
        mock_existing_doc.reference = MagicMock()
        
        # Mock the query for finding the POI
        mock_unsave_query = MagicMock()
        mock_unsave_query.get.return_value = [mock_existing_doc]
        mock_unsave_query.limit = MagicMock(return_value=mock_unsave_query)
        user_history_service.get_collection_ref().document().collection().where = MagicMock(return_value=mock_unsave_query)
        
        # Unsave the POI
        await user_history_service.unsave_poi(user_id, [point_id])
        
        # Verify the batch.update was called
        batch_mock.update.assert_called_once()
        
        # Check that the update contained status=False, but don't try to compare mock objects
        update_args = batch_mock.update.call_args[0]
        # First arg should be a document reference, but don't compare it directly
        assert isinstance(update_args[0], MagicMock)
        # Second arg should contain status=False
        assert update_args[1]['status'] is False
        assert 'updatedDT' in update_args[1]
        
        # Verify the batch was committed
        batch_mock.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_unsave_multiple_pois(self, user_history_service):
        """Test unsaving multiple POIs in a single operation"""
        # Setup test data
        user_id = "test_user_123"
        point_ids = ["poi_123", "poi_456", "poi_789"]
        
        # Reset the batch mock to ensure it's clean
        user_history_service.db.batch = MagicMock()
        batch_mock = MagicMock()
        user_history_service.db.batch.return_value = batch_mock
        
        # Create a simpler mocking strategy - just return a document for each query
        # without trying to match pointIDs (which complicates things)
        mock_query = MagicMock()
        mock_doc = MagicMock()
        mock_doc.reference = MagicMock()
        mock_query.get.return_value = [mock_doc]
        user_history_service.get_collection_ref().document().collection().where = MagicMock(return_value=mock_query)
        
        # Unsave multiple POIs
        await user_history_service.unsave_poi(user_id, point_ids)
        
        # Verify the batch.update was called for each POI
        assert batch_mock.update.call_count == 3
        
        # Verify updates were made with status=False
        for call in batch_mock.update.call_args_list:
            args = call[0]
            assert args[1]['status'] is False
            assert 'updatedDT' in args[1]
        
        # Verify the batch was committed once
        batch_mock.commit.assert_called_once()

class TestIntegrationFlow:
    @pytest.mark.asyncio
    async def test_full_integration_poi_to_history(self, user_history_service):
        """Test the complete flow from creating a POI to saving it in user history"""
        # Setup test data
        user_id = "test_user_123"
        city = "New York"
        
        # Create a POI model to save
        from models.pointofinterest import PointOfInterestResponse, Coordinates
        poi_data = PointOfInterestResponse(
            id="",  # Empty as it will be assigned by the service
            place_id="google_place_123",
            name="Empire State Building",
            coordinates=Coordinates(lat=40.7484, lng=-73.9857),
            address="350 Fifth Avenue, New York, NY 10118",
            city=city,
            country="USA",
            type="attraction",
            categories=["landmark", "tourist_attraction"],
            cuisine=None,
            description="Famous skyscraper in NYC",
            wikidata_id=None,
            image_url="https://example.com/empire.jpg",
            website="https://www.esbnyc.com/",
            phone=None,
            email=None,
            opening_hours=None,
            rating=4.8,
            user_ratings_total=10000,
            created_at=None,
            updated_at=None
        )
        
        # Mock the POI service create_or_get_point to return a specific ID
        poi_id = "new_poi_123"
        user_history_service.poi_service.create_or_get_point.return_value = poi_id
        
        # Setup for saving POI - mock the query and document
        mock_query = MagicMock()
        mock_query.get.return_value = []  # No existing POI
        mock_query.limit = MagicMock(return_value=mock_query)
        user_history_service.get_collection_ref().document().collection().where = MagicMock(return_value=mock_query)
        
        # Ensure document() returns our mock with new_doc_id
        mock_new_doc_ref = MagicMock()
        mock_new_doc_ref.id = "saved_history_id_123"
        user_history_service.get_collection_ref().document().collection().document.return_value = mock_new_doc_ref
        
        # Step 1: Create/get the POI
        created_poi_id = await user_history_service.poi_service.create_or_get_point(poi_data)
        
        # Step 2: Save the POI to user history
        saved_history_id = await user_history_service.save_poi(user_id, created_poi_id, city)
        
        # Verify the results
        assert created_poi_id == poi_id
        assert saved_history_id == "saved_history_id_123"
        
        # Verify the POI service was called with the correct model
        user_history_service.poi_service.create_or_get_point.assert_called_once_with(poi_data)
        
        # Verify the correct data was saved to user history
        set_call_args = user_history_service.get_collection_ref().document().collection().document().set.call_args[0][0]
        assert set_call_args['pointID'] == poi_id
        assert set_call_args['status'] is True
        assert set_call_args['city'] == city.lower()

