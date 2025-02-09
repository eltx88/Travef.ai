import os
import requests
from typing import List, Optional
from  models.googleplaces import Place, PlaceDetails

class GooglePlacesService:
    def __init__(self):
        self.api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
        self.base_url = "https://maps.googleapis.com/maps/api/place"

    def nearby_search(
        self,
        latitude: float,
        longitude: float,
        radius: int = 1000,
        type: Optional[str] = None
    ) -> List[Place]:
        """
        Perform a Nearby Search to find places near a given location.
        """
        url = f"{self.base_url}/nearbysearch/json"
        params = {
            "location": f"{latitude},{longitude}",
            "radius": radius,
            "key": self.api_key
        }
        if type:
            params["type"] = type  # Add type to the request if provided

        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        places = []
        for result in data.get("results", []):
            place = Place(
                place_id=result.get("place_id"),
                name=result.get("name"),
                opening_hours=result.get("opening_hours"),
                vicinity=result.get("vicinity"),
                types=result.get("types", []),
                rating=result.get("rating"),
                user_ratings_total=result.get("user_ratings_total"),
                photos=result.get("photos"),
                geometry=result.get("geometry")
            )
            places.append(place)

        return places

    def get_place_details(self, place_id: str) -> PlaceDetails:
        """
        Retrieve detailed information for a specific place using its place_id.
        """
        url = f"{self.base_url}/details/json"
        params = {
            "place_id": place_id,
            "fields": "name,formatted_address,international_phone_number,website,rating,reviews,photos",
            "key": self.api_key
        }

        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json().get("result", {})

        place_details = PlaceDetails(
            place_id=data.get("place_id"),
            name=data.get("name"),
            formatted_address=data.get("formatted_address"),
            international_phone_number=data.get("international_phone_number"),
            website=data.get("website"),
            rating=data.get("rating"),
            reviews=data.get("reviews"),
            photos=data.get("photos")
        )

        return place_details