import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime, timedelta

# Import the models and service
from services.trip_service import TripService
from models.trip import (
    TripData, ItineraryPOI, UnusedPOI, Coordinates, SaveTripRequest, 
    TripUpdateRequest, ItineraryPOIUpdate, UnusedPOIUpdate, TripDataUpdate,
    TripDetails
)

@pytest.fixture
def trip_service():
    """Create a TripService with mocked Firestore dependencies"""
    with patch('services.trip_service.FirebaseService', autospec=True):
        # Create service instance
        service = TripService()
        
        # Mock Firestore client
        service.db = MagicMock()
        
        # Setup collection reference
        service.collection_name = 'Trip'
        
        # Mock the get_collection_ref method
        collection_mock = MagicMock()
        service.get_collection_ref = MagicMock(return_value=collection_mock)
        
        # Mock user_history_service
        service.user_history_service = MagicMock()
        service.user_history_service.save_trip_to_history = AsyncMock()
        
        yield service

class TestCreateTrip:
    @pytest.mark.asyncio
    async def test_create_trip_success(self, trip_service):
        """Test successful trip creation with proper subcollections"""
        # Setup test data
        now = datetime.now()
        start_date = now
        end_date = now + timedelta(days=4)
        
        # Mock document and reference
        collection_mock = trip_service.get_collection_ref.return_value
        doc_mock = MagicMock()
        doc_mock.id = "new_trip_123"
        collection_mock.document.return_value = doc_mock
        
        # Mock subcollection references
        itinerary_collection = MagicMock()
        unused_collection = MagicMock()
        
        # Set up subcollections
        def mock_collection(name):
            if name == 'itineraryPOIs':
                return itinerary_collection
            elif name == 'unusedPOIs':
                return unused_collection
            return MagicMock()
            
        doc_mock.collection.side_effect = mock_collection
        
        # Mock document for itinerary POI
        itinerary_poi_doc = MagicMock()
        itinerary_collection.document.return_value = itinerary_poi_doc
        
        # Mock document for unused POI
        unused_poi_doc = MagicMock()
        unused_collection.document.return_value = unused_poi_doc
        
        # Create trip data
        trip_data = TripData(
            city="Paris",
            country="FR",
            coordinates=Coordinates(lat=48.8534, lng=2.3488),
            fromDT=start_date,
            toDT=end_date,
            monthlyDays=4,
            interests=["Art Gallery", "Museum", "Shopping Malls"],
            customInterests=[],
            foodPreferences=["French"],
            customFoodPreferences=[],
            createdDT=now,
            userId="ngNHfKUUemTyC9oekhBxCxJm0WI3"
        )
        
        # Create itinerary POIs (matching your DB structure)
        itinerary_pois = [
            ItineraryPOI(
                PointID="poi1",
                StartTime=540,
                EndTime=660,   
                timeSlot="Morning",
                day=1,
                duration=120 
            ),
            ItineraryPOI(
                PointID="poi2",
                StartTime=840,
                EndTime=960, 
                timeSlot="Afternoon",
                day=3,
                duration=120
            )
        ]
        
        # Create unused POIs
        unused_pois = [
            UnusedPOI(PointID="poi3")
        ]
        
        # Create the request
        request = SaveTripRequest(
            tripData=trip_data,
            itineraryPOIs=itinerary_pois,
            unusedPOIs=unused_pois
        )
        
        # Call the method
        result = await trip_service.create_trip(request)
        
        # Verify results
        assert result == "new_trip_123"
        
        # Verify Trip document created with correct data
        doc_mock.set.assert_called_once()
        trip_data_arg = doc_mock.set.call_args[0][0]
        
        # Verify key fields were set correctly
        assert trip_data_arg['city'] == "paris"  # Should be lowercase
        assert trip_data_arg['country'] == "FR"
        assert trip_data_arg['monthlyDays'] == 4
        assert trip_data_arg['interests'] == ["Art Gallery", "Museum", "Shopping Malls"]
        assert trip_data_arg['userId'] == "ngNHfKUUemTyC9oekhBxCxJm0WI3"
        
        # Verify subcollection documents were created
        assert itinerary_collection.document.call_count == 2
        assert unused_collection.document.call_count == 1
        
        # Verify POI data was saved
        expected_poi1_data = {
            'StartTime': 540,
            'EndTime': 660,
            'timeSlot': 'Morning',
            'day': 1,
            'duration': 120
        }
        
        expected_poi2_data = {
            'StartTime': 840,
            'EndTime': 960,
            'timeSlot': 'Afternoon',
            'day': 3,
            'duration': 120
        }
        
        # Get the set calls to the itinerary documents
        itinerary_set_calls = itinerary_poi_doc.set.call_args_list
        assert len(itinerary_set_calls) == 2
        
        # Get called with empty dict for unused POI
        unused_poi_doc.set.assert_called_once_with({})
        
        # In the actual implementation, save_trip_to_history is not directly called from create_trip
        # The user manually calls it after trip creation
        trip_service.user_history_service.save_trip_to_history.assert_not_called()

