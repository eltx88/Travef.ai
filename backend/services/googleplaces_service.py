import os
import requests
from typing import List, Optional, Dict
from models.googleplaces import Place

class GooglePlacesService:
    def __init__(self):
        self.api_key = os.environ.get("GOOGLE_PLACES_API_KEY")
        self.base_url = "https://places.googleapis.com/v1/places"

    def nearby_search(
        self,
        latitude: float,
        longitude: float,
        radius: float = 1000,
        type: Optional[str] = None,
        max_results: int = 10
    ) -> List[Place]:
        """
        Perform a Nearby Search using the latest Places API.
        """
        url = f"{self.base_url}:searchNearby"
        
        # Construct the request body according to new API format
        request_body = {
            "includedTypes": [type] if type else ["restaurant"],  # Default to restaurant if no type specified
            "maxResultCount": max_results,
            "locationRestriction": {
                "circle": {
                    "center": {
                        "latitude": latitude,
                        "longitude": longitude
                    },
                    "radius": float(radius)
                }
            }
        }

        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": f"{self.api_key}",
            "X-Goog-FieldMask": (
                "places.id,"
                "places.displayName,"
                "places.formattedAddress,"
                "places.location,"
                "places.rating,"
                "places.userRatingCount,"
                "places.types,"
                "places.photos,"
                "places.primaryType,"
                "places.businessStatus"
            )
        }
        try:
            response = requests.post(url, json=request_body, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            places = []
            for result in data.get("places", []):
                place = Place(
                    place_id=result.get("id"),
                    name=result.get("displayName", {}).get("text", ""),
                    formatted_address=result.get("formattedAddress"),
                    types=result.get("types", []),
                    primary_type=result.get("primaryType"),
                    rating=result.get("rating"),
                    user_ratings_total=result.get("userRatingCount"),
                    photo_name=result.get("photos", [{}])[0].get("name") if result.get("photos") else None,
                    location={
                        "latitude": result.get("location", {}).get("latitude"),
                        "longitude": result.get("location", {}).get("longitude")
                    },
                    business_status=result.get("businessStatus")
                )
                places.append(place)

            return places

        except requests.exceptions.RequestException as e:
            print(f"Error making Places API request: {str(e)}")
            raise

    def get_place_photo(self, photo_name: str, max_width: int = 400, max_height: int = 400) -> Optional[str]:
        """
        Get a place photo using the photo reference.
        Returns the photo URL or None if the request fails.
        """
        try:
            url = f"https://places.googleapis.com/v1/{photo_name}/media"
            
            params = {
                "key": self.api_key,
                "maxWidthPx": max_width,
                "maxHeightPx": max_height,
            }

            response = requests.get(url, params=params, allow_redirects=False)
            
            # Google Places Photo API returns a 302 redirect to the actual image URL
            if response.status_code == 302:
                return response.headers.get('Location')
            
            return None

        except requests.exceptions.RequestException as e:
            print(f"Error fetching place photo: {str(e)}")
            return None