from datetime import datetime
import logging
from models.trip import UserTrip
from .firebase_service import FirebaseService
from models.userhistory import SavedPOI
from firebase_admin import firestore
from typing import List, Dict
from fastapi import HTTPException
from .pointofinterest_service import PointOfInterestService


class UserHistoryService(FirebaseService):
    def __init__(self):
        super().__init__()
        self.collection_name = 'UserHistory'
        self.poi_service = PointOfInterestService()

    async def get_saved_pois(self, user_id: str, city: str) -> List[SavedPOI]:
        try:
            doc_ref = self.get_collection_ref(self.collection_name).document(user_id)
            saved_pois_ref = doc_ref.collection('savedPOIs')
            
            # Create query with status filter
            query = saved_pois_ref.where('status', '==', True)
            
            # Add city filter if city is provided
            if city:
                query = query.where('city', '==', city.lower())
                
            # Execute query
            saved_pois = query.get()
            
            return [SavedPOI(
                id=poi.id,
                pointID=poi.get('pointID'),
                status=poi.get('status'),
                createdDT=poi.get('createdDT'),
                city=poi.get('city')
            ).model_dump() for poi in saved_pois]

        except Exception as e:
            print(f"Error in get_saved_pois: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching saved POIs: {str(e)}"
            )

    async def get_detailed_saved_pois(self, user_id: str, city: str) -> List[Dict]:
        saved_pois = await self.get_saved_pois(user_id, city)
        poi_ids = [poi['pointID'] for poi in saved_pois]
        return await self.poi_service.get_points(poi_ids)
    
    async def save_poi(self, user_id: str, point_id: str, city: str) -> str:
        """Save POI to user's saved collection. Handles duplicate entries by:
            - Checking if POI already exists for the user
            - If it exists and status is False, updates it to True
            - If it exists and status is True, returns existing ID
            - If it doesn't exist, creates new entry
            
            Returns:
                str: Document ID of the saved/updated POI"""
        try:
            # Get reference to user's savedPOIs collection
            user_ref = self.get_collection_ref(self.collection_name).document(user_id)
            saved_pois_ref = user_ref.collection('savedPOIs')

            # Query for existing POI with matching pointID
            existing_poi_query = saved_pois_ref.where('pointID', '==', point_id).limit(1)
            existing_docs = existing_poi_query.get()

            if existing_docs:
                existing_doc = existing_docs[0]
                existing_status = existing_doc.get('status')

                # If existing POI has status False, update it to True
                if not existing_status:
                    existing_doc.reference.update({
                        'status': True,
                        'createdDT': firestore.SERVER_TIMESTAMP
                    })
            
                return existing_doc.id
            
            else:
                # Create new document with auto ID if it does not exist in the user's savedPOIs
                doc_ref = saved_pois_ref.document()
                doc_ref.set({
                    'pointID': point_id,
                    'status': True,
                    'createdDT': firestore.SERVER_TIMESTAMP,
                    'city': city.lower()
                })

                return doc_ref.id

        except Exception as e:
            logging.error(f"Error saving POI: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def unsave_poi(self, user_id: str, point_ids: List[str]) -> None:
        """Update status to False for the given POIs in user's saved collection
        
        Args:
            user_id (str): The user's ID
            point_ids (List[str]): List of point IDs to unsave
            
        Raises:
            HTTPException: If there's an error updating the POIs"""
        try:
            # Get reference to user's savedPOIs collection
            user_ref = self.get_collection_ref(self.collection_name).document(user_id)
            saved_pois_ref = user_ref.collection('savedPOIs')
            
            # Get batch reference for multiple updates
            batch = self.db.batch()
            
            # For each point_id, query and update its status
            for point_id in point_ids:
                # Query for existing POI with matching pointID
                existing_poi_query = saved_pois_ref.where('pointID', '==', point_id).limit(1)
                existing_docs = existing_poi_query.get()
                
                if existing_docs:
                    existing_doc = existing_docs[0]
                    # Add update operation to batch
                    batch.update(existing_doc.reference, {
                        'status': False,
                        'updatedDT': firestore.SERVER_TIMESTAMP
                    })
            
            # Commit all updates in batch
            batch.commit()
            
        except Exception as e:
            logging.error(f"Error unsaving POIs: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error unsaving POIs: {str(e)}"
            )

    async def save_trip_to_history(self, trip_doc_id: str, user_id: str, city: str, country: str, fromDT: str, toDT: str, monthlyDays: int) -> None:
        try:
            # Create reference to user's savedItineraries subcollection
            user_history_ref = self.get_collection_ref(self.collection_name).document(user_id)
            
            saved_itineraries_ref = user_history_ref.collection('savedItineraries').document(trip_doc_id)
            # Save reference in user's history
            saved_itineraries_ref.set({
                'city': city,
                'country': country,
                'fromDT': fromDT,
                'toDT': toDT,
                'monthlyDays': monthlyDays,
                'status': True
            })

        except Exception as e:
            logging.error(f"Error saving trip to user history: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    # Update the get_user_saved_trips method to use the correct field name
    async def get_user_saved_trips(self, user_id: str) -> List[UserTrip]:
        """Get all saved trips for a user"""
        try:
            user_history_ref = self.get_collection_ref(self.collection_name).document(user_id)
            saved_itineraries_ref = user_history_ref.collection('savedItineraries') 

            query = saved_itineraries_ref.where("status", "==", True)
            saved_itineraries = query.get()
            user_trips = []
            
            for doc in saved_itineraries:
                trip_data = doc.to_dict()
                trip_data['fromDT'] = datetime.strptime(trip_data['fromDT'], "%Y-%m-%dT%H:%M:%S.%fZ")
                trip_data['toDT'] = datetime.strptime(trip_data['toDT'], "%Y-%m-%dT%H:%M:%S.%fZ") 
                user_trip = UserTrip(**trip_data, trip_doc_id=doc.id) 
                user_trips.append(user_trip)

            return user_trips
        except Exception as e:
            logging.error(f"Error getting user saved trips: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
