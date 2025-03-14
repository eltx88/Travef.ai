from pydantic import BaseModel, field_serializer, ConfigDict
from typing import List, Optional
from datetime import datetime

class SavedPOI(BaseModel):
    id: str
    pointID: str
    status: bool
    createdDT: Optional[datetime] = None
    city: str
    # note: Optional[str] = None  # Allow users to add personal notes
    # visited: Optional[bool] = False  # Track if user has visited
    # visit_date: Optional[datetime] = None  # Date of visit
    # personal_rating: Optional[float] = Field(None, ge=0, le=5)  # Personal rating

    model_config = ConfigDict()
    
    @field_serializer('*', when_used='json')
    def serialize_datetime_fields(self, v, _info):
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
class SavedTrip(BaseModel):
    id: str
    tripId: str
    city: str
    country: str
    status: bool

class UserHistory(BaseModel):
    user_id: str
    saved_pois: List[SavedPOI] = []
    saved_trips: List[SavedTrip] = []

    @field_serializer('saved_pois', 'saved_trips')
    def serialize_collections(self, items: List) -> List:
        return items
        
    @field_serializer('*', when_used='json')
    def serialize_datetime_fields(self, v, _info):
        if isinstance(v, datetime):
            return v.isoformat()
        return v