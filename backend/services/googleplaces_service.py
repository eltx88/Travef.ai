import os
import re
import requests
from typing import List, Optional, Dict
from models.googleplaces import Place

class GooglePlacesService:
    def __init__(self):
        self.api_key = os.environ.get("GOOGLE_PLACES_API_KEY")
        self.base_url = "https://places.googleapis.com/v1/places"

    def getExplorePOIs(
        self,
        latitude: float,
        longitude: float,
        radius: float = 2000,
        type: Optional[str] = None,
        max_results: int = 20
    ) -> List[Place]:
        """
        Perform an Explore Search for the Search Query using the Places API.
        """
        types = type.split(',')
        places = []
        existing_place_ids = set() 
        
        for type in types:
            if len(places) >= 30:
                break
            
            suggested_places = self.nearby_search(
                            latitude=latitude,
                            longitude=longitude,
                            radius=radius,
                            type=type,
                            max_results=20
                        )

            for place in suggested_places:
                if place.place_id in existing_place_ids:
                    continue
                # Check primary type matches
                if type == "cafe" and place.primary_type not in ["cafe", "coffee_shop", "bakery"]:
                    continue
                elif type == "restaurant" and not re.search(r'restaurant$', place.primary_type):
                    continue
                
                places.append(place)
                existing_place_ids.add(place.place_id)
        
        return places

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
            "includedTypes": [type] if type else ["restaurant"],  
            "maxResultCount": max_results,
            "rankPreference": "POPULARITY",
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
                "places.businessStatus,"
                "places.websiteUri,"
                "places.editorialSummary,"
                "places.regularOpeningHours,"
                "places.priceLevel"
            )
        }
        try:
            response = requests.post(url, json=request_body, headers=headers)
            response.raise_for_status()
            data = response.json()
            places = []
            for result in data.get("places", []):
                try:
                    # Format opening hours if available
                    formatted_hours = None
                    if "regularOpeningHours" in result:
                        weekday_texts = result.get("regularOpeningHours", {}).get("weekdayDescriptions", [])
                        formatted_hours = "\n".join(weekday_texts) if weekday_texts else None
                    
                    # Extract first photo if available
                    photo_name = None
                    if result.get("photos") and len(result.get("photos")) > 0:
                        photo_name = result.get("photos")[0].get("name")
                    
                    place = Place(
                        place_id=result.get("id"),
                        name=result.get("displayName", {}).get("text", ""),
                        formatted_address=result.get("formattedAddress"),
                        types=result.get("types", []),
                        primary_type=result.get("primaryType"),
                        rating=result.get("rating"),
                        user_ratings_total=result.get("userRatingCount"),
                        photo_name=photo_name,
                        location={
                            "latitude": result.get("location", {}).get("latitude"),
                            "longitude": result.get("location", {}).get("longitude")
                        },
                        website=result.get("websiteUri"),
                        phone=result.get("nationalPhoneNumber"),
                        description=result.get("editorialSummary", {}).get("text") if "editorialSummary" in result else None,
                        opening_hours=formatted_hours,
                        price_level=result.get("priceLevel"),
                        business_status=result.get("businessStatus"),
                        cuisine=result.get("cuisine")
                    )
                    places.append(place)
                except Exception as e:
                    print(f"Error processing place result: {str(e)}")
                    # Continue processing other results even if one fails
                    continue

            return places

        except requests.exceptions.RequestException as e:
            print(f"Error making Places API request: {str(e)}")
            raise

    def get_place_details(self, place_id: str) -> Optional[Dict]:
        """
        Get detailed information for a specific place using Place Details API
        Returns place details or None if the request fails.
        """
        # Skip if not a Google Place ID (should start with "ChI")
        if not place_id.startswith("ChI"):
            return None
            
        try:
            url = f"{self.base_url}/{place_id}"
            
            headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": f"{self.api_key}",
                "X-Goog-FieldMask": (
                    "id,"
                    "displayName,"
                    "formattedAddress,"
                    "location,"
                    "rating,"
                    "userRatingCount,"
                    "types,"
                    "photos,"
                    "primaryType,"
                    "websiteUri,"
                    "internationalPhoneNumber,"
                    "editorialSummary,"
                    "regularOpeningHours,"
                    "priceLevel"
                )
            }
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            # Format opening hours if available
            formatted_hours = None
            if "regularOpeningHours" in data:
                weekday_texts = data.get("regularOpeningHours", {}).get("weekdayDescriptions", [])
                formatted_hours = "\n".join(weekday_texts) if weekday_texts else None
            
            # Extract cuisines from types if available
            cuisine_types = [t for t in data.get("types", []) if t.startswith("cuisine.")]
            cuisines = [t.replace("cuisine.", "").replace("_", " ").title() for t in cuisine_types]
            
            # Get first photo if available
            photo_name = data.get("photos", [{}])[0].get("name") if data.get("photos") else None
            
            place_details = {
                "place_id": data.get("id"),
                "name": data.get("displayName", {}).get("text", ""),
                "formatted_address": data.get("formattedAddress"),
                "coordinates": {
                    "lat": data.get("location", {}).get("latitude"),
                    "lng": data.get("location", {}).get("longitude")
                },
                "types": data.get("types", []),
                "primary_type": data.get("primaryType"),
                "rating": data.get("rating"),
                "user_ratings_total": data.get("userRatingCount"),
                "photo_name": photo_name,
                "website": data.get("websiteUri"),
                "phone": data.get("internationalPhoneNumber"),
                "description": data.get("editorialSummary", {}).get("text") if "editorialSummary" in data else None,
                "opening_hours": formatted_hours,
                "price_level": data.get("priceLevel"),
                "cuisine": cuisines
            }
            
            return place_details
        
        except requests.exceptions.RequestException as e:
            print(f"Error fetching place details: {str(e)}")
            return None

    def batch_get_place_details(self, place_ids: List[str], max_concurrent: int = 5) -> Dict[str, Dict]:
        """
        Get details for multiple places in parallel batches to minimize API calls
        Returns a dictionary of place_id -> place_details
        """
        import concurrent.futures
        
        # Filter out non-Google Place IDs
        valid_place_ids = [pid for pid in place_ids if pid.startswith("ChI")]
        
        results = {}
        
        # Process in batches to avoid too many concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_concurrent) as executor:
            future_to_place_id = {
                executor.submit(self.get_place_details, place_id): place_id 
                for place_id in valid_place_ids
            }
            
            for future in concurrent.futures.as_completed(future_to_place_id):
                place_id = future_to_place_id[future]
                try:
                    place_details = future.result()
                    if place_details:
                        results[place_id] = place_details
                except Exception as e:
                    print(f"Error processing place_id {place_id}: {str(e)}")
        
        return results

    def batch_get_photos(self, place_details_dict: Dict[str, Dict]) -> Dict[str, Dict]:
        """
        Enrich place details with photo URLs
        """
        results = place_details_dict.copy()
        
        for place_id, details in results.items():
            if details.get("photo_name"):
                photo_url = self.get_place_photo(details["photo_name"])
                if photo_url:
                    details["image_url"] = photo_url
        
        return results

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

    def text_search(
        self,
        query: str,
        latitude: float,
        longitude: float, 
        radius: int = 2000,
        type: Optional[str] = None,
        max_results: int = 20,
        open_now: bool = False
    ) -> List[Place]:
        """
        Perform a Text Search using the Places API.
        Returns a list of places matching the search query with location bias.
        """
        url = f"{self.base_url}:searchText"
        
        # Construct the request body according to API format
        request_body = {
            "textQuery": query,
            "maxResultCount": max_results,  # Note: This is deprecated but included for compatibility
            "pageSize": max_results,
            "locationBias": {
                "circle": {
                    "center": {
                        "latitude": latitude,
                        "longitude": longitude
                    },
                    "radius": float(radius)
                }
            }
        }
        
        # Add optional parameters if provided
        if type:
            request_body["includedType"] = type
        
        if open_now:
            request_body["openNow"] = True
        
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
                "places.nationalPhoneNumber,"
                "places.currentOpeningHours,"
                "places.websiteUri,"
                "places.editorialSummary"
            )
        }
        
        try:
            response = requests.post(url, json=request_body, headers=headers)
            response.raise_for_status()
            data = response.json()
            places = []
            
            for result in data.get("places", []):
                try:
                    # Format opening hours if available
                    formatted_hours = None
                    if "currentOpeningHours" in result:
                        weekday_texts = result.get("currentOpeningHours", {}).get("weekdayDescriptions", [])
                        formatted_hours = "\n".join(weekday_texts) if weekday_texts else None
                    
                    # Extract first photo if available
                    photo_name = None
                    if result.get("photos") and len(result.get("photos")) > 0:
                        photo_name = result.get("photos")[0].get("name")
                    
                    # Get location coordinates
                    location = {
                        "latitude": result.get("location", {}).get("latitude"),
                        "longitude": result.get("location", {}).get("longitude")
                    }
                    
                    # Create Place object
                    place = Place(
                        place_id=result.get("id"),
                        name=result.get("displayName", {}).get("text", ""),
                        formatted_address=result.get("formattedAddress"),
                        types=result.get("types", []),
                        primary_type=result.get("primaryType"),
                        rating=result.get("rating"),
                        user_ratings_total=result.get("userRatingCount"),
                        photo_name=photo_name,
                        location=location,
                        website=result.get("websiteUri"),
                        phone=result.get("nationalPhoneNumber"),
                        opening_hours=formatted_hours,
                        description=result.get("editorialSummary", {}).get("text") if "editorialSummary" in result else None,
                        price_level=None,  # Not requested in the field mask
                        business_status=None,  # Not requested in the field mask
                        cuisine=None  # Not available in text search response
                    )
                    places.append(place)
                except Exception as e:
                    print(f"Error processing place result: {str(e)}")
                    # Continue processing other results even if one fails
                    continue
            
            return places
        
        except requests.exceptions.RequestException as e:
            print(f"Error making Places API text search request: {str(e)}")
            raise