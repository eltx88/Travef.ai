//Used by 
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface Coordinates {
    lng: number;
    lat: number;
    zoom: number;
}

interface LocationContextType {
    currentCity: string;
    currentCountry: string;
    coordinates: Coordinates;
    updateLocation: (city: string, country: string, lng: number, lat: number, zoom?: number) => void;
    updateCoordinates: (coords: Partial<Coordinates>) => void;
}

interface LocationProviderProps {
    children: ReactNode;
}

//Caching logic for location
interface LocationCache {
    city: string;
    country: string;
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

const setLocationCache = (city: string, country: string, coordinates: Coordinates) => {
    try {
        localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({ city, country, coordinates }));
    } catch (error) {
        console.error('Location cache storage error:', error);
    }
};

export function LocationProvider({ children }: LocationProviderProps) {
    const [currentCity, setCurrentCity] = useState('');
    const [currentCountry, setCurrentCountry] = useState('');
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
            setCurrentCountry(cachedLocation.country);
            setCoordinates(cachedLocation.coordinates);
        }
    }, []);

    const updateLocation = (city: string, country: string, lng: number, lat: number, zoom?: number) => {
        const newCoordinates = {
            ...coordinates,
            lng,
            lat,
            zoom: zoom || coordinates.zoom
        };
        
        setCurrentCity(city);
        setCurrentCountry(country);
        setCoordinates(newCoordinates);
        setLocationCache(city, country, newCoordinates);
    };

    const updateCoordinates = (coords: Partial<Coordinates>) => {
        const newCoordinates = { ...coordinates, ...coords };
        setCoordinates(newCoordinates);
        setLocationCache(currentCity, currentCountry, newCoordinates);
    };

    return (
        <LocationContext.Provider value={{ 
            currentCity, 
            coordinates, 
            currentCountry,
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
