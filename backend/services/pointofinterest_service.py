from typing import List, Optional
from .firebase_service import FirebaseService
from models.pointofinterest import PointOfInterestResponse
from fastapi import HTTPException
import logging
from firebase_admin import firestore
from firebase_admin.firestore import GeoPoint
class PointOfInterestService(FirebaseService):
    def __init__(self):
        super().__init__()
        self.collection_name = 'PointofInterest'

    async def get_point(self, point_id: str) -> PointOfInterestResponse:
        try:
            doc_ref = self.get_collection_ref(self.collection_name).document(point_id)
            doc = doc_ref.get()

            if not doc.exists:
                raise HTTPException(status_code=404, detail="Point of interest not found")

            poi_data = doc.to_dict()
            
            if 'coordinates' in poi_data and isinstance(poi_data['coordinates'], GeoPoint):
                poi_data['coordinates'] = {
                    'lat': poi_data['coordinates'].latitude,
                    'lng': poi_data['coordinates'].longitude
                }

            return PointOfInterestResponse(id=doc.id, **poi_data)
        except Exception as e:
            logging.error(f"Error fetching point of interest: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error fetching point of interest: {str(e)}")

    async def get_points(self, point_ids: List[str]) -> List[PointOfInterestResponse]:
        try:
            batch_size = 10
            points = []
            for i in range(0, len(point_ids), batch_size):
                batch_ids = point_ids[i:i + batch_size]
                docs = self.db.get_all(
                    [self.get_collection_ref(self.collection_name).document(point_id) for point_id in batch_ids]
                )
                for doc in docs:
                    if doc.exists:
                        poi_data = doc.to_dict()

                        if 'coordinates' in poi_data and isinstance(poi_data['coordinates'], GeoPoint):
                            poi_data['coordinates'] = {
                                'lat': poi_data['coordinates'].latitude,
                                'lng': poi_data['coordinates'].longitude
                            }
                        poi = PointOfInterestResponse(id=doc.id, **poi_data)
                        points.append(poi)
            return points

        except Exception as e:
            logging.error(f"Error fetching points: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error fetching points: {str(e)}")
    
    async def find_by_coordinates(self, lat: float, lng: float, city: str, country: str) -> Optional[str]:
        try:
            # Query using GeoPoint system
            query = self.get_collection_ref(self.collection_name)\
                .where('city', '==', city)\
                .where('country', '==', country)\
                .where('coordinates', '>=', firestore.GeoPoint(lat - 0.0001, lng - 0.0001))\
                .where('coordinates', '<=', firestore.GeoPoint(lat + 0.0001, lng + 0.0001))
            
            docs = query.get()
            return next((doc.id for doc in docs), None)

        except Exception as e:
            logging.error(f"Error checking coordinates: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def find_by_place_id(self, place_id: str, city: str, country: str) -> Optional[str]:
        try:
            # Query using place_id, city and country
            query = self.get_collection_ref(self.collection_name)\
                .where('place_id', '==', place_id)\
                .where('city', '==', city)\
                .where('country', '==', country)
            
            docs = query.get()
            return next((doc.id for doc in docs), None)

        except Exception as e:
            logging.error(f"Error checking place_id: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def create_or_get_point(self, point_data: PointOfInterestResponse) -> str:
        """Create new POI if it doesn't exist, or return existing ID"""
        try:
            # First check if POI exists with this place_id
            existing_id = await self.find_by_place_id(
                point_data.place_id,
                point_data.city,
                point_data.country
            )
            
            if existing_id:
                return existing_id

            # If not found by place_id, check coordinates as fallback
            existing_id = await self.find_by_coordinates(
                point_data.coordinates.lat,
                point_data.coordinates.lng,
                point_data.city,
                point_data.country
            )
            
            if existing_id:
                return existing_id

            # Create new document with auto-generated ID
            doc_ref = self.get_collection_ref(self.collection_name).document()
            
            # Convert to dict and exclude 'id' field
            poi_dict = point_data.model_dump(exclude={'id'})
            
            # Convert coordinates to GeoPoint
            poi_dict['coordinates'] = firestore.GeoPoint(
                point_data.coordinates.lat,
                point_data.coordinates.lng
            )
            poi_dict['created_at'] = firestore.SERVER_TIMESTAMP

            doc_ref.set(poi_dict)
            return doc_ref.id

        except Exception as e:
            logging.error(f"Error in create_or_get_point: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))