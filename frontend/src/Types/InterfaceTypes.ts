//Used by POI Card
export type POIType = "attraction" | "restaurant" | "hotel" ;

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

//Used to store data for Trip Creation after carousel submission
export interface TripData {
  city: string;
  country: string;
  coordinates: Coordinates;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  } | undefined;
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

//Itinerary interfaces 
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