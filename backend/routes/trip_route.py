from fastapi import APIRouter, Depends, HTTPException
from models.trip import SaveTripRequest, TripDetails
from services.trip_service import TripService
from typing import Dict
from .auth import verify_firebase_token
import logging
from typing import Dict, Optional

router = APIRouter(prefix="/api/trip", tags=["trip"])
def get_trip_service():
    return TripService()

@router.get("/check/{trip_id}")
async def check_trip_exists(
    trip_id: str,
    user_id: str = Depends(verify_firebase_token)
) -> Optional[Dict]:
    """Check if trip exists in user's saved itineraries"""
    trip_service = TripService()
    return await trip_service.check_trip_exists(user_id, trip_id)

@router.post("/create")
async def create_trip(
    request: SaveTripRequest,
    user_id: str = Depends(verify_firebase_token)
) -> str:
    """Create a new trip"""
    trip_service = TripService()
    trip_id = await trip_service.create_trip(request)
    return trip_id

@router.get("/details/{trip_doc_id}")
async def get_trip_details(
    trip_doc_id: str,
    user_id: str = Depends(verify_firebase_token)
) -> TripDetails:
    trip_service = TripService()
    return await trip_service.get_trip_details(trip_doc_id)

