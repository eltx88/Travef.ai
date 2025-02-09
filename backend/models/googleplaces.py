from pydantic import BaseModel
from typing import List, Optional

class Place(BaseModel):
    place_id: str
    name: str
    vicinity: Optional[str]
    opening_hours: Optional[dict]
    types: List[str]
    rating: Optional[float]
    user_ratings_total: Optional[int]
    photos: Optional[List[dict]]
    geometry: Optional[dict]

class PlaceDetails(BaseModel):
    place_id: str
    name: str
    formatted_address: Optional[str]
    international_phone_number: Optional[str]
    website: Optional[str]
    rating: Optional[float]
    reviews: Optional[List[dict]]
    photos: Optional[List[dict]]