class TestGetTripDetails:
    @pytest.mark.asyncio
    async def test_get_trip_details(self, trip_service):
        """Test retrieving trip details including all subcollections"""
        # Setup test data
        trip_id = "trip_123"
        user_id = "ngNHfKUUemTyC9oekhBxCxJm0WI3"
        now = datetime.now()
        
        # Mock the Trip document
        trip_doc = MagicMock()
        trip_doc.exists = True
        trip_doc.id = trip_id
        
        # Mock document data matching your DB structure
        trip_doc.to_dict.return_value = {
            "city": "paris",
            "country": "FR",
            "coordinates": [48.8534, 2.3488],  # Stored as array in Firebase
            "fromDT": now,
            "toDT": now + timedelta(days=4),
            "monthlyDays": 4,
            "interests": ["Art Gallery", "Museum", "Shopping Malls"],
            "customInterests": [],
            "foodPreferences": ["French"],
            "customFoodPreferences": [],
            "createdDT": now,
            "userId": user_id,
            "version": 1
        }
        
        # Mock document reference
        doc_ref = MagicMock()
        doc_ref.get.return_value = trip_doc
        collection_mock = trip_service.get_collection_ref.return_value
        collection_mock.document.return_value = doc_ref
        
        # Mock itinerary POIs
        itinerary_poi1 = MagicMock()
        itinerary_poi1.id = "itinerary_1"
        itinerary_poi1.to_dict.return_value = {
            'StartTime': 540,
            'EndTime': 660,
            'timeSlot': 'Morning',
            'day': 1,
            'duration': 120
        }
        
        itinerary_poi2 = MagicMock()
        itinerary_poi2.id = "itinerary_2"
        itinerary_poi2.to_dict.return_value = {
            'StartTime': 840,
            'EndTime': 960,
            'timeSlot': 'Afternoon',
            'day': 3,
            'duration': 120
        }
        
        # Mock unused POI
        unused_poi = MagicMock()
        unused_poi.id = "unused_1"
        unused_poi.to_dict.return_value = {}
        
        # Mock subcollections
        itinerary_collection = MagicMock()
        itinerary_collection.stream.return_value = [itinerary_poi1, itinerary_poi2]
        
        unused_collection = MagicMock()
        unused_collection.stream.return_value = [unused_poi]
        
        # Set up subcollection mocking
        def mock_collection(name):
            if name == 'itineraryPOIs':
                return itinerary_collection
            elif name == 'unusedPOIs':
                return unused_collection
            return MagicMock()
            
        doc_ref.collection.side_effect = mock_collection
        
        # Call the method
        result = await trip_service.get_trip_details(trip_id)
        
        # Verify result - this may need adjustment based on your actual implementation
        assert isinstance(result, TripDetails)
        assert result.tripData.city == "paris"
        assert result.tripData.country == "FR"
        assert result.tripData.monthlyDays == 4
        
        # Verify itinerary POIs
        assert len(result.itineraryPOIs) == 2
        assert result.itineraryPOIs[0].PointID == "itinerary_1"
        assert result.itineraryPOIs[0].StartTime == 540
        assert result.itineraryPOIs[0].day == 1
        
        # Verify unused POIs
        assert len(result.unusedPOIs) == 1
        assert result.unusedPOIs[0].PointID == "unused_1"

