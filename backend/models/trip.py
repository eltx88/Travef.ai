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
    StartTime: int
    EndTime: int
    timeSlot: str
    day: int
    duration: int

class UnusedPOI(BaseModel):
    PointID: str

class SaveTripRequest(BaseModel):
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
    StartTime: int
    EndTime: int
    timeSlot: str
    day: int
    duration: int

class UnusedPOIUpdate(BaseModel):
    PointID: str

class TripUpdateRequest(BaseModel):
    tripDataChanged: Optional[TripDataUpdate]
    movedToItinerary: Optional[List[ItineraryPOIUpdate]]
    movedToUnused: Optional[List[UnusedPOIUpdate]]
    schedulingUpdates: Optional[List[ItineraryPOIUpdate]]
    unusedPOIsState: Optional[List[UnusedPOIUpdate]]

    class Config:
        populate_by_name = True

# User Trip Model used for the query on the homepage to display the trips
class UserTrip(BaseModel):
    trip_doc_id: str
    city: str
    country: str
    fromDT: datetime
    toDT: datetime
    monthlyDays: int
    status: bool