import { useRef, useEffect, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation } from '@/contexts/LocationContext';
import type { POI } from '../../Types/InterfaceTypes';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface MapContainerProps {
    isResizing: boolean;
    pois: POI[];
    savedPois: POI[];
}

function MapContainer({ isResizing, pois }: MapContainerProps) {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const { coordinates } = useLocation();
    const [mapLoaded, setMapLoaded] = useState(false);

    // Memoize createCustomMarker
    const createCustomMarker = useCallback((type: string) => {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        
        switch (type.toLowerCase()) {
            case 'hotel':
                el.innerHTML = `
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#FF0000" stroke="#333" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.376 24h-2.752l-.282-.248C10 23.455 2 16.38 2 10a10 10 0 0 1 20 0c0 6.38-8 13.455-8.342 13.752z"/>
                        <path fill="#FFFFFF" d="M18 14H6V7.382l2.255-1.127L9.382 4h5.236l1.127 2.255L18 7.382zM8 12h8V8.618l-1.745-.873L13.382 6h-2.764l-.873 1.745L8 8.618z"/>
                        <path fill="#FFFFFF" d="M11 9h2v2h-2z"/>
                    </svg>`;
                break;

            case 'restaurant':
                el.innerHTML = `
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#FF0000" stroke="#333" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.376 24h-2.752l-.282-.248C10 23.455 2 16.38 2 10a10 10 0 0 1 20 0c0 6.38-8 13.455-8.342 13.752z"/>
                        <path fill="#FFFFFF" d="M16 12h-2v-1a2 2 0 0 0-4 0v1H8v-1a4 4 0 0 1 8 0z"/>
                        <path fill="#FFFFFF" d="M7 11h10v2H7zM11 6h2v2h-2z"/>
                    </svg>`;
                break;

            case 'attraction':
                el.innerHTML = `
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#FF0000" stroke="#333" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.376 24h-2.752l-.283-.248C10 23.455 2 16.38 2 10a10 10 0 0 1 20 0c0 6.38-8 13.455-8.341 13.752z"/>
                        <path fill="#FFFFFF" d="M15 12H9V6h6zm-4-2h2V8h-2z"/>
                        <path fill="#FFFFFF" d="M11 11h2v4h-2z"/>
                        <path fill="#FFFFFF" d="M9 14h6v2H9z"/>
                    </svg>`;
                break;


            case 'savedhotel':
                el.innerHTML = `
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#FFD700" stroke="#333" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.376 24h-2.752l-.282-.248C10 23.455 2 16.38 2 10a10 10 0 0 1 20 0c0 6.38-8 13.455-8.342 13.752z"/>
                        <path fill="#FFFFFF" d="M18 14H6V7.382l2.255-1.127L9.382 4h5.236l1.127 2.255L18 7.382zM8 12h8V8.618l-1.745-.873L13.382 6h-2.764l-.873 1.745L8 8.618z"/>
                        <path fill="#FFFFFF" d="M11 9h2v2h-2z"/>
                    </svg>`;
                break;
            
            case 'savedrestaurant':
                el.innerHTML = `
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#FFD700" stroke="#333" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.376 24h-2.752l-.282-.248C10 23.455 2 16.38 2 10a10 10 0 0 1 20 0c0 6.38-8 13.455-8.342 13.752z"/>
                        <path fill="#FFFFFF" d="M16 12h-2v-1a2 2 0 0 0-4 0v1H8v-1a4 4 0 0 1 8 0z"/>
                        <path fill="#FFFFFF" d="M7 11h10v2H7zM11 6h2v2h-2z"/>
                    </svg>`;
                break;
            
            case 'savedattraction':
                el.innerHTML = `
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#FFD700" stroke="#333" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.376 24h-2.752l-.283-.248C10 23.455 2 16.38 2 10a10 10 0 0 1 20 0c0 6.38-8 13.455-8.341 13.752z"/>
                        <path fill="#FFFFFF" d="M15 12H9V6h6zm-4-2h2V8h-2z"/>
                        <path fill="#FFFFFF" d="M11 11h2v4h-2z"/>
                        <path fill="#FFFFFF" d="M9 14h6v2H9z"/>
                    </svg>`;
                break;

            default:
                el.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="#6b7280">
                                <circle cx="12" cy="12" r="10" />
                                </svg>`;
        }
        
        return el;
    }, []);

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [coordinates.lng, coordinates.lat],
            zoom: coordinates.zoom,
            pitchWithRotate: false,
            attributionControl: true,
            preserveDrawingBuffer: true,
        });

        map.current.on('load', () => {
            setMapLoaded(true);
        });

        map.current.addControl(
            new mapboxgl.NavigationControl({ 
                visualizePitch: false,
                showZoom: true,
                showCompass: true
            }),
            'top-right'
        );

        // Add city center marker
        markerRef.current = new mapboxgl.Marker({
            color: '#2832c2',
            draggable: false
        })
            .setLngLat([coordinates.lng, coordinates.lat])
            .addTo(map.current);

        return () => {
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];
            
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
            
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
            setMapLoaded(false);
        };
    }, []); 

    // Memoize popup creation
    const createPopup = useCallback((poi: POI) => {
        return new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
                <div class="p-2">
                    <h3 class="font-bold text-base">${poi.name}</h3>
                    <p class="text-sm mt-1">${poi.address}</p>
                    <p class="text-sm text-gray-600 mt-1">${poi.type}</p>
                    ${poi.duration ? `<p class="text-sm mt-1">Duration: ${poi.duration} hours</p>` : ''}
                </div>
            `);
    }, []);

    // Update POI markers when POIs change or map loads
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        pois.forEach(poi => {            
            if (poi.coordinates?.lat && poi.coordinates?.lng) {
                try {
                    const markerElement = createCustomMarker(poi.type);
                    const marker = new mapboxgl.Marker({
                        element: markerElement
                    })
                        .setLngLat([poi.coordinates.lng, poi.coordinates.lat])
                        .setPopup(createPopup(poi));
                    marker.addTo(map.current!);
                    // Add click handler to marker element
                    marker.getElement().addEventListener('click', () => {
                        marker.togglePopup();
                    });

                    markersRef.current.push(marker);
                } catch (err) {
                    console.error('Error adding marker:', err, poi);
                }
            } else {
                console.warn('Invalid coordinates for POI:', poi.name);
            }
        });
    }, [pois, mapLoaded, createCustomMarker, createPopup]);

    // Update map when coordinates change
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        map.current.easeTo({
            center: [coordinates.lng, coordinates.lat],
            zoom: coordinates.zoom,
            duration: 1500,
            essential: true
        });
        
        if (markerRef.current) {
            markerRef.current.setLngLat([coordinates.lng, coordinates.lat]);
        }
    }, [coordinates.lng, coordinates.lat, coordinates.zoom, mapLoaded]);

    // Handle resize
    useEffect(() => {
        if (!map.current || !mapLoaded) return;
        const timeoutId = setTimeout(() => map.current?.resize(), 0);
        return () => clearTimeout(timeoutId);
    }, [isResizing, mapLoaded]);

    return (
        <div className="relative h-full w-full bg-gray-100 rounded-lg overflow-hidden">
            <div 
                ref={mapContainer} 
                className="absolute inset-0"
                style={{ height: '100%' }}
            />
        </div>
    );
}

export default MapContainer;