from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Coordinates(BaseModel):
    lat: float
    lng: float

class POI(BaseModel):
    place_id: str
    name: str
    type: str
    coordinates: Coordinates

class TripData(BaseModel):
    city: str
    country: str
    coordinates: Coordinates
    fromDT: datetime
    toDT: datetime
    monthly_days: Optional[int] = None
    interests: List[str]
    food_preferences: List[str]
    custom_interests: List[str]
    custom_food_preferences: List[str]

class TripGenerationRequest(BaseModel):
    trip_data: TripData
    attractionpois: List[POI] = []
    foodpois: List[POI] = []
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True