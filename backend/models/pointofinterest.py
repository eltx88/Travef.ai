from cmath import isnan
from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator,validator
from firebase_admin.firestore import GeoPoint

class Coordinates(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)

    @field_validator("lat")
    def validate_latitude(cls, v: float) -> float:
        if not isinstance(v, (int, float)):
            raise ValueError("Latitude must be a number")
        return v

    @field_validator("lng")
    def validate_longitude(cls, v: float) -> float:
        if not isinstance(v, (int, float)):
            raise ValueError("Longitude must be a number")
        return v

class ImageMetadata(BaseModel):
    url: str
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    source: Optional[str] = None

class PointOfInterestResponse(BaseModel):
    id: str 
    place_id: str
    name: str
    coordinates: Coordinates
    address: str
    city: str
    country: Optional[str] = None
    duration: Optional[int] = None
    type: Optional[str] = None
    categories: Optional[List[str]] = []
    cuisine: Optional[List[str]] = None
    description: Optional[str] = None    
    wikidata_id: Optional[str] = None
    image_url: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    opening_hours: Optional[str] = None 
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
