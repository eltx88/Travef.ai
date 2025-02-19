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
                            
            existing_ids = {poi.place_id for poi in current_places}
            existing_names = {poi.name.strip().lower() for poi in current_places}

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
                        normalized_name = place.name.strip().lower()
                        
                        # Skip if place_id or name already exists
                        if (place.place_id in existing_ids or 
                            normalized_name in existing_names):
                            logger.debug(f"Skipping duplicate place: {place.name}")
                            continue

                        # Check primary type matches
                        if place_type == "cafe" and place.primary_type not in ["cafe", "coffee_shop", "bakery"]:
                            continue
                        elif place_type == "restaurant" and place.primary_type != "restaurant":
                            continue

                        # Add new place
                        new_poi = {
                            'place_id': place.place_id,
                            'name': place.name.strip(),
                            'type': place_type,
                            'coordinates': {
                                'lat': place.location.latitude,
                                'lng': place.location.longitude
                            }
                        }
                        additional_places.append(new_poi)
                        
                        # Update tracking sets
                        existing_ids.add(place.place_id)
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
                    normalized_name = place.name.strip().lower()
                    
                    # Skip if place_id or name already exists
                    if (place.place_id in existing_ids or 
                        normalized_name in existing_names):
                        continue

                    # Check primary type matches
                    if place_type == "cafe" and place.primary_type not in ["cafe", "coffee_shop", "bakery"]:
                        continue
                    elif place_type == "restaurant" and place.primary_type != "restaurant":
                        continue

                    # Add new place
                    new_poi = {
                        'place_id': place.place_id,
                        'name': place.name.strip(),
                        'type': place_type,
                        'coordinates': {
                            'lat': place.location.latitude,
                            'lng': place.location.longitude
                        }
                    }
                    additional_places.append(new_poi)
                    
                    # Update tracking sets
                    existing_ids.add(place.place_id)
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
            required_attraction_places = num_days * 3

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
            date_info = f"from {request.trip_data.date_range.from_date} to {request.trip_data.date_range.to}"
            num_days = request.trip_data.monthly_days
            
            # Initialize separate lists for existing and suggested places
            selected_attraction_list = []
            suggested_attraction_list = []
            selected_cafe_list = []
            suggested_cafe_list = []
            selected_restaurant_list = []
            suggested_restaurant_list = []

            for poi in attractions:
                if isinstance(poi, Place):  
                    selected_attraction_list.append(
                        f"- ID: {poi.place_id}, {poi.name} (Attraction) - Located at lat: {poi.location.latitude}, lng: {poi.location.longitude}"
                    )
                else: 
                    selected_attraction_list.append(
                        f"- ID: {poi.place_id}, {poi.name} (Attraction) - Located at lat: {poi.coordinates.lat}, lng: {poi.coordinates.lng}"
                    )

            for poi in suggested_attractions:
                suggested_attraction_list.append(
                    f"- ID: {poi['place_id']}, {poi['name']} (Attraction) - Located at lat: {poi['coordinates']['lat']}, lng: {poi['coordinates']['lng']}"
                )

            for poi in restaurants:
                if isinstance(poi, Place): 
                    selected_restaurant_list.append(
                        f"- ID: {poi.place_id}, {poi.name} (Restaurant) - Located at lat: {poi.location.latitude}, lng: {poi.location.longitude}"
                    )
                else: 
                    selected_restaurant_list.append(
                        f"- ID: {poi.place_id}, {poi.name} (Restaurant) - Located at lat: {poi.coordinates.lat}, lng: {poi.coordinates.lng}"
                    )

            for poi in suggested_restaurants:
                suggested_restaurant_list.append(
                    f"- ID: {poi['place_id']}, {poi['name']} (Restaurant) - Located at lat: {poi['coordinates']['lat']}, lng: {poi['coordinates']['lng']}"
                )

            for poi in cafes:
                if isinstance(poi, Place):
                    selected_cafe_list.append(
                        f"- ID: {poi.place_id}, {poi.name} (Cafe) - Located at lat: {poi.location.latitude}, lng: {poi.location.longitude}"
                    )
                else:  # POI model
                    selected_cafe_list.append(
                        f"- ID: {poi.place_id}, {poi.name} (Cafe) - Located at lat: {poi.coordinates.lat}, lng: {poi.coordinates.lng}"
                    )

            for poi in suggested_cafes:
                suggested_cafe_list.append(
                    f"- ID: {poi['place_id']}, {poi['name']} (Cafe) - Located at lat: {poi['coordinates']['lat']}, lng: {poi['coordinates']['lng']}"
                )
            
            # Create separate sections for selected and suggested places
            selected_attractions_section = "Selected Attractions:\n" + "\n".join(selected_attraction_list) if selected_attraction_list else "No selected attractions"
            suggested_attractions_section = "Suggested Attractions:\n" + "\n".join(suggested_attraction_list) if suggested_attraction_list else "No suggested attractions"
            
            selected_restaurants_section = "Selected Restaurants:\n" + "\n".join(selected_restaurant_list) if selected_restaurant_list else "No selected restaurants"
            suggested_restaurants_section = "Suggested Restaurants:\n" + "\n".join(suggested_restaurant_list) if suggested_restaurant_list else "No suggested restaurants"
            
            selected_cafes_section = "Selected Cafes:\n" + "\n".join(selected_cafe_list) if selected_cafe_list else "No selected cafes"
            suggested_cafes_section = "Suggested Cafes:\n" + "\n".join(suggested_cafe_list) if suggested_cafe_list else "No suggested cafes"
            
            interests_section = "User Interests:\n- " + "\n- ".join(request.trip_data.interests) if request.trip_data.interests else "No specific interests"
            food_prefs_section = "Food Preferences:\n- " + "\n- ".join(request.trip_data.food_preferences) if request.trip_data.food_preferences else "No specific food preferences"

            return f"""Create a detailed {num_days}-day itinerary for {request.trip_data.city}, {request.trip_data.country} {date_info}.

{selected_attractions_section}

{suggested_attractions_section}

{selected_restaurants_section}

{suggested_restaurants_section}

{selected_cafes_section}

{suggested_cafes_section}

{interests_section}

{food_prefs_section}

1. Return the response in valid JSON format with the exact structure shown below but values of name, duration, StartTime, EndTime, coordinates will be different:
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
                "name": "attraction name"  
            }}  
        ],  
        "Restaurants": [  
            {{  
                "place_id": "id_2",  
                "name": "restaurant name"  
            }}  
        ]  
    }}  
}}  

2. IMPORTANT Rules:
- Use ONLY the places provided in the attractions, cafes and restaurants sections
- Each place MUST be used EXACTLY ONCE in the entire itinerary
- Each Morning starts with breakfast from Selected Cafes or Suggested Cafes section(8:00-9:00)
- Each Afternoon starts with lunch from Selected Restaurants or Suggested Restaurants section(12:00-14:00)
- Each Evening starts with dinner from Selected Restaurants or Suggested Restaurants section(18:30-20:30)
- The "Unused" section ONLY contain place_ids that were NOT used anywhere in the generated itinerary

3. Location-based planning:
- Use the provided coordinates to optimize the route
- Group nearby attractions together to minimize travel time
- Calculate realistic travel times between locations (15 minutes per kilometer walking)

4. Timing Guidelines:
- Morning activities: 8:00-12:00
- Afternoon activities: 12:00-18:00
- Evening activities: 18:00-22:00
- For attractions, specify realistic visit durations

5. Unused Section Rules:
- Only include attractions that were NOT used in any day's itinerary
- Verify that each place in the Unused section is truly not used in the itinerary
- If all places are used in the itinerary, return empty arrays for both Unused categories

Validate the JSON structure, ensure NO DUPLICATE PLACES, and verify the Unused section is correct before returning the response."""
        except Exception as e:
            logger.error(f"Error creating prompt: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create prompt")