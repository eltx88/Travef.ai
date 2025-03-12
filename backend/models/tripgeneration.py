from pydantic import BaseModel, ConfigDict
from typing import List
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
    monthly_days: int
    interests: List[str] = []
    food_preferences: List[str] = []
    custom_interests: List[str] = []
    custom_food_preferences: List[str] = []

class TripGenerationRequest(BaseModel):
    trip_data: TripData
    attractionpois: List[POI] = []
    foodpois: List[POI] = []
    cafepois: List[POI] = []

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)