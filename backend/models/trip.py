from dataclasses import Field
from pydantic import BaseModel
from datetime import datetime
from typing import Dict, List, Optional, Union

# Save Trip Request Models
class Coordinates(BaseModel):
    lat: float
    lng: float

class TripData(BaseModel):
    city: str
    country: str
    coordinates: Coordinates
    fromDT: datetime
    toDT: datetime
    monthlyDays: int
    interests: List[str]
    customInterests: List[str]
    foodPreferences: List[str]
    customFoodPreferences: List[str]
    createdDT: datetime
    userId: str

class ItineraryPOI(BaseModel):
    PointID: str
    place_id: str
    StartTime: int
    EndTime: int
    timeSlot: str
    day: int
    duration: int

class UnusedPOI(BaseModel):
    PointID: str
    place_id: str

class SaveTripRequest(BaseModel):
    tripId: str
    tripData: TripData
    itineraryPOIs: List[ItineraryPOI]
    unusedPOIs: List[UnusedPOI]

    class Config:
        populate_by_name = True

# Database Models
class TripDB(BaseModel):
    trip_id: str
    city: str
    country: str
    coordinates: Coordinates
    FromDT: datetime
    ToDT: datetime
    monthlyDays: int
    interests: List[str]
    custom_interests: List[str]
    food_preferences: List[str]
    custom_food_preferences: List[str]
    createdDT: datetime
    lastModifiedDT: Optional[datetime]
    version: int

class TripDetails(BaseModel):
    tripData: TripData
    itineraryPOIs: List[ItineraryPOI]
    unusedPOIs: List[UnusedPOI]

#UPDATE TRIP REQUEST MODELS
class TripDataUpdate(BaseModel):
    fromDT: Optional[datetime]
    toDT: Optional[datetime]
    monthlyDays: Optional[int]

class ItineraryPOIUpdate(BaseModel):
    PointID: str
    place_id: str
    StartTime: int
    EndTime: int
    timeSlot: str
    day: int
    duration: int

class UnusedPOIUpdate(BaseModel):
    PointID: str
    place_id: str

class TripUpdateRequest(BaseModel):
    tripDataChanged: Optional[TripDataUpdate]
    movedToItinerary: List[ItineraryPOIUpdate]
    movedToUnused: List[UnusedPOIUpdate]
    schedulingUpdates: List[ItineraryPOIUpdate]
    unusedPOIsState: List[UnusedPOIUpdate]

    class Config:
        populate_by_name = True