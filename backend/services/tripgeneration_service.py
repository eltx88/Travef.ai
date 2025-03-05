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
            matching_preferences = []
            suggested_places = []
            additional_places = []

            if preferences:
                if place_type == "tourist_attraction":
                    for pref in preferences:
                        if pref in attraction_type_mapping:
                            matching_preferences.append(attraction_type_mapping[pref])
                
                elif place_type == "restaurant":
                    for pref in preferences:
                        if pref in restaurant_type_mapping:
                            matching_preferences.append(restaurant_type_mapping[pref])

            # Pre-compute rounded coordinates (3 decimal places) for current places
            existing_locations = {
                (round(poi.coordinates.lat, 3), round(poi.coordinates.lng, 3))
                for poi in current_places
            }

            # Pre-compute normalized names
            existing_names = {
                poi.name.strip().lower()
                for poi in current_places
            }

            if matching_preferences:
                for types in matching_preferences:
                    if len(additional_places) >= additional_places_needed:
                        break

                    suggested_places = self.places_service.nearby_search(
                        latitude=city_lat,
                        longitude=city_lng,
                        radius=3000,
                        type=types,
                        max_results=20
                    )

                    for place in suggested_places:
                        # Check for duplicate names
                        normalized_name = place.name.strip().lower()
                        if normalized_name in existing_names:
                            continue

                        # Check for places at same location using pre-computed set (3 decimal places)
                        rounded_location = (round(place.location.latitude, 3), round(place.location.longitude, 3))
                        if rounded_location in existing_locations:
                            continue

                        # Check primary type matches
                        if place_type == "cafe" and place.primary_type not in ["cafe", "coffee_shop", "bakery"]:
                            continue
                        elif place_type == "restaurant" and not re.search(r'restaurant$', place.primary_type):
                            continue

                        # Add new place
                        new_poi = {
                            'place_id': place.place_id,
                            'name': place.name.strip(),
                            'type': 'attraction' if place_type == "tourist_attraction" else place_type,
                            'coordinates': {
                                'lat': place.location.latitude,
                                'lng': place.location.longitude
                            }
                        }
                        additional_places.append(new_poi)
                        
                        # Update tracking sets
                        existing_locations.add(rounded_location)
                        existing_names.add(normalized_name)

                        if len(additional_places) >= additional_places_needed:
                            break
            else:
                suggested_places = self.places_service.nearby_search(
                    latitude=city_lat,
                    longitude=city_lng,
                    radius=3000,
                    type=place_type,
                    max_results=20  
                )

                for place in suggested_places:
                    rounded_location = (round(place.location.latitude, 3), round(place.location.longitude, 3))
                    normalized_name = place.name.strip().lower()

                    if normalized_name in existing_names:
                        continue
                    if rounded_location in existing_locations:
                        continue
                    elif place_type == "cafe" and place.primary_type not in ["cafe", "coffee_shop", "bakery"]:
                        continue
                    elif place_type == "restaurant" and not re.search(r'restaurant$', place.primary_type):
                        continue

                    # Add new place
                    new_poi = {
                        'place_id': place.place_id,
                        'name': place.name.strip(),
                        'type': 'attraction' if place_type == "tourist_attraction" else place_type,
                        'coordinates': {
                            'lat': place.location.latitude,
                            'lng': place.location.longitude
                        }
                    }
                    additional_places.append(new_poi)
                    existing_locations.add(rounded_location)
                    existing_names.add(normalized_name)

                    if len(additional_places) >= additional_places_needed:
                        break

            return additional_places

        except Exception as e:
            logger.error(f"Error getting additional places: {str(e)}")
            return []

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

            # # Get additional restaurant places if needed
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
            print(attractions_section)
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