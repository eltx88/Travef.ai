from fastapi import APIRouter, Depends, HTTPException
from models.trip import SaveTripRequest, TripDetails, TripUpdateRequest
from services.trip_service import TripService
from typing import Dict
from .auth import verify_firebase_token
import logging
from typing import Dict, Optional
from firebase_admin import firestore
from services.userhistory_service import UserHistoryService

router = APIRouter(prefix="/api/trip", tags=["trip"])
def get_trip_service():
    return TripService()

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

@router.put("/update/{trip_doc_id}")
async def update_trip(
    trip_doc_id: str,
    request: TripUpdateRequest,
    user_id: str = Depends(verify_firebase_token)
) -> Dict[str, str]:
    """Update an existing trip"""
    trip_service = TripService()
    trip_service.update_trip(trip_doc_id, request) 
    return {"message": "Trip updated successfully"}

@router.delete("/delete-with-history/{trip_doc_id}")
async def delete_trip_with_history(
    trip_doc_id: str,
    user_id: str = Depends(verify_firebase_token)
) -> Dict[str, str]:
    try:
        # Initialize the Firestore client
        db = firestore.client()
        
        # Get the UserHistoryService to access the correct collection name
        userhistory_service = UserHistoryService()
        collection_name = userhistory_service.collection_name
        
        # Check if documents exist before attempting deletion
        trip_ref = db.collection("Trip").document(trip_doc_id)
        trip_doc = trip_ref.get()
        
        user_history_ref = db.collection(collection_name).document(user_id)
        saved_itinerary_ref = user_history_ref.collection('savedItineraries').document(trip_doc_id)
        saved_itinerary_doc = saved_itinerary_ref.get()
        
        if not trip_doc.exists:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        # Create and execute transaction
        transaction = db.transaction()
        
        @firestore.transactional
        def delete_in_transaction(transaction):
            # if one fails, the whole transaction will be rolled back
            # Delete from savedItineraries subcollection if it exists
            if saved_itinerary_doc.exists:
                transaction.delete(saved_itinerary_ref)
            
            # Delete the trip document
            transaction.delete(trip_ref)
            
            return {"message":"Trip and associated history deleted successfully"}
        
        # Execute the transaction - this ensures atomicity
        result = delete_in_transaction(transaction)
        return result
        
    except Exception as e:
        print(f"Error deleting trip: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete trip: {str(e)}")
