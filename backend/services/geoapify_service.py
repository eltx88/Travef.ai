from fastapi import HTTPException
import httpx
from typing import List,Optional
from models.pointofinterest import PointOfInterestResponse, Coordinates
import os
from dotenv import load_dotenv
import traceback

# Load environment variables from .env file
load_dotenv()

class GeoapifyService:
    BASE_URL = "https://api.geoapify.com/v2/places"
    API_KEY = os.getenv("GEOAPIFY_API_KEY")

    @staticmethod
    def parse_cuisine(properties: dict) -> Optional[List[str]]:
        # Try to get cuisine from raw->catering->cuisine or raw->cuisine
        raw_data = properties.get('datasource', {}).get('raw', {})
        catering_data = raw_data.get('catering', {})
        
        cuisine = catering_data.get('cuisine') or raw_data.get('cuisine')
        
        if not cuisine:
            return None
        
        # If cuisine is a string, convert to list
        if isinstance(cuisine, str):
            return [cuisine]
        return cuisine if isinstance(cuisine, list) else None

    @staticmethod
    def parse_opening_hours(properties: dict) -> Optional[str]:
        # Try to get opening_hours from raw data
        raw_data = properties.get('datasource', {}).get('raw', {})
        opening_hours = raw_data.get('opening_hours')
        
        return opening_hours if isinstance(opening_hours, str) else None

    @staticmethod
    async def get_points(city: str, lat: float, lng: float, category: str, type: str, radius: int = 5000, limit: int = 30) -> List[PointOfInterestResponse]:
        filter_string = f"circle:{lng},{lat},{radius}"
        categories = category.replace('%2C', ',')
        params = {
            "categories": categories,
            "filter": filter_string,
            "apiKey": GeoapifyService.API_KEY,
            "limit": limit
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(GeoapifyService.BASE_URL, params=params)
                try:
                    response.raise_for_status()
                    data = response.json()
                except httpx.HTTPStatusError as e:
                    print(f"""
                        Geoapify API Error:
                        Status Code: {e.response.status_code}
                        URL: {e.request.url}
                        Response Text: {e.response.text}
                        Headers: {e.response.headers}
                    """)
                    raise HTTPException(
                        status_code=500, 
                        detail=f"API Error: {e.response.status_code} - {e.response.text}"
                    )
                except ValueError as e:
                    print(f"JSON Parsing Error: {str(e)}\nResponse Content: {response.text}")
                    raise HTTPException(
                        status_code=500, 
                        detail="Failed to parse API response"
                    )

                if not isinstance(data, dict) or 'features' not in data:
                    print(f"Unexpected response format: {data}")
                    raise ValueError("Invalid response format from API")

                seen_names = set()
                places = []

                for feature in data['features']:
                    properties = feature.get('properties', {})
                    name = properties.get('name', '')
                    
                    if name.lower() in seen_names:
                        continue
                        
                    seen_names.add(name.lower())
                    geometry = feature.get('geometry', {})
                    coordinates = geometry.get('coordinates', [])

                    # Parse properties
                    opening_hours = GeoapifyService.parse_opening_hours(properties)
                    cuisine = GeoapifyService.parse_cuisine(properties)

                    place = PointOfInterestResponse(
                        id=properties.get('place_id', ''),
                        place_id=properties.get('place_id', ''),
                        name=name,
                        phone=properties.get('contact', {}).get('phone', ''),
                        website=properties.get('website', ''),
                        wikidata_id=properties.get('wiki_and_media', {}).get('wikidata', ''),
                        description=properties.get('description', ''),
                        opening_hours=opening_hours,
                        cuisine=cuisine,
                        type = type,
                        categories=properties.get('categories', []),
                        address=properties.get('address_line2', ''), 
                        city=properties.get('city', city),
                        country=properties.get('country', ''),
                        coordinates=Coordinates(
                            lat=coordinates[1],
                            lng=coordinates[0]
                        )
                    )
                    places.append(place)

                return places[:limit]

        except httpx.RequestError as e:
            print(f"""
                Request Failed:
                Error Type: {type(e).__name__}
                Error: {str(e)}
                URL: {e.request.url if e.request else 'N/A'}
                Method: {e.request.method if e.request else 'N/A'}
            """)
            raise HTTPException(
                status_code=500,
                detail=f"Request failed: {str(e)}"
            )
        except Exception as e:
            print(f"""
                Unexpected Error:
                Error Type: {type(e).__name__}
                Error: {str(e)}
                Traceback: {traceback.format_exc()}
            """)
            raise HTTPException(
                status_code=500,
                detail=f"Internal server error: {str(e)}"
            )