import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import searchCitiesData from 'cities.json';
import { SearchCity } from "@/Types/InterfaceTypes";

interface CitySearchProps {
    initialValue: string;
    onSubmit: (city: SearchCity) => void;
    className?: string;
    inputClassName?: string;
    showButton?: boolean;
    autoFocus?: boolean;
}

const citiesData: SearchCity[] = searchCitiesData as SearchCity[];

const CitySearch: React.FC<CitySearchProps> = ({
    initialValue,
    onSubmit,
    className = '',
    inputClassName = '',
    showButton = true,
    autoFocus = false
}) => {
    const [searchQuery, setSearchQuery] = useState<string>(initialValue);
    const [suggestions, setSuggestions] = useState<SearchCity[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSearchQuery(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getCountryName = (countryCode: string): string => {
        const countryNames: Record<string, string> = {
            'AD': 'Andorra',
            'GB': 'United Kingdom',
            'US': 'United States',
            'FR': 'France',
            'DE': 'Germany',
            'IT': 'Italy',
            'ES': 'Spain',
            // Add more country codes and names as needed
        };
        return countryNames[countryCode] || countryCode;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value;
        setSearchQuery(value);
        
        if (value.length > 0) {
            const filteredCities = citiesData
                .filter((city: SearchCity) => 
                    city.name.toLowerCase().includes(value.toLowerCase())
                )
                .slice(0, 5);
            
            setSuggestions(filteredCities);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleCitySelect = (city: SearchCity): void => {
        setSearchQuery(city.name);
        setShowSuggestions(false);
    };

    const handleSubmit = (): void => {
        const selectedCity = citiesData.find(
            (city: SearchCity) => city.name.toLowerCase() === searchQuery.toLowerCase()
        );

        if (selectedCity) {
            onSubmit(selectedCity);
        } else {
            alert('Please select a valid city from the suggestions.');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className={`relative ${className}`}>
            <div className="relative flex">
                <Input
                    type="search"
                    placeholder="Search by city or town"
                    value={searchQuery}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className={`${inputClassName} ${showButton ? 'rounded-l-md rounded-r-none border-r-0' : 'rounded-md'}`}
                    autoFocus={autoFocus}
                />
                {showButton && (
                    <Button 
                        onClick={handleSubmit}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-l-none px-4 h-12"
                    >
                        <Search className="h-5 w-5" />
                    </Button>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div 
                    ref={suggestionsRef}
                    className="absolute z-50 w-full bg-white mt-1 rounded-md shadow-lg border border-gray-200 max-h-[200px] overflow-y-auto"
                >
                    {suggestions.map((city: SearchCity, index: number) => (
                        <div
                            key={index}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                            onClick={() => handleCitySelect(city)}
                        >
                            <span className="text-base text-black">{city.name}</span>
                            <span className="text-sm text-gray-500 ml-2">{getCountryName(city.country)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CitySearch;