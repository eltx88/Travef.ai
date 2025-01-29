from typing import Optional
from pydantic import BaseModel

class WikidataImageResponse(BaseModel):
    wikidata_id: str
    image_url: Optional[str] = None