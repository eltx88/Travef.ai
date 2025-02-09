import type { POI, WikidataImageResponse, ExploreParams, ChatMessage, ChatRequest } from '../Types/InterfaceTypes';

interface ApiClientConfig {
  getIdToken: () => Promise<string>;
}

const removeEmptyValues = <T extends Record<string, any>>(obj: T): Partial<T> => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      return { ...acc, [key]: value };
    }
    return acc;
  }, {} as Partial<T>);
};

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

  // Existing methods...

  async getSavedPOIs(city?: string) {
    const queryParams = city ? `?city=${encodeURIComponent(city)}` : '';
    return this.fetchWithAuth(`/user/history/saved-pois${queryParams}`);
  }

  async getSavedPOIDetails(ids: string[]) {
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
      return await this.fetchWithAuth('/trip/generate', {
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
}

export default ApiClient;