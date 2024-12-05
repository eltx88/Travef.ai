from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from fastapi.encoders import jsonable_encoder

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

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
        
    def dict(self, *args, **kwargs):
        return jsonable_encoder(self)

class UserHistory(BaseModel):
    user_id: str
    saved_pois: List[SavedPOI] = []

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }