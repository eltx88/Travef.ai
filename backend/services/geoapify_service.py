from fastapi import HTTPException
import httpx
from typing import List
from models.pointofinterest import PointOfInterestResponse, Coordinates
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class GeoapifyService:
    BASE_URL = "https://api.geoapify.com/v2/places"
    API_KEY = os.getenv("GEOAPIFY_API_KEY")

    @staticmethod
    async def get_points(city: str, lat: float, lng: float, category: str, radius: int = 5000, limit: int = 30) -> List[PointOfInterestResponse]:
        filter_string = f"circle:{lng},{lat},{radius}"

        params = {
            "categories": category,
            "filter": filter_string,
            "apiKey": GeoapifyService.API_KEY,
            "limit": limit
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(GeoapifyService.BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()

                # Deduplicate places by name
                seen_names = set()
                places = []
                
                for feature in data.get("features", []):
                    properties = feature.get("properties", {})
                    name = properties.get("name", "")
                    
                    # Skip if we've seen this name before
                    if name.lower() in seen_names:
                        continue
                        
                    seen_names.add(name.lower())
                    geometry = feature.get("geometry", {})
                    coordinates = geometry.get("coordinates", [])

                    poi_type = (
                    "hotel" if "accommodation" in category
                    else "restaurant" if "catering" in category
                    else "attraction" if any(c in category for c in ["tourism", "entertainment"])
                    else "hotel"
                    )

                    place = PointOfInterestResponse(
                        id=properties.get("place_id", ""),
                        place_id=properties.get("place_id", ""),
                        name=name,
                        phone=properties.get("contact", {}).get("phone", ""),
                        website=properties.get("website", ""),
                        wikidata_id=properties.get("wiki_and_media", {}).get("wikidata", ""),
                        type=poi_type,
                        address=properties.get("formatted", ""),
                        city=properties.get("city", city),
                        country=properties.get("country", ""),
                        coordinates=Coordinates(
                            lat=coordinates[1],
                            lng=coordinates[0]
                        )
                    )
                    places.append(place)

                return places[:limit]

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))