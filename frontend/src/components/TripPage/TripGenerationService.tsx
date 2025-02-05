import ApiClient from '@/Api/ApiClient';
import type { TripData } from '@/Types/InterfaceTypes';

export interface GeneratedTrip {
  itinerary: string;
}

export interface MinimalPOI {
  place_id: string;
  name: string;
  type: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export class TripGenerationService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

async generateTrip(tripData: TripData, attractionpois: MinimalPOI[], foodpois: MinimalPOI[]): Promise<GeneratedTrip> {
  try {
      const payload = {
          trip_data: {
              city: tripData.city,
              country: tripData.country,
              date_range: tripData.dateRange ? {
                  from: tripData.dateRange.from.toISOString(),
                  to: tripData.dateRange.to.toISOString()
              } : null,
              monthly_days: tripData.monthlyDays,
              interests: Array.from(tripData.interests),
              food_preferences: Array.from(tripData.foodPreferences),
              custom_interests: Array.from(tripData.customInterests),
              custom_food_preferences: Array.from(tripData.customFoodPreferences)
          },
          foodpois: foodpois,
          attractionpois: attractionpois
      };
            
      const response = await this.apiClient.postTripGeneration(payload);
      return { itinerary: response.itinerary };
  } catch (error) {
      console.error('Generation error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to generate trip');
  }
}
}