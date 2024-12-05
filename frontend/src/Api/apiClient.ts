import type { POI } from  '../Types/InterfaceTypes';
interface ApiClientConfig {
  getIdToken: () => Promise<string>;
}

interface ExploreParams {
  city: string;
  category?: string;
  coordinates: { 
    lat: number; 
    lng: number;
  };
  offset?: number;
  limit?: number;
}

class ApiClient {
  private getIdToken: () => Promise<string>;
  private readonly API_BASE_URL = '/api';

  constructor(config: ApiClientConfig) {
    this.getIdToken = config.getIdToken;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    console.log(`Calling endpoint: ${this.API_BASE_URL}${endpoint}`);

    try {
      const token = await this.getIdToken();      
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
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
      console.error('fail in fetch with auth:', error); 
      throw error;
  }
}

  async getSavedPOIs(city?: string) {
    const queryParams = city ? `?city=${encodeURIComponent(city)}` : '';
    return this.fetchWithAuth(`/user/history/saved-pois${queryParams}`);
  }

  async getSavedPOIDetails(ids: string[]) {
    console.log('ids:', ids);
    return this.fetchWithAuth(`/points/saved/details`, {
      method: 'POST',
      body: JSON.stringify({ point_ids: ids }),
    });
  }

  async getExplorePOIs({
    city,
    category = 'accommodation',
    coordinates,
    offset = 0,
    limit = 30
}: ExploreParams) {
    const queryParams = new URLSearchParams({
        city: city,
        latitude: coordinates.lat.toString(),
        longitude: coordinates.lng.toString(),
        category: category,
        offset: offset.toString(),
        limit: limit.toString()
    });
    
    return this.fetchWithAuth(`/geoapify/places?${queryParams.toString()}`);
}

async createOrGetPOI(poiData: POI): Promise<string> {
  const response = await this.fetchWithAuth('/points/CreateGetPOI', {
      method: 'POST',
      body: JSON.stringify({
          poi_data: poiData  
      })
  });
  return response;
}

async savePOI(userId: string, pointId: string, city: string): Promise<void> {
  await this.fetchWithAuth(`/user/history/saved-pois`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      pointId,
      city: city.toLowerCase()
    })
  });
}

async unsavePOI(pointIds: string[]) {
  return this.fetchWithAuth(`/user/history/saved-pois/unsave`, {
      method: 'PUT',
      body: JSON.stringify({
          point_ids: pointIds
      })
  });
}
}

export default ApiClient;