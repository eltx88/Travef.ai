import logging
import json
import re
from fastapi import HTTPException
from services.groq_service import GroqService
from services.googleplaces_service import GooglePlacesService
from models.tripgeneration import TripGenerationRequest
from models.groq_model import ChatRequest, ChatMessage, MessageRole
from models.googleplaces import Place

logger = logging.getLogger(__name__)

class TripGenerationService:
    def __init__(self):
        self.groq_service = GroqService()
        self.places_service = GooglePlacesService()

    async def _ensure_sufficient_places(
        self,
        current_places: list,
        city_lat: float,
        city_lng: float,
        preferences: list[str],
        place_type: str,
        additional_places_needed: int
    ) -> list:
        try:
            attraction_type_mapping = {
                'Museum': ['museum'],
                'Shopping Malls': ['shopping_mall'],
                'Art Gallery': ['art_gallery'],
                'Theatre': ['performing_arts_theater'],
                'Cultural': ['cultural_landmark'],
                'Historical': ['historical_place'],
                'National Park' : ['national_park'],
                'Gardens' : ['garden'],
                'Zoo' : ['zoo']
            }
            restaurant_type_mapping = {
                'Italian': ['italian_restaurant'],
                'Chinese': ['chinese_restaurant'],
                'Japanese': ['japanese_restaurant'],
                'Thai': ['thai_restaurant'],
                'Indian': ['indian_restaurant'],
                'Mediterranean': ['mediterranean_restaurant'],
                'French': ['french_restaurant'],
                'Greek': ['greek_restaurant'],
                'Mexican': ['mexican_restaurant'],
                'Korean': ['korean_restaurant'],
                'Vietnamese': ['vietnamese_restaurant'],
                'Burger': ['hamburger_restaurant'],
                'Asian': ['asian_restaurant'],
                'American': ['american_restaurant'],
                'Seafood': ['seafood_restaurant'],
                'Steakhouse': ['steak_house'],
                'Vegetarian': ['vegetarian_restaurant'],
                'Breakfast': ['breakfast_restaurant'],
                'Brunch': ['brunch_restaurant'],
                'Bakery': ['bakery'],
                'Cafe': ['cafe'],
                'Coffee': ['coffee_shop'],
                'Dessert': ['dessert_shop'],
                'Ice Cream': ['ice_cream_shop'],
                'Bar': ['bar'],
                'pub' : ['pub'],
                'wine' :['wine_bar']
            }

            # Pre-compute sets for deduplication
            existing_locations = {
                (round(poi.coordinates.lat, 3), round(poi.coordinates.lng, 3))
                for poi in current_places
            }
            existing_names = {
                poi.name.strip().lower()
                for poi in current_places
            }
            
            additional_places = []
            
            # Step 1: Try to get places based on preferences if available
            matching_preferences = []
            if preferences and additional_places_needed > 0:
                # Get relevant mapping based on place type
                type_mapping = None
                if place_type == "tourist_attraction":
                    type_mapping = attraction_type_mapping
                elif place_type == "restaurant" or place_type == "cafe":
                    type_mapping = restaurant_type_mapping
                    
                # Find matching preferences
                if type_mapping:
                    for pref in preferences:
                        if pref in type_mapping:
                            matching_preferences.append(type_mapping[pref])

                # Try to get places based on preferences
                if matching_preferences:
                    additional_places = await self._search_places_by_types(
                        matching_preferences,
                        city_lat,
                        city_lng,
                        place_type,
                        existing_names,
                        existing_locations,
                        additional_places_needed
                    )
            
            # Step 2: Fall back to generic search if needed
            remaining_places_needed = additional_places_needed - len(additional_places)
            if remaining_places_needed > 0:
                generic_places = await self._generic_place_search(
                    city_lat,
                    city_lng,
                    place_type,
                    existing_names,
                    existing_locations,
                    remaining_places_needed
                )
                additional_places.extend(generic_places)
            
            return additional_places

        except Exception as e:
            logger.error(f"Error getting additional places: {str(e)}")
            return []

    async def _search_places_by_types(
        self,
        type_lists,
        city_lat,
        city_lng,
        place_type,
        existing_names,
        existing_locations,
        max_places_needed
    ):
        """Helper method to search places by specific types."""
        additional_places = []
        
        # Define types to exclude based on place_type
        excluded_types = self._get_excluded_types_for_place_type(place_type)
        
        for types in type_lists:
            if len(additional_places) >= max_places_needed:
                break
            
            suggested_places = self.places_service.nearby_search(
                latitude=city_lat,
                longitude=city_lng,
                radius=3000,
                type=types,
                excluded_types=excluded_types,
                max_results=20
            )
            
            for place in suggested_places:
                if len(additional_places) >= max_places_needed:
                    break
                
                if self._is_valid_place(place, place_type, existing_names, existing_locations):
                    new_poi = self._create_poi_dict(place, place_type)
                    additional_places.append(new_poi)
                    
                    # Update tracking sets
                    existing_locations.add((round(place.location.latitude, 3), round(place.location.longitude, 3)))
                    existing_names.add(place.name.strip().lower())
        
        return additional_places

    async def _generic_place_search(
        self,
        city_lat,
        city_lng,
        place_type,
        existing_names,
        existing_locations,
        max_places_needed
    ):
        """Helper method for generic place search by place_type."""
        additional_places = []
        
        # Define types to exclude based on place_type
        excluded_types = self._get_excluded_types_for_place_type(place_type)
        
        # Define backup types based on place_type
        backup_types = []
        if place_type == "restaurant":
            backup_types = [
                "meal_takeaway", "meal_delivery", "food", 
                "fast_food_restaurant", "fine_dining_restaurant",
                "breakfast_restaurant", "brunch_restaurant"
            ]
        elif place_type == "cafe":
            backup_types = [
                "bakery", "coffee_shop", "tea_house", 
                "breakfast_restaurant", "juice_shop"
            ]
        
        # Initial search with provided place_type
        suggested_places = self.places_service.nearby_search(
            latitude=city_lat,
            longitude=city_lng,
            radius=3000,
            type=place_type,
            excluded_types=excluded_types,
            max_results=20  
        )
        
        for place in suggested_places:
            if len(additional_places) >= max_places_needed:
                break
            
            if self._is_valid_place(place, place_type, existing_names, existing_locations):
                new_poi = self._create_poi_dict(place, place_type)
                additional_places.append(new_poi)
                
                # Update tracking sets
                existing_locations.add((round(place.location.latitude, 3), round(place.location.longitude, 3)))
                existing_names.add(place.name.strip().lower())
        
        # If we didn't get enough places, try backup types
        if len(additional_places) < max_places_needed and backup_types:
            remaining_needed = max_places_needed - len(additional_places)
            
            for backup_type in backup_types:
                if len(additional_places) >= max_places_needed:
                    break
                    
                backup_places = self.places_service.nearby_search(
                    latitude=city_lat,
                    longitude=city_lng,
                    radius=3000,
                    type=backup_type,
                    excluded_types=excluded_types,
                    max_results=20
                )
                
                for place in backup_places:
                    if len(additional_places) >= max_places_needed:
                        break
                    
                    if self._is_valid_place(place, place_type, existing_names, existing_locations):
                        new_poi = self._create_poi_dict(place, place_type)
                        additional_places.append(new_poi)
                        
                        # Update tracking sets
                        existing_locations.add((round(place.location.latitude, 3), round(place.location.longitude, 3)))
                        existing_names.add(place.name.strip().lower())
        
        # Last resort: try a more generic text search if we still don't have enough places
        if len(additional_places) < max_places_needed:
            remaining_needed = max_places_needed - len(additional_places)
            
            # Use a text search with general terms
            search_term = "restaurant" if place_type == "restaurant" else "cafe"
            try:
                text_results = self.places_service.text_search(
                    query=search_term,
                    latitude=city_lat,
                    longitude=city_lng,
                    radius=3000,
                    max_results=remaining_needed
                )
                
                for place in text_results:
                    if len(additional_places) >= max_places_needed:
                        break
                    
                    if self._is_valid_place(place, place_type, existing_names, existing_locations):
                        new_poi = self._create_poi_dict(place, place_type)
                        additional_places.append(new_poi)
                        
                        # Update tracking sets
                        existing_locations.add((round(place.location.latitude, 3), round(place.location.longitude, 3)))
                        existing_names.add(place.name.strip().lower())
            except:
                # If text search fails, just continue
                pass
        
        return additional_places

    def _is_valid_place(self, place, place_type, existing_names, existing_locations):
        """Check if a place is valid based on duplication and type criteria."""
        # Check for duplicate name
        normalized_name = place.name.strip().lower()
        if normalized_name in existing_names:
            return False
        
        # Check for places at same location
        rounded_location = (round(place.location.latitude, 3), round(place.location.longitude, 3))
        if rounded_location in existing_locations:
            return False
        
        # STRICT FILTERING FOR CAFES - only accept places with specific primary_types
        if place_type == "cafe":
            # For cafes, ONLY accept if primary_type is one of these specific types
            cafe_specific_types = ["cafe", "coffee_shop", "bakery"]
            
            # If primary_type is None or not in our specific list, reject
            if not place.primary_type or place.primary_type not in cafe_specific_types:
                return False
            
            return True
        
        # For restaurants, more flexible type checking
        elif place_type == "restaurant":
            restaurant_types = [
                "restaurant", "american_restaurant", "asian_restaurant", "barbecue_restaurant",
                "brazilian_restaurant", "chinese_restaurant", "dessert_restaurant", 
                "fast_food_restaurant", "fine_dining_restaurant", "french_restaurant", 
                "greek_restaurant", "hamburger_restaurant", "indian_restaurant", 
                "indonesian_restaurant", "italian_restaurant", "japanese_restaurant", 
                "korean_restaurant", "lebanese_restaurant", "mediterranean_restaurant", 
                "mexican_restaurant", "middle_eastern_restaurant", "pizza_restaurant", 
                "ramen_restaurant", "seafood_restaurant", "spanish_restaurant", 
                "steak_house", "sushi_restaurant", "thai_restaurant", "turkish_restaurant", 
                "vegan_restaurant", "vegetarian_restaurant", "vietnamese_restaurant"
            ]
            
            # First check primary_type if available
            if place.primary_type:
                if place.primary_type in restaurant_types or place.primary_type.endswith("restaurant"):
                    # Explicitly exclude places that could be cafes
                    cafe_specific_types = ["cafe", "coffee_shop", "bakery"]
                    if place.primary_type in cafe_specific_types:
                        return False
                    return True
            
            # If we get here, the primary type wasn't clearly a restaurant, reject
            return False
        
        # For attraction or other types, always return true (no filtering)
        elif place_type == "tourist_attraction":
            return True
        
        return False

    def _create_poi_dict(self, place, place_type):
        """Create a standardized POI dictionary from a place object."""
        return {
            'place_id': place.place_id,
            'name': place.name.strip(),
            'type': 'attraction' if place_type == "tourist_attraction" else place_type,
            'coordinates': {
                'lat': place.location.latitude,
                'lng': place.location.longitude
            }
        }

    async def generate_trip(self, request: TripGenerationRequest) -> str:
        try:
            num_days = request.trip_data.monthly_days
            required_breakfast_places = num_days
            required_restaurant_places = num_days * 2 
            required_attraction_places = num_days * 2

            existing_breakfast_places = []
            existing_restaurant_places = []
            existing_attraction_places = []
            suggested_breakfast_places = []
            suggested_restaurant_places = []
            suggested_attraction_places = []

            for poi in request.foodpois:
                if poi.type in ['cafe']:
                    existing_breakfast_places.append(poi)
                elif poi.type == 'restaurant':
                    existing_restaurant_places.append(poi)

            existing_breakfast_places = request.cafepois
            existing_attraction_places = request.attractionpois

            # Calculate additional places needed (prevent negative numbers)
            additional_breakfast_needed = max(0, required_breakfast_places - len(existing_breakfast_places))
            additional_restaurant_needed = max(0, required_restaurant_places - len(existing_restaurant_places))
            additional_attractions_needed = max(0, required_attraction_places - len(existing_attraction_places))
            
            # Get additional breakfast places if needed
            if additional_breakfast_needed > 0:
                suggested_breakfast_places = await self._ensure_sufficient_places(
                    current_places=existing_breakfast_places,
                    city_lat=request.trip_data.coordinates.lat,
                    city_lng=request.trip_data.coordinates.lng,
                    preferences=request.trip_data.food_preferences,
                    place_type="cafe",
                    additional_places_needed=additional_breakfast_needed
                )
            
            # Get additional restaurant places if needed
            if additional_restaurant_needed > 0:
                suggested_restaurant_places = await self._ensure_sufficient_places(
                    current_places=existing_restaurant_places,
                    city_lat=request.trip_data.coordinates.lat,
                    city_lng=request.trip_data.coordinates.lng,
                    preferences=request.trip_data.food_preferences,
                    place_type="restaurant",
                    additional_places_needed=additional_restaurant_needed
                )
            
            if additional_attractions_needed > 0:
                suggested_attraction_places = await self._ensure_sufficient_places(
                    current_places=existing_attraction_places,
                    city_lat=request.trip_data.coordinates.lat,
                    city_lng=request.trip_data.coordinates.lng,
                    preferences=request.trip_data.interests,
                    place_type="tourist_attraction",
                    additional_places_needed=additional_attractions_needed  
                )
            
            # Create prompt with updated request data
            prompt = self._create_prompt(request, existing_breakfast_places, existing_restaurant_places, existing_attraction_places, suggested_breakfast_places, suggested_restaurant_places, suggested_attraction_places)
            
            # Create ChatRequest
            chat_request = ChatRequest(
                messages=[
                    ChatMessage(
                        role=MessageRole.SYSTEM,
                        content="You are a travel itinerary planner. Generate a detailed day-by-day itinerary in JSON. Only output the JSON string and no other text "
                    ),
                    ChatMessage(
                        role=MessageRole.USER,
                        content=prompt
                    )
                ],
                stream=False
            )
            
            # Get completion from Groq
            completion = await self.groq_service.create_chat_completion(chat_request)
    
            # Extract content between backticks
            pattern = r'```\s*(.*?)\s*```'
            match = re.search(pattern, completion.content, re.DOTALL)
            if match:
                json_str = match.group(1)
                
                if json_str.startswith('json'):
                    json_str = json_str[4:].strip()
                itinerary_dict = json.loads(json_str)
                itinerary_json = json.dumps(itinerary_dict)
                return itinerary_json

            else:
                logger.error("No json content found in groq response")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to extract valid json from GROQ response"
                )

        except Exception as e:
            logger.error(f"Error generating trip: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Error generating trip: {str(e)}"
            )

    def _create_prompt(self, request: TripGenerationRequest, cafes: list, restaurants: list, attractions: list, suggested_cafes: list, suggested_restaurants: list, suggested_attractions: list) -> str:
        try:
            date_info = f"from {request.trip_data.fromDT} to {request.trip_data.toDT}"
            num_days = request.trip_data.monthly_days
            
            # Initialize lists for all places
            all_attractions = []
            all_restaurants = []
            all_cafes = []

            # Helper function to format place string
            def format_place(poi, place_type):
                if isinstance(poi, Place):
                    return f"- ID: {poi.place_id}, {poi.name} ({place_type}) - Located at lat: {poi.location.latitude}, lng: {poi.location.longitude}"
                elif isinstance(poi, dict):
                    return f"- ID: {poi['place_id']}, {poi['name']} ({place_type}) - Located at lat: {poi['coordinates']['lat']}, lng: {poi['coordinates']['lng']}"
                else:
                    return f"- ID: {poi.place_id}, {poi.name} ({place_type}) - Located at lat: {poi.coordinates.lat}, lng: {poi.coordinates.lng}"

            # Add selected and suggested attractions
            for poi in attractions:
                all_attractions.append(format_place(poi, "attraction"))
            for poi in suggested_attractions:
                all_attractions.append(format_place(poi, "attraction"))

            # Add selected and suggested restaurants
            for poi in restaurants:
                all_restaurants.append(format_place(poi, "restaurant"))
            for poi in suggested_restaurants:
                all_restaurants.append(format_place(poi, "restaurant"))

            # Add selected and suggested cafes
            for poi in cafes:
                all_cafes.append(format_place(poi, "cafe"))
            for poi in suggested_cafes:
                all_cafes.append(format_place(poi, "cafe"))

            # Create combined sections
            attractions_section = "Available attraction list:\n" + "\n".join(all_attractions) if all_attractions else "No attractions available"
            restaurants_section = "Available restaurant list:\n" + "\n".join(all_restaurants) if all_restaurants else "No restaurants available"
            cafes_section = "Available cafe list:\n" + "\n".join(all_cafes) if all_cafes else "No cafes available"
            return f"""Create a detailed {num_days}-day itinerary for {request.trip_data.city}, {request.trip_data.country} {date_info}.

    {attractions_section}

    {restaurants_section}

    {cafes_section}

    1. Return the response in valid JSON format with the exact structure shown below:
    {{  
    "Day 1": {{  
        "Morning": {{  
            "POI": {{  
                "place_id_1": {{  
                    "name": "Cafe Name",  
                    "type": "cafe",  
                    "duration": "1.5 hours",  
                    "StartTime": "8:00",  
                    "EndTime": "9:00",  
                    "coordinates": {{  
                        "lat": 53.4808,  
                        "lng": -2.2426  
                    }}  
                }},  
                "place_id_2": {{  
                    "name": "Attraction Name",  
                    "type": "attraction",  
                    "duration": "2 hours",  
                    "StartTime": "9:30",  
                    "EndTime": "11:30",  
                    "coordinates": {{  
                        "lat": 53.4808,  
                        "lng": -2.2426  
                    }}  
                }}  
            }}  
        }},  
        "Afternoon": {{  
            "POI": {{  
                "place_id_3": {{  
                    "name": "Restaurant Name",  
                    "type": "restaurant",  
                    "duration": "1.5 hours",  
                    "StartTime": "12:00",  
                    "EndTime": "13:30",  
                    "coordinates": {{  
                        "lat": 53.4808,  
                        "lng": -2.2426  
                    }}  
                }},  
                "place_id_4": {{  
                    "name": "Attraction Name",  
                    "type": "attraction",  
                    "duration": "2 hours",  
                    "StartTime": "14:00",  
                    "EndTime": "16:00",  
                    "coordinates": {{  
                        "lat": 53.4808,  
                        "lng": -2.2426  
                    }}  
                }}  
            }}  
        }},  
        "Evening": {{  
            "POI": {{  
                "place_id_5": {{  
                    "name": "Restaurant Name",  
                    "type": "restaurant",  
                    "duration": "1.5 hours",  
                    "StartTime": "18:30",  
                    "EndTime": "20:00",  
                    "coordinates": {{  
                        "lat": 53.4808,  
                        "lng": -2.2426  
                    }}  
                }}  
            }}  
        }}  
    }},  
    "Unused": {{  
        "Attractions": [  
            {{  
                "place_id": "id_1",  
                "name": "attraction name",
                "type": "attraction"
            }}  
        ],  
        "Restaurants": [  
            {{  
                "place_id": "id_2",  
                "name": "restaurant name",
                "type": "restaurant"
            }}  
        ]  
    }}  
}}

    2. IMPORTANT Rules:
    - Each place_id from the available attractions, restaurants and cafes MUST be used EXACTLY ONCE in the entire itinerary
    - DO NOT reuse any place_id or create new ones - only use place_ids from the available attractions, restaurants and cafes lists
    - Each place must appear in its designated type (cafe for breakfast, restaurant for lunch/dinner)
    - Each Morning starts with breakfast from Available cafe list (8:00-9:00)
    - Each Afternoon starts with lunch from Available restaurant list (12:00-14:00)
    - Each Evening starts with dinner from Available restaurant list (18:30-20:30)
    - The "Unused" section must contain only place_ids from the available attractions, restaurants and cafes lists that were NOT used in the json itinerary

    3. Location-based planning:
    - Use the provided coordinates to optimize the route
    - Group nearby attractions together to minimize travel time
    - Allow 15 minutes per kilometer for travel time between locations

    4. Timing Guidelines:
    - Morning activities: 8:00-12:00
    - Afternoon activities: 12:00-18:00
    - Evening activities: 18:00-22:00
    - Attractions: 2-3 hours per visit
    - Meals: 1-2 hours per meal

    5. Unused Section Rules:
    - List all unused place IDs in their respective categories
    - If all places are used, return empty arrays

    Before returning the response:
    - Verify NO DUPLICATE place_ids appear in the itinerary
    - Verify that all place_ids and name in the itinerary match the available attraction, restaurant and cafe lists exactly. If any mismatches are found, correct them before returning the response
    - Confirm each place is used in its correct type (cafe/restaurant/attraction) and only 2 restaurants and 1 cafe per day are used
    - Any itinerary that contains mismatched or repeated place_ids will be considered invalid and must be corrected before submission."
    - Check the Unused section only contains truly unused places"""
        except Exception as e:
            logger.error(f"Error creating prompt: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create prompt")

    def _get_excluded_types_for_place_type(self, place_type):
        """Get a list of excluded types based on the place type being searched."""
        # Common excluded types for all food establishments
        common_excluded_types = [
            "hotel", "lodging", "motel", "resort_hotel", "bed_and_breakfast", 
            "inn", "guest_house", "department_store", "shopping_mall"
        ]
        
        if place_type == "cafe":
            # Additional exclusions specific to cafes
            return common_excluded_types + [
                "art_gallery", "art_studio", "auditorium", "cultural_landmark",
                "historical_place", "monument", "museum", "performing_arts_theater",
                "sculpture", "restaurant"  # Exclude restaurants from cafe results
            ]
        elif place_type == "restaurant":
            # Additional exclusions for restaurants
            return common_excluded_types + [
                "cafe", "coffee_shop", "bakery"  # Exclude cafes from restaurant results
            ]
        else:
            # For attractions or other types, use a different set of exclusions if needed
            return [] if place_type == "tourist_attraction" else common_excluded_types