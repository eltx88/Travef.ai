//Used by POI Card
export type POIType = "attraction" | "restaurant" | "hotel" | "cafe";

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface POI {
  id: string;
  place_id: string;
  name: string;
  coordinates: Coordinates;
  address: string;
  city: string;
  country: string;
  type: POIType;
  rating?: number;
  user_ratings_total?: number;
  cuisine?: string[]; 
  description?: string; 
  categories?: string[];
  wikidata_id?: string;
  image_url?: string;
  website?: string;
  phone?: string;
  email?: string;
  opening_hours?: string; 
  tags?: string[];
  price_level?: number;
}

//Extended POI for Itinerary Page
export interface ItineraryPOI extends POI {
  PointID?: string; //Used to store document id for the POI
  day: number;
  timeSlot: string;
  StartTime: number;
  EndTime: number;
  duration: number;
}

//Used for DB response
export interface ItineraryPOIDB {
  PointID: string;
  place_id: string;
  day: number;
  timeSlot: string;
  StartTime: number;
  EndTime: number;
  duration: number;
}

export interface UserHistoryPoint {
  pointID: string;
  CreatedDT: Date;
  Status: boolean;
}

//Used for City Search Bar
export interface SearchCity {
  name: string;
  country: string;
  lat: string;
  lng: string;
}

//Used to store data for Trip Creation after carousel submission as well as displa trips in homepage
export interface TripData {
  city: string;
  country: string;
  coordinates: Coordinates;
  fromDT: Date | undefined;
  toDT: Date | undefined;
  monthlyDays: number;
  interests: Set<string>;
  customInterests: Set<string>;
  foodPreferences: Set<string>;
  customFoodPreferences: Set<string>;
  createdDT: Date;
}

export interface WikidataImageResponse {
  wikidata_id: string;
  image_url: string | null;
}

export interface ExploreParams {
  city: string;
  category?: string;
  type?: string;
  coordinates: { 
    lat: number; 
    lng: number;
  };
  offset?: number;
  limit?: number;
}

//Groq Query interfaces
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  stream?: boolean;
}

//Itinerary interfaces for generatedItinerary json from Groq
export interface ItineraryPOIData {
  name: string;
  type: string;
  duration: string;
  StartTime: string;
  EndTime: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface ItineraryTimeSlot {
  POI: {
    [id: string]: ItineraryPOIData;
  };
}

export interface ItineraryDay {
  [timeOfDay: string]: ItineraryTimeSlot;
}

export interface RawItineraryData {
  [key: string]: ItineraryDay | {
    Attractions: Array<{ place_id: string; name: string }>;
    Restaurants: Array<{ place_id: string; name: string }>;
  };
}

export interface ProcessedPOI extends ItineraryPOIData {
  id: string;
  timeSlot: string;
  address?: string;
}

export interface ProcessedTimeSlot {
  timeSlot: string;
  pois: ProcessedPOI[];
}

export interface ProcessedDay {
  day: string;
  timeSlots: ProcessedTimeSlot[];
}

export interface UnusedPOIs {
  Attractions: Array<{ place_id: string; name: string }>;
  Restaurants: Array<{ place_id: string; name: string }>;
}

export interface FetchedTripDetails {
  tripData: {
    city: string;
    country: string;
    coordinates: Coordinates;
    fromDT: Date | undefined;
    toDT: Date | undefined;  
    monthlyDays: number;
    interests: Set<string>;     
    customInterests: Set<string>;
    foodPreferences: Set<string>;
    customFoodPreferences: Set<string>;
    createdDT: Date;
    lastModified: Date;
    version: number;
  };
  itineraryPOIs: ItineraryPOIDB[];
  unusedPOIs: ItineraryPOIDB[];
}

export interface ItineraryPOIChanges {
    movedToItinerary: Array<{
      PointID: string,
      place_id: string,
      StartTime: number,
      EndTime: number,
      day: number,
      timeSlot: string,
      duration: number
    }>;
    movedToUnused: Array<{
      PointID: string,
      place_id: string,
    }>; 
    schedulingUpdates: Array<{
      PointID: string,
      place_id: string,
      StartTime: number,
      EndTime: number,
      day: number,
      timeSlot: string,
      duration: number
    }>;
    unusedPOIsState: Array<{
      PointID: string,
      place_id: string,
    }>
}

export interface UserTrip {
  trip_doc_id: string;
  trip_id: string;
  city: string;
  country: string;
  fromDT: Date;
  toDT: Date;
  monthlyDays: number;
}

//Google Places API interfaces
export interface GooglePlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  coordinates: Coordinates;
  types: string[];
  primary_type: string;
  rating?: number;
  user_ratings_total?: number;
  photo_name?: string;
  image_url?: string;
  website?: string;
  phone?: string;
  description?: string;
  opening_hours?: string;
  price_level?: number;
  cuisine?: string[];
}
