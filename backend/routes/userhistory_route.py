from models.trip import UserTrip
from fastapi import APIRouter, Depends, Body
from typing import Dict, List, Optional
from services.userhistory_service import UserHistoryService
from .auth import verify_firebase_token

router = APIRouter(prefix="/api/user/history", tags=["user_history"])
user_history_service = UserHistoryService()

@router.get("/saved-pois")
async def get_saved_pois(user_id: str = Depends(verify_firebase_token), city: str = None) -> List[Dict]:
    return await user_history_service.get_saved_pois(user_id, city)

@router.post("/saved-pois")
async def save_poi(
    request: dict,
    user_id: str = Depends(verify_firebase_token)
) -> Dict[str, str]:
    saved_poi_id = await user_history_service.save_poi(
        user_id,
        request['pointId'],
        request['city']
    )
    return {"saved_poi_id": saved_poi_id}

@router.put("/saved-pois/unsave")
async def unsave_pois(
    request: dict,
    user_id: str = Depends(verify_firebase_token)
) -> Dict:
    await user_history_service.unsave_poi(user_id, request['point_ids'])
    return {"message": "POIs unsaved successfully"}

@router.post("/saved-trips/{trip_doc_id}")
async def save_trip_to_history(
    trip_doc_id: str,
    user_id: str = Depends(verify_firebase_token),
    city: str = Body(..., description="City of the trip"), 
    country: str = Body(..., description="Country of the trip"),
    fromDT: Optional[str] = Body(None, description="From date of the trip"),
    toDT: Optional[str] = Body(None, description="To date of the trip"),
    monthlyDays: Optional[int] = Body(None, description="Monthly days of the trip")
) -> Dict:
    """Save a trip to user's history"""
    await user_history_service.save_trip_to_history(trip_doc_id, user_id, city, country, fromDT, toDT, monthlyDays)
    return {"message": "Trip saved to history successfully"}

@router.get("/saved-trips")
async def get_user_trips(
    user_id: str = Depends(verify_firebase_token)
) -> List[UserTrip]:
    """Get all saved trips for a user"""
    return await user_history_service.get_user_saved_trips(user_id)