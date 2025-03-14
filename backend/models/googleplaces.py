from pydantic import BaseModel
from typing import List, Optional

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

class TextSearchPlace(BaseModel):
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
    opening_hours: Optional[str]
    photo_url: Optional[str] = None

    @classmethod
    def from_place_details(cls, place_details: dict, photo_url: Optional[str] = None):
        return cls(
            place_id=place_details.get("place_id"),
            name=place_details.get("name"),
            formatted_address=place_details.get("formatted_address"),
            types=place_details.get("types", []),
            primary_type=place_details.get("primary_type"),
            rating=place_details.get("rating"),
            user_ratings_total=place_details.get("user_ratings_total"),
            photo_name=place_details.get("photo_name"),
            location=place_details.get("location"),
            website=place_details.get("website"),
            phone=place_details.get("phone"),
            opening_hours=place_details.get("opening_hours"),
            photo_url=photo_url
        )