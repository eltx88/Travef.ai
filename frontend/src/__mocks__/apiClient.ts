// Mock implementation of ApiClient
class MockApiClient {
  async getUserTrips() {
    return [
      {
        trip_doc_id: 'trip1',
        city: 'Paris',
        country: 'France',
        fromDT: new Date('2023-12-01'),
        toDT: new Date('2023-12-07'),
        monthlyDays: 7
      },
      {
        trip_doc_id: 'trip2',
        city: 'Tokyo',
        country: 'Japan',
        fromDT: new Date('2024-01-15'),
        toDT: new Date('2024-01-25'),
        monthlyDays: 10
      }
    ];
  }

  async getTripDetails(tripId: string) {
    return {
      tripData: {
        city: 'Paris',
        country: 'France',
        fromDT: new Date('2023-12-01'),
        toDT: new Date('2023-12-07'),
        createdDT: new Date(),
        monthlyDays: 7,
        interests: new Set(['museums', 'food']),
        customInterests: new Set([]),
        foodPreferences: new Set(['local']),
        customFoodPreferences: new Set([])
      },
      itineraryPOIs: [
        {
          PointID: 'poi1',
          StartTime: 1000,
          EndTime: 1200,
          day: 1,
          duration: 200,
          timeSlot: 'morning'
        }
      ],
      unusedPOIs: []
    };
  }

  async getSavedPOIDetails(ids?: string[]) {
    return [
      {
        id: 'poi1',
        name: 'Eiffel Tower',
        coordinates: { lat: 48.8584, lng: 2.2945 },
        address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
        city: 'Paris',
        country: 'France',
        type: 'attraction'
      }
    ];
  }

  async deleteTrip(tripId: string) {
    return { success: true };
  }
}

export default MockApiClient; 