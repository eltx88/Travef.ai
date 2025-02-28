from pydantic import BaseModel
from typing import List, Optional, Dict

class Location(BaseModel):
    latitude: float
    longitude: float

class Place(BaseModel):
    place_id: str
    name: str
    formatted_address: Optional[str]
    types: List[str]
    primary_type: Optional[str]
    rating: Optional[float]
    user_ratings_total: Optional[int]
    photo_name: Optional[str]
    location: Location
    website: Optional[str]
    phone: Optional[str]
    description: Optional[str]
    opening_hours: Optional[str]
    price_level: Optional[str]
    cuisine: Optional[List[str]]

class PlaceWithPhotoUrl(Place):
    photo_url: Optional[str]

    @classmethod
    def from_place(cls, place: Place, photo_url: Optional[str] = None):
        place_dict = place.model_dump()
        return cls(**place_dict, photo_url=photo_url)