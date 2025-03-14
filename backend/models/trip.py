from dataclasses import Field
from pydantic import BaseModel, Field, model_validator, ConfigDict
from datetime import datetime
from typing import List, Optional

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
    monthlyDays: int = Field(..., ge=1, le=7, description="Number of days must be between 1 and 7")
    interests: List[str]
    customInterests: List[str]
    foodPreferences: List[str]
    customFoodPreferences: List[str]
    createdDT: datetime
    userId: str
    
    @model_validator(mode='after')
    def validate_dates(self):
        if self.fromDT >= self.toDT:
            raise ValueError("End date (toDT) must be after start date (fromDT)")
        return self

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

    model_config = ConfigDict(populate_by_name=True)

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
    monthlyDays: Optional[int] = Field(None, ge=1, le=7)
    
    @model_validator(mode='after')
    def validate_dates(self):
        if self.fromDT is not None and self.toDT is not None:
            if self.fromDT >= self.toDT:
                raise ValueError("End date (toDT) must be after start date (fromDT)")
        return self

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
    newlyAddedPOIs: Optional[List[ItineraryPOIUpdate]]

    model_config = ConfigDict(populate_by_name=True)

# User Trip Model used for the query on the homepage to display the trips
class UserTrip(BaseModel):
    trip_doc_id: str
    city: str
    country: str
    fromDT: datetime
    toDT: datetime
    monthlyDays: int
    status: bool