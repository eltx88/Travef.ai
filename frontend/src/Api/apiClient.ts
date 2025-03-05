import type { POI, WikidataImageResponse, ExploreParams, TripData, ItineraryPOI, FetchedTripDetails, ItineraryPOIDB, ItineraryPOIChanges, UserTrip, ExploreGoogleParams } from '../Types/InterfaceTypes';

interface ApiClientConfig {
  getIdToken: () => Promise<string>;
}

class ApiClient {
  private getIdToken: () => Promise<string>;
  private readonly API_BASE_URL = '/api';

  constructor(config: ApiClientConfig) {
    this.getIdToken = config.getIdToken;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    try {
      const token = await this.getIdToken();
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.detail || `API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      throw error;
    }
  }

  async getSavedPOIs(city?: string) {
    const queryParams = city ? `?city=${encodeURIComponent(city)}` : '';
    return this.fetchWithAuth(`/user/history/saved-pois${queryParams}`);
  }

  async getSavedPOIDetails(ids?: string[]) {
    if (!ids || ids.length === 0) {
      return [];
    }

    const response = await this.fetchWithAuth(`/points/saved/details`, {
      method: 'POST',
      body: JSON.stringify({ point_ids: ids }),
    });

    return response.map((poi: POI) => ({
      ...poi,
      type: `${poi.type}`,
    }));
  }
  
  async getExplorePOIs({
    city,
    category = 'accommodation',
    type = 'hotel',
    coordinates,
    offset = 0,
    limit = 30,
  }: ExploreParams) {
    const queryParams = new URLSearchParams({
      city: city,
      latitude: coordinates.lat.toString(),
      longitude: coordinates.lng.toString(),
      category: category,
      type: type.toString(),
      offset: offset.toString(),
      limit: limit.toString(),
    });

    const pois = await this.fetchWithAuth(`/geoapify/places?${queryParams.toString()}`);

    // Fetch images for POIs with wikidata_id
    const wikidataIds = pois
      .filter((poi: POI) => poi.wikidata_id)
      .map((poi: POI) => poi.wikidata_id) as string[];

    if (wikidataIds.length > 0) {
      const imageMap = await this.getWikidataImages(wikidataIds);
      pois.forEach((poi: POI) => {
        if (poi.wikidata_id && imageMap[poi.wikidata_id]) {
          poi.image_url = imageMap[poi.wikidata_id] ?? undefined;
        }
      });
    }
    return pois;
  }

  //Called by search bar
  async getGoogleExplorePOIs({
    type,
    coordinates,
    poitype,
    city,
    country
  }: ExploreGoogleParams): Promise<POI[]> {
    const queryParams = new URLSearchParams({
      type: type.join(','),
      latitude: coordinates.lat.toString(),
      longitude: coordinates.lng.toString(),
      radius: '2000',
      max_results: '20'
    });
    
    try {
      const pois = await this.fetchWithAuth(`/googleplaces/explore?${queryParams.toString()}`);
      
      // Make sure pois is an array before proceeding
      if (!Array.isArray(pois)) {
        console.error('Expected pois to be an array but got:', typeof pois);
        return [];
      }
      
      const processedPois: POI[] = pois.map((poi: any) => {
        // Handle cuisine - ensure it's an array
        const cuisineArray = poi.cuisine ? 
          (Array.isArray(poi.cuisine) ? poi.cuisine : [poi.cuisine]) : 
          undefined;
        
        return {
          id: poi.place_id || '',
          place_id: poi.place_id || '',
          name: poi.name || '',
          coordinates: {
            lat: poi.location?.latitude || 0,
            lng: poi.location?.longitude || 0
          },
          address: poi.formatted_address || '',
          city: city,
          country: country,
          type: poitype,
          rating: poi.rating,
          user_ratings_total: poi.user_ratings_total,
          cuisine: cuisineArray,
          description: poi.description || '',
          categories: Array.isArray(poi.types) ? poi.types : [],
          image_url: poi.photo_url || '',
          website: poi.website || '',
          phone: poi.phone || '',
          opening_hours: poi.opening_hours || '',
          price_level: poi.price_level
        };
      });
      
      return processedPois;
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      return [];
    }
  }

  async createOrGetPOI(poiData: POI): Promise<string> {
    const response = await this.fetchWithAuth('/points/CreateGetPOI', {
      method: 'POST',
      body: JSON.stringify({
        poi_data: poiData,
      }),
    });
    return response;
  }

  async savePOI(userId: string, pointId: string, city: string): Promise<void> {
    await this.fetchWithAuth(`/user/history/saved-pois`, {
      method: 'POST',
      body: JSON.stringify({
        userId,
        pointId,
        city: city.toLowerCase(),
      }),
    });
  }

  async unsavePOI(pointIds: string[]) {
    return this.fetchWithAuth(`/user/history/saved-pois/unsave`, {
      method: 'PUT',
      body: JSON.stringify({
        point_ids: pointIds,
      }),
    });
  }

  async getWikidataImage(wikidata_id: string): Promise<WikidataImageResponse> {
    try {
      return await this.fetchWithAuth(`/wikidata/image/${wikidata_id}`);
    } catch (error) {
      return { wikidata_id, image_url: null };
    }
  }

  async getWikidataImages(wikidata_ids: string[]): Promise<Record<string, string | null>> {
    const results: Record<string, string | null> = {};

    await Promise.all(
      wikidata_ids.map(async (id) => {
        try {
          const response = await this.getWikidataImage(id);
          results[id] = response.image_url;
        } catch (error) {
          results[id] = null;
        }
      })
    );

    return results;
  }

  async postTripGeneration(data: any): Promise<any> {
    try {
      return await this.fetchWithAuth('/tripgeneration/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  async getNearbyPlaces(
  latitude: number,
  longitude: number,
  radius: number = 1000,
  type?: string
): Promise<any> {
  const queryParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    radius: radius.toString(),
  });

  if (type) {
    queryParams.set('type', type);
  }

  return this.fetchWithAuth(`/googleplaces/nearby?${queryParams.toString()}`);
}

async getNearbyPlacesByTypes(
  latitude: number,
  longitude: number,
  radius: number = 1000,
  types: string[] // Array of types to search for
  ): Promise<any[]> {
    const results = await Promise.all(
      types.map((type) => this.getNearbyPlaces(latitude, longitude, radius, type))
    );

    const combinedResults = results.flat();
    return combinedResults;
  }

  async getPlaceDetails(placeId: string): Promise<any> {
    return this.fetchWithAuth(`/googleplaces/details/${placeId}`);
  }

  async getTripDetails(trip_doc_id: string): Promise<FetchedTripDetails> {
    try {
      const response = await this.fetchWithAuth(`/trip/details/${trip_doc_id}`);

      const transformedData: FetchedTripDetails = {
        tripData: {
          ...response.tripData,
          fromDT: new Date(response.tripData.fromDT),
          toDT: new Date(response.tripData.toDT),
          createdDT: new Date(response.tripData.createdDT),
          interests: new Set(response.tripData.interests),
          customInterests: new Set(response.tripData.customInterests),
          foodPreferences: new Set(response.tripData.foodPreferences),
          customFoodPreferences: new Set(response.tripData.customFoodPreferences)
        },
        itineraryPOIs: response.itineraryPOIs.map((poi: ItineraryPOIDB) => ({
          PointID: poi.PointID,
          StartTime: Number(poi.StartTime),
          EndTime: Number(poi.EndTime),
          day: Number(poi.day),
          duration: Number(poi.duration),
          timeSlot: poi.timeSlot
        })),
        unusedPOIs: response.unusedPOIs.map((poi: ItineraryPOIDB) => ({
          PointID: poi.PointID,
          StartTime: -1,
          EndTime: -1,
          day: -1,
          duration: -1,
          timeSlot: ""
        }))
      };
      return transformedData;
    } catch (error) {
      console.error('Error in getting trip details:', error);
      throw error;
    }
  }
  
  async createOrUpdateTrip(userId: string, trip_doc_id: string, tripData: TripData, itineraryPOIs: ItineraryPOI[], unusedPOIs: ItineraryPOI[]) {
    try {
      // if trip_doc_id is empty, create a new trip
      if (trip_doc_id === "") {
        const processedItineraryPOIs = await Promise.all(
          itineraryPOIs.map(async (poi) => {
            // Create or get POI document
            const poiDocId = await this.createOrGetPOI({
              place_id: poi.place_id,
              name: poi.name,
              coordinates: poi.coordinates,
              address: poi.address,
              city: poi.city,
              country: poi.country,
              type: poi.type,
              id: poi.id
            });
    
            return {
              PointID: poiDocId,
              StartTime: poi.StartTime,
              EndTime: poi.EndTime,
              timeSlot: poi.timeSlot,
              day: poi.day,
              duration: poi.duration
            };
          })
        );

        const processedUnusedPOIs = await Promise.all(
          unusedPOIs.map(async (poi) => {
            const poiDocId = await this.createOrGetPOI({
              place_id: poi.place_id,
              name: poi.name,
              coordinates: poi.coordinates,
              address: poi.address,
              city: poi.city,
              country: poi.country,
              type: poi.type,
              id: poi.id
            });
            return {
              PointID: poiDocId
            };
          })
        );
        const tripDocId = await this.fetchWithAuth('/trip/create', {
          method: 'POST',
          body: JSON.stringify({
            tripData: {
              ...tripData,
              userId: userId,
              interests: Array.from(tripData.interests),
              customInterests: Array.from(tripData.customInterests),
              foodPreferences: Array.from(tripData.foodPreferences),
              customFoodPreferences: Array.from(tripData.customFoodPreferences),
              fromDT: tripData.fromDT?.toISOString(),
              toDT: tripData.toDT?.toISOString()
            },
            itineraryPOIs: processedItineraryPOIs,
            unusedPOIs: processedUnusedPOIs
          })
        });
        await this.fetchWithAuth(`/user/history/saved-trips/${tripDocId}`, {
          method: 'POST',
          body: JSON.stringify({
            user_id: userId,
            city: tripData.city.toLowerCase(),
            country: tripData.country.toLowerCase(),
            fromDT: tripData.fromDT?.toISOString(),
            toDT: tripData.toDT?.toISOString(),
            monthlyDays: tripData.monthlyDays
          })
        });
      } else {
          // Get current trip state from backend
        const backendTripDetails = await this.getTripDetails(trip_doc_id);
        // Process all changes
        const changes = this.processPOIChanges(
          { itineraryPOIs: itineraryPOIs, unusedPOIs: unusedPOIs},
          { itineraryPOIs: backendTripDetails.itineraryPOIs, unusedPOIs: backendTripDetails.unusedPOIs   }
        );
  
        // Check if trip data changed
        const tripDataChanged = 
          tripData.fromDT?.getTime() !== backendTripDetails.tripData.fromDT?.getTime() ||
          tripData.toDT?.getTime() !== backendTripDetails.tripData.toDT?.getTime() ||
          tripData.monthlyDays !== backendTripDetails.tripData.monthlyDays;
  
        // Only update if there are actual changes
        if (changes.movedToItinerary.length > 0 || 
            changes.movedToUnused.length > 0 || 
            changes.schedulingUpdates.length > 0 || 
            changes.unusedPOIsState.length > 0 || 
            tripDataChanged) {
  
          // Send update request
          await this.fetchWithAuth(`/trip/update/${trip_doc_id}`, {
            method: 'PUT',
            body: JSON.stringify({
              tripDataChanged: tripDataChanged ? {
                fromDT: tripData.fromDT?.toISOString(),
                toDT: tripData.toDT?.toISOString(),
                monthlyDays: tripData.monthlyDays
              } : null,
              movedToItinerary: changes.movedToItinerary,
              movedToUnused: changes.movedToUnused,
              schedulingUpdates: changes.schedulingUpdates,
              unusedPOIsState: changes.unusedPOIsState
            })
          });
        }
      }
    } catch (error) {
      console.error('Error in creating or updating trip:', error);
      throw error;
    }
  }

  // Helper function to check if POI scheduling details have changed
  private hasPOISchedulingChanged(frontendPOI: ItineraryPOI, backendPOI: ItineraryPOIDB): boolean {
    return frontendPOI.StartTime !== backendPOI.StartTime ||
          frontendPOI.EndTime !== backendPOI.EndTime ||
          frontendPOI.day !== backendPOI.day ||
          frontendPOI.timeSlot !== backendPOI.timeSlot;
  }

  // Function to process POI changes , this is only called when there is already a trip in dB so PointID is always present
  private processPOIChanges(
    frontendData: {
      itineraryPOIs: ItineraryPOI[],
      unusedPOIs: ItineraryPOI[]
    },
    backendData: {
      itineraryPOIs: ItineraryPOIDB[],
      unusedPOIs: ItineraryPOIDB[]
    }): ItineraryPOIChanges {
      const changes: ItineraryPOIChanges = {
        movedToItinerary: [],
        movedToUnused: [],
        schedulingUpdates: [],
        unusedPOIsState: []
      };
      
      // Create maps for easier lookup
      const backendItineraryMap = new Map(backendData.itineraryPOIs.map(poi => [poi.PointID, poi]));
      const backendUnusedMap = new Map(backendData.unusedPOIs.map(poi => [poi.PointID, poi]));
      const frontendItineraryMap = new Map(frontendData.itineraryPOIs.map(poi => [poi.PointID, poi]));

      // Check for POIs moved to itinerary and scheduling updates
      frontendItineraryMap.forEach(frontendPOI => {
        const backendItineraryPOI = backendItineraryMap.get(frontendPOI.id);
        const backendUnusedPOI = backendUnusedMap.get(frontendPOI.id);
        const duration = frontendPOI.EndTime - frontendPOI.StartTime;
  
        if (backendUnusedPOI) {
          // New POI moved from unused section to itinerary
          changes.movedToItinerary.push({
            PointID: backendUnusedPOI.PointID,
            StartTime: frontendPOI.StartTime,
            EndTime: frontendPOI.EndTime,
            day: frontendPOI.day,
            timeSlot: frontendPOI.timeSlot,
            duration: duration
          });
        } else if (backendItineraryPOI && this.hasPOISchedulingChanged(frontendPOI, backendItineraryPOI)) {
          // POI scheduling details changed
          changes.schedulingUpdates.push({
            PointID: backendItineraryPOI.PointID,
            StartTime: frontendPOI.StartTime,
            EndTime: frontendPOI.EndTime,
            day: frontendPOI.day,
            timeSlot: frontendPOI.timeSlot,
            duration: duration
          });
        }
      });
  
      // Track POIs moved back to unused
      backendData.itineraryPOIs.forEach(backendPOI => {
        if (!frontendData.itineraryPOIs.some(poi => poi.PointID === backendPOI.PointID)) {
          changes.movedToUnused.push({
            PointID: backendPOI.PointID
          });
        }
      });
  
      // Set complete state of unused POIs
      frontendData.unusedPOIs.forEach(frontendPOI => {
        const backendPOI = backendUnusedMap.get(frontendPOI.id) || 
                          backendItineraryMap.get(frontendPOI.id);
        
        if (backendPOI) {
          changes.unusedPOIsState.push({
            PointID: backendPOI.PointID
          });
        }
      });
  
      return changes;
    }
  
  async getUserTrips(): Promise<UserTrip[]> {
      try {
        const savedTrips = await this.fetchWithAuth('/user/history/saved-trips');
        
        savedTrips.forEach((trip: UserTrip) => {
          trip.fromDT = new Date(trip.fromDT);
          trip.toDT = new Date(trip.toDT);
        });

        return savedTrips;
      } catch (error) {
        console.error('Error fetching user\'s trips:', error);
        throw error;
      }
  }

  async deleteTrip(trip_doc_id: string) {
    try {
      await this.fetchWithAuth(`/trip/delete-with-history/${trip_doc_id}`, {
        method: 'DELETE',
      });

    } catch (error) {
      console.error('Error deleting trip:', error);
      throw error;
    }
  }

  // this function takes the original POIs and returns the POIs with the Google place details merged
  async getBatchPlaceDetails(
    pois: POI[], 
    city: string, 
    country: string
  ): Promise<POI[]> {
    try {
      // If no POIs, return original list
      if (!pois || pois.length === 0) {
        return pois;
      }
    
      // Extract just the place IDs for the API request
      const googlePlaceIds = pois.map(poi => poi.place_id);
      
      // Send the request to get place details in batch
      const response = await this.fetchWithAuth('/googleplaces/batch_details', {
        method: 'POST',
        body: JSON.stringify(googlePlaceIds),
      });
      
      // Filter to include only POIs that have address not equal to ""
      return pois
        .filter(poi => response[poi.place_id])
        .map(poi => {
          const details = response[poi.place_id];
          
          return {
            ...poi,
            name: details.name || poi.name,
            coordinates: details.coordinates || poi.coordinates,
            address: details.formatted_address || poi.address,
            city: poi.city || city,
            country: poi.country || country,
            rating: details.rating || poi.rating,
            cuisine: details.cuisine || poi.cuisine,
            description: details.description || poi.description,
            categories: details.types || poi.categories,
            image_url: details.image_url || poi.image_url,
            website: details.website || poi.website,
            phone: details.phone || poi.phone,
            opening_hours: details.opening_hours || poi.opening_hours,
            price_level: details.price_level || poi.price_level
          };
        });
      
    } catch (error) {
      console.error('Error fetching batch place details:', error);
      return pois;
    }
  }

}

export default ApiClient;