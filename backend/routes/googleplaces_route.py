from typing import List, Optional
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

@router.post("/batch_details")
async def batch_get_place_details(place_ids: List[str]):
    """
    Endpoint to retrieve detailed information for multiple places in one call.
    """
    try:
        # Get place details for all valid place IDs
        place_details_dict = google_places_service.batch_get_place_details(place_ids)
        
        # Add photo URLs to the details
        enriched_details = google_places_service.batch_get_photos(place_details_dict)
        
        return enriched_details
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/explore")
async def get_explore_places(latitude: float, longitude: float, radius: int = 2000, type: Optional[str] = None, max_results: int = 20):
    """
    Endpoint to retrieve explore places for a given location and type.
    """
    try:
        places = google_places_service.getExplorePOIs(latitude, longitude, radius, type, max_results)
         # Transform places to include photo URLs
        places_with_photos = []
        for place in places:
            photo_url = None
            if place.photo_name:
                photo_url = google_places_service.get_place_photo(place.photo_name)
            places_with_photos.append(PlaceWithPhotoUrl.from_place(place, photo_url))
            
        return places_with_photos
    except Exception as e:
        raise HTTPException(status_code=500, detail= f"Error fetching explore places from Google Places API: {str(e)}")

@router.get("/textsearch")
async def text_search(query: str, latitude: float, longitude: float, radius: int = 2000, type: Optional[str] = None, max_results: int = 20, open_now: bool = False):
    """
    Endpoint to search for places based on a text query with location bias.
    """
    try:
        places = google_places_service.text_search(
            query=query,
            latitude=latitude,
            longitude=longitude,
            radius=radius,
            type=type,
            max_results=max_results,
            open_now=open_now
        )
        
        # Transform places to include photo URLs
        places_with_photos = []
        for place in places:
            photo_url = None
            if place.photo_name:
                photo_url = google_places_service.get_place_photo(place.photo_name)
            places_with_photos.append(PlaceWithPhotoUrl.from_place(place, photo_url))
            
        return places_with_photos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching places: {str(e)}")
