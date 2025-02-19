from typing import Optional
from fastapi import APIRouter, HTTPException
from services.googleplaces_service import GooglePlacesService
from models.googleplaces import PlaceWithPhotoUrl

router = APIRouter(prefix="/api/googleplaces", tags=["Google Places"])
google_places_service = GooglePlacesService()

@router.get("/nearby")
async def get_nearby_places(latitude: float, longitude: float, radius: int = 1000, type: Optional[str] = None, max_results: int = 10):
    """
    Endpoint to find places near a given location and include photo URLs.
    """
    try:
        places = google_places_service.nearby_search(latitude, longitude, radius, type, max_results)
        
        # Transform places to include photo URLs
        places_with_photos = []
        for place in places:
            photo_url = None
            if place.photo_name:
                photo_url = google_places_service.get_place_photo(place.photo_name)
            places_with_photos.append(PlaceWithPhotoUrl.from_place(place, photo_url))
            
        return places_with_photos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/details/{place_id}")
async def get_place_details(place_id: str):
    """
    Endpoint to retrieve detailed information for a specific place.
    """
    try:
        place_details = google_places_service.get_place_details(place_id)
        return place_details
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
