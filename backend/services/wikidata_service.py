import requests
from fastapi import HTTPException
from typing import Optional
from models.wikidata import WikidataImageResponse

class WikidataService:
    def __init__(self):
        self.base_url = "https://www.wikidata.org/w/api.php"

    async def fetch_wikidata_image(self, wikidata_id: str) -> Optional[str]:
        """
        Fetches the image URL associated with a Wikidata ID.
        """
        params = {
            "action": "wbgetentities",
            "ids": wikidata_id,
            "format": "json",
            "props": "claims"
        }

        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()

            # Extract the image filename from the response
            image_filename = data["entities"][wikidata_id]["claims"].get("P18", [{}])[0].get("mainsnak", {}).get("datavalue", {}).get("value")
            if image_filename:
                # Construct the image URL
                image_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{image_filename.replace(' ', '_')}"
                return image_url
            else:
                return None

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching image from Wikidata: {str(e)}")