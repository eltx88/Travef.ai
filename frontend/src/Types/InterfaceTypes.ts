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
  country?: string;
  duration?: number;
  type: POIType;
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
  rating?: number;
  accessibility_features?: string[];
  created_at?: string;
  updated_at?: string;
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
    from: Date;
    to: Date;
  } | null;
  monthlyDays: number;
  interests: Set<string>;
  customInterests: Set<string>;
  foodPreferences: Set<string>;
  customFoodPreferences: Set<string>;
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

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  stream?: boolean;
}