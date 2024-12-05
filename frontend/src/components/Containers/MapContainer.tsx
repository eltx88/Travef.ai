import { useRef, useEffect, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation } from '@/contexts/LocationContext';
import type { POI } from '../../Types/InterfaceTypes';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface MapContainerProps {
    isResizing: boolean;
    pois: POI[];
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
                el.innerHTML = `<svg class="w-6 h-6 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 4h12M6 4v16M6 4H5m13 0v16m0-16h1m-1 16H6m12 0h1M6 20H5M9 7h1v1H9V7Zm5 0h1v1h-1V7Zm-5 4h1v1H9v-1Zm5 0h1v1h-1v-1Zm-3 4h2a1 1 0 0 1 1 1v4h-4v-4a1 1 0 0 1 1-1Z"/>
                                </svg>`;
                break;
            case 'restaurant':
                el.innerHTML = `<svg class="w-6 h-6 text-blue-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z"/>
                                <path fill-rule="evenodd" d="M21.707 21.707a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 0 1 1.414-1.414l3.5 3.5a1 1 0 0 1 0 1.414Z" clip-rule="evenodd"/>
                                </svg>`;
                break;
            case 'attraction':
                el.innerHTML = `<svg class="w-6 h-6 text-red-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M3 21h18M4 18h16M6 10v8m4-8v8m4-8v8m4-8v8M4 9.5v-.955a1 1 0 0 1 .458-.84l7-4.52a1 1 0 0 1 1.084 0l7 4.52a1 1 0 0 1 .458.84V9.5a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5Z"/>
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
            color: '#FF0000',
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