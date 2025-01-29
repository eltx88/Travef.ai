//Used by 
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface Coordinates {
    lng: number;
    lat: number;
    zoom: number;
}

interface LocationContextType {
    currentCity: string;
    coordinates: Coordinates;
    updateLocation: (city: string, lng: number, lat: number, zoom?: number) => void;
    updateCoordinates: (coords: Partial<Coordinates>) => void;
}

interface LocationProviderProps {
    children: ReactNode;
}

//Caching logic for location
interface LocationCache {
    city: string;
    coordinates: Coordinates;
}

const LOCATION_CACHE_KEY = 'location_cache';

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const getLocationCache = (): LocationCache | null => {
    try {
        const cached = localStorage.getItem(LOCATION_CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
};

const setLocationCache = (city: string, coordinates: Coordinates) => {
    try {
        localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({ city, coordinates }));
    } catch (error) {
        console.error('Location cache storage error:', error);
    }
};

export function LocationProvider({ children }: LocationProviderProps) {
    const [currentCity, setCurrentCity] = useState('');
    const [coordinates, setCoordinates] = useState({
        lng: -2.2426,
        lat: 53.4808,
        zoom: 12
    });

    // Load cached location on mount
    useEffect(() => {
        const cachedLocation = getLocationCache();
        if (cachedLocation) {
            setCurrentCity(cachedLocation.city);
            setCoordinates(cachedLocation.coordinates);
        }
    }, []);

    const updateLocation = (city: string, lng: number, lat: number, zoom?: number) => {
        const newCoordinates = {
            ...coordinates,
            lng,
            lat,
            zoom: zoom || coordinates.zoom
        };
        
        setCurrentCity(city);
        setCoordinates(newCoordinates);
        setLocationCache(city, newCoordinates);
    };

    const updateCoordinates = (coords: Partial<Coordinates>) => {
        const newCoordinates = { ...coordinates, ...coords };
        setCoordinates(newCoordinates);
        setLocationCache(currentCity, newCoordinates);
    };

    return (
        <LocationContext.Provider value={{ 
            currentCity, 
            coordinates, 
            updateLocation,
            updateCoordinates 
        }}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
}
