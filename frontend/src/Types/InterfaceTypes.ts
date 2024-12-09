import { DateRange } from "react-day-picker";

//Used by POI Card
export type POIType = "attraction" | "restaurant" | "hotel" ;

export interface Coordinates {
    lat: number;
    lng: number;
}


export interface POI {
  id: string;
  place_id?: string;
  name: string;
  coordinates: Coordinates;
  address: string;
  city: string;
  country?: string;
  duration?: number;
  type: POIType;
  categories?: string[];
  wikidata_id?: string;
  website?: string;
  phone?: string;
  email?: string;
  opening_hours?: Record<string, string>;
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
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  } | null;
  monthlyDays: number;
  interests: Set<string>;
  customInterests: Set<string>;
}