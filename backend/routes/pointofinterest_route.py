from fastapi import APIRouter, Depends, HTTPException, Security
from typing import Dict, List
from services.pointofinterest_service import PointOfInterestService
from models.pointofinterest import PointOfInterestResponse
from .auth import verify_firebase_token
import logging 

router = APIRouter(prefix="/api/points", tags=["points"])
poi_service = PointOfInterestService()

@router.post("/saved/details")
async def get_points_details(
    request_body: Dict[str, List[str]],
    _: str = Depends(verify_firebase_token)
) -> List[PointOfInterestResponse]:
    logging.info(f"Received POST request with body: {request_body}")
    point_ids = request_body.get("point_ids", [])
    if not point_ids:
        raise HTTPException(status_code=400, detail="point_ids is required")
    return await poi_service.get_points(point_ids)

@router.post("/CreateGetPOI", response_model=str)
async def create_or_get_point(
    request: Dict, 
    _: str = Depends(verify_firebase_token)
) -> str:
    """Create a new point of interest"""
    try:
        point_data = PointOfInterestResponse(**request['poi_data'])  # Convert dict to model
        logging.info(f"Creating POI with data: {point_data}")
        point_id = await poi_service.create_or_get_point(point_data)
        logging.info(f"Created/Found POI with ID: {point_id}")
        return point_id
    except Exception as e:
        logging.error(f"Error creating POI: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))