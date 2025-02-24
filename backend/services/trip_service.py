# services/trip_service.py
from typing import List, Dict, Optional
from fastapi import HTTPException
from .firebase_service import FirebaseService
from .userhistory_service import UserHistoryService
from models.trip import Coordinates, SaveTripRequest, TripDB, ItineraryPOI, TripData, TripDetails, UnusedPOI
import logging
from firebase_admin import firestore

class TripService(FirebaseService):
    def __init__(self):
        super().__init__()
        self.collection_name = 'Trip'
        self.user_history_service = UserHistoryService()

    async def create_trip(self, request: SaveTripRequest) -> str:
        """Create a new trip with its associated POIs"""
        try:
            # Create a reference to the Firestore collection
            trip_ref = self.get_collection_ref(self.collection_name).document()
            trip_doc_id = trip_ref.id

            # Set main trip data
            trip_data = {
                'city': request.tripData.city.lower(),
                'country': request.tripData.country,
                'coordinates': [request.tripData.coordinates.lat, request.tripData.coordinates.lng],
                'fromDT': request.tripData.fromDT,
                'toDT': request.tripData.toDT,
                'monthlyDays': request.tripData.monthlyDays,
                'interests': request.tripData.interests,
                'customInterests': request.tripData.customInterests,
                'foodPreferences': request.tripData.foodPreferences,
                'customFoodPreferences': request.tripData.customFoodPreferences,
                'createdDT': firestore.SERVER_TIMESTAMP,
                'lastModifiedDT': firestore.SERVER_TIMESTAMP,
                'userId': request.tripData.userId,
                'trip_id': request.tripId,
                'version': 1
            }
            trip_ref.set(trip_data)

            # Add itinerary POIs as a subcollection
            for poi in request.itineraryPOIs:
                poi_ref = trip_ref.collection('itineraryPOIs').document(poi.PointID)
                poi_ref.set({
                    'place_id': poi.place_id,
                    'StartTime': poi.StartTime,
                    'EndTime': poi.EndTime,
                    'timeSlot': poi.timeSlot,
                    'day': poi.day,
                    'duration': poi.duration
                })

            # Add unused POIs as a subcollection
            for poi in request.unusedPOIs:
                poi_ref = trip_ref.collection('unusedPOIs').document(poi.PointID)
                poi_ref.set({
                    'place_id': poi.place_id
                })

            # Return the ID of the newly created trip
            return trip_doc_id

        except Exception as e:
            logging.error(f"Error creating trip: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_trip_details(self, trip_doc_id: str) -> TripDetails:
        """Get trip details"""
        try:
            trip_ref = self.get_collection_ref(self.collection_name).document(trip_doc_id)
            trip_doc = trip_ref.get()

            if not trip_doc.exists:
                raise HTTPException(status_code=404, detail="Trip not found")
            
            trip_data = trip_doc.to_dict()

            # Get POIs from subcollections
            itinerary_pois_ref = trip_ref.collection('itineraryPOIs')
            itinerary_pois = itinerary_pois_ref.stream()
            # Include both document data and ID in the list comprehension
            itinerary_pois_list = [{**doc.to_dict(), 'doc_id': doc.id} for doc in itinerary_pois]

            unused_pois_ref = trip_ref.collection('unusedPOIs')
            unused_pois = unused_pois_ref.stream()
            unused_pois_list = [{**doc.to_dict(), 'doc_id': doc.id} for doc in unused_pois]
                        
            # Convert the trip data into models
            trip_data_model = TripData(
                city=trip_data['city'],
                country=trip_data['country'],
                coordinates=Coordinates(
                    lat=trip_data['coordinates'][0],
                    lng=trip_data['coordinates'][1]
                ),
                fromDT=trip_data['fromDT'],
                toDT=trip_data['toDT'],
                monthlyDays=trip_data['monthlyDays'],
                interests=trip_data['interests'],
                customInterests=trip_data.get('customInterests', []),
                foodPreferences=trip_data['foodPreferences'],
                customFoodPreferences=trip_data.get('customFoodPreferences', []),
                createdDT=trip_data['createdDT'],
                userId=trip_data['userId']
            )
            
            itinerary_pois_models = [
                ItineraryPOI(
                    PointID = poi['doc_id'],
                    place_id=poi['place_id'],
                    StartTime=poi['StartTime'],
                    EndTime=poi['EndTime'],
                    timeSlot=poi['timeSlot'],
                    day=poi['day'],
                    duration=poi['duration']
                ) for poi in itinerary_pois_list
            ]
            
            unused_pois_models = [
                UnusedPOI(
                    PointID=poi['doc_id'],
                    place_id=poi['place_id']
                ) for poi in unused_pois_list
            ]
            
            return TripDetails(
                tripData=trip_data_model,
                itineraryPOIs=itinerary_pois_models,
                unusedPOIs=unused_pois_models
            )
        except Exception as e:
            logging.error(f"Error getting trip details: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))