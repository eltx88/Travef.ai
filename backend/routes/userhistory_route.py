from fastapi import APIRouter, Depends, Security
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