from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, field_serializer

class Coordinates(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)

    @field_validator("lat")
    def validate_latitude(cls, v: float) -> float:
        return v

    @field_validator("lng")
    def validate_longitude(cls, v: float) -> float:
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

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, dt: Optional[datetime]) -> Optional[str]:
        return dt.isoformat() if dt else None
