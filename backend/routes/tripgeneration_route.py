from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict
import logging
from services.tripgeneration_service import TripGenerationService
from models.tripgeneration import TripGenerationRequest
from .auth import verify_firebase_token
import json

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/trip", tags=["trip"])
trip_service = TripGenerationService()

@router.post("/generate")
async def generate_trip(
    request: Request,
    user_id: str = Depends(verify_firebase_token)
) -> Dict[str, str]:
    try:
        raw_data = await request.json()
        logger.info(f"Received raw data: {raw_data}")

        try:
            trip_request = TripGenerationRequest.model_validate(raw_data)
            itinerary = await trip_service.generate_trip(trip_request)

            try:
                # Ensure the response is valid JSON
                json.loads(itinerary)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=500,
                    detail="Generated itinerary is not valid JSON"
                )
            
            response = {"itinerary": itinerary}
            return response

        except Exception as e:
            logger.error(f"Failed to process request: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Invalid request format: {str(e)}")

    except Exception as e:
        logger.error(f"Error in generate_trip route: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate trip: {str(e)}"
        )