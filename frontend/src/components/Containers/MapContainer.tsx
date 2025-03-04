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

function MapContainer({ isResizing, pois, savedPois }: MapContainerProps) {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const { coordinates } = useLocation();
    const [mapLoaded, setMapLoaded] = useState(false);

    // Regular POI markers (red)
    const createCustomMarker = useCallback((type: string) => {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        
        switch (type.toLowerCase()) {
            case 'hotel':
                el.innerHTML = `
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#FF0000" stroke="#333" stroke-width="0.3" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.376 24h-2.752l-.282-.248C10 23.455 2 16.38 2 10a10 10 0 0 1 20 0c0 6.38-8 13.455-8.342 13.752z"/>
                        <path fill="#FFFFFF" d="M18 14H6V7.382l2.255-1.127L9.382 4h5.236l1.127 2.255L18 7.382zM8 12h8V8.618l-1.745-.873L13.382 6h-2.764l-.873 1.745L8 8.618z"/>
                        <path fill="#FFFFFF" d="M11 9h2v2h-2z"/>
                    </svg>`;
                break;

            case 'restaurant':
                el.innerHTML = `
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#FF0000" stroke="#333" stroke-width="0.3" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.376 24h-2.752l-.282-.248C10 23.455 2 16.38 2 10a10 10 0 0 1 20 0c0 6.38-8 13.455-8.342 13.752z"/>
                        <path fill="#FFFFFF" d="M16 12h-2v-1a2 2 0 0 0-4 0v1H8v-1a4 4 0 0 1 8 0z"/>
                        <path fill="#FFFFFF" d="M7 11h10v2H7zM11 6h2v2h-2z"/>
                    </svg>`;
                break;

            case 'attraction':
                el.innerHTML = `
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#FF0000" stroke="#333" stroke-width="0.3" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.376 24h-2.752l-.283-.248C10 23.455 2 16.38 2 10a10 10 0 0 1 20 0c0 6.38-8 13.455-8.341 13.752z"/>
                        <path fill="#FFFFFF" d="M15 12H9V6h6zm-4-2h2V8h-2z"/>
                        <path fill="#FFFFFF" d="M11 11h2v4h-2z"/>
                        <path fill="#FFFFFF" d="M9 14h6v2H9z"/>
                    </svg>`;
                break;

            default:
                el.innerHTML = `<svg fill="#FF0560" width="32" height="32" viewBox="0 0 24 24" version="1.2" xmlns="http://www.w3.org/2000/svg" overflow="inherit">
                    <path d="M13.376 24h-2.752l-.283-.248C10 23.455 2 16.38 2 10a10 10 0 0 1 20 0c0 6.38-8 13.455-8.341 13.752z" 
                            stroke="black" stroke-width="0.6" fill="#FF0000"/>
                    <path d="M37 7h-28v27c0 2.2 1.8 4 4 4h20c2.2 0 4-1.8 4-4v-5c6.076 0 11-4.925 11-11s-4.924-11-11-11zm0 17v-12c3.314 0 6 2.686 6 6 0 3.313-2.686 6-6 6zm-35 16v2.301c0 1.896 2.069 2.699 4.6 2.699h36.8c2.53 0 4.6-.803 4.6-2.699v-2.301h-46z" 
                            transform="translate(5.5, 4) scale(0.25)" 
                            stroke="black" stroke-width="0.9" fill="#FFFFFF"/>
                    </svg>`;
        }
        
        return el;
    }, []);

    // Saved POI markers (gold)
    const createSavedCustomMarker = useCallback((type: string) => {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        switch (type.toLowerCase()) {
            case 'hotel':
                el.innerHTML = `
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#FFD700" stroke="#333" stroke-width="0.3" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.376 24h-2.752l-.282-.248C10 23.455 2 16.38 2 10a10 10 0 0 1 20 0c0 6.38-8 13.455-8.342 13.752z"/>
                        <path fill="#FFFFFF" d="M18 14H6V7.382l2.255-1.127L9.382 4h5.236l1.127 2.255L18 7.382zM8 12h8V8.618l-1.745-.873L13.382 6h-2.764l-.873 1.745L8 8.618z"/>
                        <path fill="#FFFFFF" d="M11 9h2v2h-2z"/>
                    </svg>`;
                break;
            
            case 'restaurant':
                el.innerHTML = `
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#FFD700" stroke="#333" stroke-width="0.3" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.376 24h-2.752l-.282-.248C10 23.455 2 16.38 2 10a10 10 0 0 1 20 0c0 6.38-8 13.455-8.342 13.752z"/>
                        <path fill="#FFFFFF" d="M16 12h-2v-1a2 2 0 0 0-4 0v1H8v-1a4 4 0 0 1 8 0z"/>
                        <path fill="#FFFFFF" d="M7 11h10v2H7zM11 6h2v2h-2z"/>
                    </svg>`;
                break;
            
            case 'attraction':
                el.innerHTML = `
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#FFD700" stroke="#333" stroke-width="0.3" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.376 24h-2.752l-.283-.248C10 23.455 2 16.38 2 10a10 10 0 0 1 20 0c0 6.38-8 13.455-8.341 13.752z"/>
                        <path fill="#FFFFFF" d="M15 12H9V6h6zm-4-2h2V8h-2z"/>
                        <path fill="#FFFFFF" d="M11 11h2v4h-2z"/>
                        <path fill="#FFFFFF" d="M9 14h6v2H9z"/>
                    </svg>`;
                break;

            case 'cafe':
                el.innerHTML = `
                    <svg fill="#FF0560" width="32" height="32" viewBox="0 0 24 24" version="1.2" xmlns="http://www.w3.org/2000/svg" overflow="inherit">
                    <path d="M13.376 24h-2.752l-.283-.248C10 23.455 2 16.38 2 10a10 10 0 0 1 20 0c0 6.38-8 13.455-8.341 13.752z" 
                            stroke="black" stroke-width="0.6" fill="#FFD700"/>
                    <path d="M37 7h-28v27c0 2.2 1.8 4 4 4h20c2.2 0 4-1.8 4-4v-5c6.076 0 11-4.925 11-11s-4.924-11-11-11zm0 17v-12c3.314 0 6 2.686 6 6 0 3.313-2.686 6-6 6zm-35 16v2.301c0 1.896 2.069 2.699 4.6 2.699h36.8c2.53 0 4.6-.803 4.6-2.699v-2.301h-46z" 
                            transform="translate(5.5, 4) scale(0.25)" 
                            stroke="black" stroke-width="0.9" fill="#FFFFFF"/>
                    </svg>`;
                break;

            default:
                el.innerHTML = `<svg fill="#FF0560" width="32" height="32" viewBox="0 0 24 24" version="1.2" xmlns="http://www.w3.org/2000/svg" overflow="inherit">
                    <path d="M13.376 24h-2.752l-.283-.248C10 23.455 2 16.38 2 10a10 10 0 0 1 20 0c0 6.38-8 13.455-8.341 13.752z" 
                            stroke="black" stroke-width="0.6" fill="#FFD700"/>
                    <path d="M37 7h-28v27c0 2.2 1.8 4 4 4h20c2.2 0 4-1.8 4-4v-5c6.076 0 11-4.925 11-11s-4.924-11-11-11zm0 17v-12c3.314 0 6 2.686 6 6 0 3.313-2.686 6-6 6zm-35 16v2.301c0 1.896 2.069 2.699 4.6 2.699h36.8c2.53 0 4.6-.803 4.6-2.699v-2.301h-46z" 
                            transform="translate(5.5, 4) scale(0.25)" 
                            stroke="black" stroke-width="0.9" fill="#FFFFFF"/>
                    </svg>`;
        }
        
        return el;
    }, []);

    // Event handler for POI name clicks
    useEffect(() => {
        const handleSearchClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const searchLink = target.closest('.search-poi-link');
            
            if (searchLink) {
                e.preventDefault();
                const poiName = searchLink.getAttribute('data-poi-name');
                
                if (poiName) {
                    // Dispatch custom event to notify parent components
                    const event = new CustomEvent('searchForPoi', {
                        detail: { name: poiName },
                        bubbles: true,
                    });
                    document.dispatchEvent(event);
                }
            }
        };
        
        document.addEventListener('click', handleSearchClick);
        
        return () => {
            document.removeEventListener('click', handleSearchClick);
        };
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
    }, [coordinates]); 

    const createPopup = useCallback((poi: POI, isSaved: boolean = false) => {
        const escapedName = poi.name.replace(/"/g, '&quot;');
        
        return new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
                <div class="p-2">
                    <h3 class="font-bold text-base">
                        <a href="#" class="text-blue-600 hover:underline flex items-center search-poi-link" data-poi-name="${escapedName}">
                            ${poi.name}
                        </a>
                    </h3>
                    <p class="text-sm mt-1">${poi.address}</p>
                    <p class="text-sm mt-1 text-yellow-400">${poi.rating ? `Rating: ${poi.rating} ★` : ''}</p>
                    <p class="text-sm text-gray-600 mt-1">${poi.type.charAt(0).toUpperCase() + poi.type.slice(1)}</p>
                    ${isSaved ? '<p class="text-sm text-blue-300 mt-1">Saved</p>' : ''}
                </div>
            `);
    }, []);

    // Update POI markers when POIs change or map loads
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add regular POI markers
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
                    marker.getElement().addEventListener('click', () => {
                        marker.togglePopup();
                    });

                    markersRef.current.push(marker);
                } catch (err) {
                    console.error('Error adding marker:', err, poi);
                }
            }
        });

        // Add saved POI markers
        savedPois.forEach(poi => {            
            if (poi.coordinates?.lat && poi.coordinates?.lng) {
                try {
                    const markerElement = createSavedCustomMarker(poi.type);
                    const marker = new mapboxgl.Marker({
                        element: markerElement
                    })
                        .setLngLat([poi.coordinates.lng, poi.coordinates.lat])
                        .setPopup(createPopup(poi, true));
                    marker.addTo(map.current!);
                    marker.getElement().addEventListener('click', () => {
                        marker.togglePopup();
                    });

                    markersRef.current.push(marker);
                } catch (err) {
                    console.error('Error adding saved marker:', err, poi);
                }
            }
        });
    }, [pois, savedPois, mapLoaded, createCustomMarker, createSavedCustomMarker, createPopup]);

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