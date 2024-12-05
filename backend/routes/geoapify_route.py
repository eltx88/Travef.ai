from fastapi import APIRouter, HTTPException, Query
from services.geoapify_service import GeoapifyService
from models.pointofinterest import PointOfInterestResponse
from typing import List

router = APIRouter(prefix="/api")

@router.get("/geoapify/places", response_model=List[PointOfInterestResponse])
async def get_places(
    city: str = Query(..., description="City name"),
    latitude: float = Query(..., ge=-90, le=90, description="Latitude of the location"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude of the location"),
    category: str = Query(
        "accommodation",
        description="Category of places. Options: accommodation, catering, tourism, entertainment"
    ),
    radius: int = Query(
        5000,
        ge=0,
        le=50000,
        description="Search radius in meters (max 50000)"
    ),
    limit: int = Query(
        30,
        ge=1,
        le=50,
        description="Maximum number of results to return (max 50)"
    )
):
    """
    Get places of interest from Geoapify Places API.
    
    Common categories:
    - accommodation: hotels, hostels, etc.
    - catering: restaurants, cafes, bars
    - tourism: attractions, museums, monuments
    - entertainment: theaters, cinemas, parks
    """
    try:
        places = await GeoapifyService.get_points(
            city=city,
            lat=latitude,
            lng=longitude,
            category=category,
            radius=radius,
            limit=limit
        )
        
        if not places:
            return []
            
        return places
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching places: {str(e)}"
        )