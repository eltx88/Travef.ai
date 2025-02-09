from typing import Optional
from fastapi import APIRouter, HTTPException
from services.googleplaces_service import GooglePlacesService

router = APIRouter(prefix="/googleplaces", tags=["Google Places"])
google_places_service = GooglePlacesService()

@router.get("/nearby")
async def get_nearby_places(latitude: float, longitude: float, radius: int = 1000, type: Optional[str] = None):
    """
    Endpoint to find places near a given location.
    """
    try:
        places = google_places_service.nearby_search(latitude, longitude, radius, type)
        return places
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