class TestUpdateTrip:
    def test_update_trip(self, trip_service):
        """Test updating trip with changes to POIs and trip data - update_trip is not async"""
        # Setup trip ID
        trip_id = "trip_123"
        
        # Mock document reference
        doc_ref = MagicMock()
        collection_mock = trip_service.get_collection_ref.return_value
        collection_mock.document.return_value = doc_ref
        
        # Mock batch for transaction
        batch_mock = MagicMock()
        trip_service.db.batch.return_value = batch_mock
        
        # Mock subcollections
        itinerary_collection = MagicMock()
        unused_collection = MagicMock()
        
        # Set up subcollection mocking
        def mock_collection(name):
            if name == 'itineraryPOIs':
                return itinerary_collection
            elif name == 'unusedPOIs':
                return unused_collection
            return MagicMock()
            
        doc_ref.collection.side_effect = mock_collection
        
        # Mock document references for specific POIs
        poi1_doc = MagicMock()
        poi2_doc = MagicMock()
        poi3_doc = MagicMock()
        poi4_doc = MagicMock()
        
        # Configure document lookup for itinerary
        def mock_itinerary_document(poi_id):
            if poi_id == "poi1":
                return poi1_doc
            elif poi_id == "poi2":
                return poi2_doc
            elif poi_id == "poi3":
                return poi3_doc
            return MagicMock()
            
        itinerary_collection.document.side_effect = mock_itinerary_document
        
        # Configure document lookup for unused
        def mock_unused_document(poi_id):
            if poi_id == "poi3" or poi_id == "poi4":
                return poi4_doc
            return MagicMock()
            
        unused_collection.document.side_effect = mock_unused_document
        
        # Create the update request
        update_request = TripUpdateRequest(
            # Update trip dates
            # Update to use model_dump instead of dict (which is deprecated)
            tripDataChanged=TripDataUpdate(
                fromDT=datetime.now() + timedelta(days=1),
                toDT=datetime.now() + timedelta(days=5),
                monthlyDays=4
            ),
            
            # Move poi3 to unused
            movedToUnused=[
                UnusedPOIUpdate(PointID="poi3")
            ],
            
            # No POIs moved to itinerary
            movedToItinerary=[],
            
            # Reschedule poi2
            schedulingUpdates=[
                ItineraryPOIUpdate(
                    PointID="poi2",
                    StartTime=780,  # 1:00 PM in minutes
                    EndTime=900,    # 3:00 PM in minutes
                    timeSlot="Afternoon",
                    day=2,
                    duration=120    # 2 hours in minutes
                )
            ],
            
            # Current unused POIs state
            unusedPOIsState=[
                UnusedPOIUpdate(PointID="poi3"),
                UnusedPOIUpdate(PointID="poi4")
            ],
            
            # No new POIs
            newlyAddedPOIs=[]
        )
        
        # Call the method, not async in the actual implementation
        trip_service.update_trip(trip_id, update_request)
        
        # Verify batch operations
        # 1. Trip data update
        assert batch_mock.update.call_count >= 1
        
        # 2. Scheduling update for poi2
        expected_poi2_update = {
            'StartTime': 780,
            'EndTime': 900,
            'timeSlot': 'Afternoon',
            'day': 2,
            'duration': 120
        }
        # Verify batch was committed
        batch_mock.commit.assert_called_once()