import logging
import json
import re
from fastapi import HTTPException
from services.groq_service import GroqService
from models.tripgeneration import TripGenerationRequest
from models.groq_model import ChatRequest, ChatMessage, MessageRole

logger = logging.getLogger(__name__)

class TripGenerationService:
    def __init__(self):
        self.groq_service = GroqService()

    async def generate_trip(self, request: TripGenerationRequest) -> str:
        try:
            # Create prompt with request data
            prompt = self._create_prompt(request)
            logger.info(f"Generated prompt: {prompt}")
            
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

    def _create_prompt(self, request: TripGenerationRequest) -> str:
        try:
            # Format date information
            if request.trip_data.date_range:
                date_info = f"from {request.trip_data.date_range.from_date} to {request.trip_data.date_range.to}"
                num_days = (request.trip_data.date_range.to - request.trip_data.date_range.from_date).days + 1
            else:
                num_days = request.trip_data.monthly_days
                date_info = f"for {num_days} days"
            # Create POI lists with coordinates
            attraction_list = [
                f"- ID: {poi.place_id},{poi.name} (Attraction) - Located at lat: {poi.coordinates.lat}, lng: {poi.coordinates.lng}" 
                for poi in request.attractionpois
            ]
            food_list = [
                f"- ID: {poi.place_id}, {poi.name} (Restaurant) - Located at lat: {poi.coordinates.lat}, lng: {poi.coordinates.lng}" 
                for poi in request.foodpois
            ]
            
            # Create sections
            attractions_section = "Selected Attractions:\n" + "\n".join(attraction_list) if attraction_list else "No attractions selected"
            restaurants_section = "Selected Restaurants:\n" + "\n".join(food_list) if food_list else "No restaurants selected"
            
            interests_section = "User Interests:\n- " + "\n- ".join(request.trip_data.interests) if request.trip_data.interests else "No specific interests"
            food_prefs_section = "Food Preferences:\n- " + "\n- ".join(request.trip_data.food_preferences) if request.trip_data.food_preferences else "No specific food preferences"
            return f"""Create a detailed {num_days}-day itinerary for {request.trip_data.city}, {request.trip_data.country} {date_info}.

    {attractions_section}

    {restaurants_section}

    {interests_section}

    {food_prefs_section}

    1. Return the response in valid JSON format with the exact structure shown below:
{{
    "Day 1": {{
        "Morning": {{
            "POI": {{
                "place_id": {{
                    "name": "Restaurant Name",
                    "type": "restaurant",
                    "duration": "1.5 hours",
                    "StartTime": "8:00",
                    "EndTime": "9:00",
                    "coordinates": {{
                        "lat": 53.4808,
                        "lng": -2.2426
                    }}
                }},
                "place_id": {{
                    "name": "Attraction Name",
                    "type": "attraction",
                    "duration": "2 hours",
                    "StartTime": "11:00",
                    "EndTime": "13:00",
                    "coordinates": {{
                        "lat": 53.4808,
                        "lng": -2.2426
                    }}
                }}
            }}
        }},
        "Afternoon": {{ ... }},
        "Evening": {{ ... }}
    }},
    "Day 2": {{ 
        "Morning": {{ ... }},
        "Afternoon": {{ ... }},
        "Evening": {{ ... }}
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

2. Important Rules:
- place_id is the placeholder for the unique id passed in from attractions_section and restaurants_section if not empty, else use "suggested_1", "suggested_2", etc.
- Each Morning MUST start with any cafe, Each Afternoon/Evening MUST start with a restaurant (meal time)
- Do not repeat any attractions or restaurants as suggested places might overlap, check by name matching and do NOT overlap timings
- If more places are needed, suggest new ones based on the user's interests and food preferences
- If not all places in the attractions and restaurants lists are used due to full schedule, add them in JSON response with "Unused Attractions" and "Unused Restaurants"
- Calculate travel times between locations (assume 15 minutes per kilometer walking)
- Morning activities: 8:00-12:00
- Afternoon activities: 12:00-18:00
- Standard meal times: Breakfast 8:00-9:00, Lunch 12:00-14:00, Dinner 18:30-20:30
- For attractions, specify realistic visit durations

3. Location-based planning:
- Use the provided coordinates to optimize the route
- Group nearby attractions together to minimize travel time
- If suggesting new places, ensure they are within the city center area and set place_id as "suggested_1", "suggested_2", etc.

4. When suggesting new places:
- For attractions: Match user interests: {', '.join(request.trip_data.interests)}
- For restaurants: Match food preferences: {', '.join(request.trip_data.food_preferences)}
- Maintain the same JSON structure for suggested places, using "suggested_" prefix for place_ids

Validate the JSON structure before returning the response."""
        except Exception as e:
            logger.error(f"Error creating prompt: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to create prompt")