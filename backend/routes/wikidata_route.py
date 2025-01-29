from fastapi import APIRouter, Depends, HTTPException
from services.wikidata_service import WikidataService
from models.wikidata import WikidataImageResponse

router = APIRouter(prefix="/api/wikidata", tags=["wikidata"])
wikidata_service = WikidataService()

@router.get("/image/{wikidata_id}", response_model=WikidataImageResponse)
async def get_wikidata_image(wikidata_id: str):
    """
    Fetch the image URL associated with a Wikidata ID.
    """
    image_url = await wikidata_service.fetch_wikidata_image(wikidata_id)
    if not image_url:
        raise HTTPException(status_code=404, detail="No image found for this Wikidata ID")
    return WikidataImageResponse(wikidata_id=wikidata_id, image_url=image_url)