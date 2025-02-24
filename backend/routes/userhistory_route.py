from fastapi import APIRouter, Depends, Body
from typing import Dict, List
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

@router.get("/saved-trips/check/{trip_id}")
async def check_saved_trip(
    trip_id: str,
    user_id: str = Depends(verify_firebase_token)
) -> Dict:
    """Check if a trip exists in user's saved trips"""
    return await user_history_service.check_trip_exists(user_id, trip_id)

@router.post("/saved-trips/{trip_doc_id}")
async def save_trip_to_history(
    trip_doc_id: str,
    user_id: str = Depends(verify_firebase_token),
    trip_id: str = Body(..., description="Trip ID"),
    city: str = Body(..., description="City of the trip"), 
    country: str = Body(..., description="Country of the trip"),
    fromDT: str = Body(..., description="From date of the trip"),
    toDT: str = Body(..., description="To date of the trip"),
    monthlyDays: int = Body(..., description="Monthly days of the trip")
) -> Dict:
    """Save a trip to user's history"""
    await user_history_service.save_trip_to_history(user_id, trip_doc_id, trip_id, city, country, fromDT, toDT, monthlyDays)
    return {"message": "Trip saved to history successfully"}