import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Building2, Coffee, Landmark, Star, UtensilsCrossed, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { POIType } from '../../Types/InterfaceTypes';
import { useDebounce } from '../hooks/debounce';

type TabType = 'saved' | 'explore';
type CategoryType = POIType;

interface POIFiltersProps {
    nameFilter: string;
    categoryFilter: CategoryType;
    ratingFilter: number | null;
    onNameFilterChange: (value: string) => void;
    onCategoryFilterChange: (value: CategoryType) => void;
    onRatingFilterChange: (value: number | null) => void;
    onSearch?: () => void;
    tabType: TabType;
    loading?: boolean;
}

const POIFilters = ({
    nameFilter,
    categoryFilter,
    ratingFilter,
    onNameFilterChange,
    onCategoryFilterChange,
    onRatingFilterChange,
    tabType,
    loading = false,
}: POIFiltersProps) => {
    const [localNameFilter, setLocalNameFilter] = useState(nameFilter);
    const debouncedNameFilter = useDebounce(localNameFilter, 500);

    const savedCategories = [
        { value: 'all' as const, label: 'All Categories', icon: null },
        { value: 'hotel' as const, label: 'Hotels', icon: Building2 },
        { value: 'restaurant' as const, label: 'Restaurants', icon: UtensilsCrossed },
        { value: 'attraction' as const, label: 'Attractions', icon: Landmark },
        { value: 'cafe' as const, label: 'Cafes', icon: Coffee },
    ];

    const exploreCategories = [
        { value: 'attraction' as const, label: 'Attractions', icon: Landmark },
        { value: 'hotel' as const, label: 'Hotels', icon: Building2 },
        { value: 'restaurant' as const, label: 'Restaurants', icon: UtensilsCrossed },
        { value: 'cafe' as const, label: 'Cafes', icon: Coffee },
    ];

    const ratingOptions = [
        { value: null, label: 'Any Rating' },
        { value: 3, label: '3+ Stars' },
        { value: 3.5, label: '3.5+ Stars' },
        { value: 4, label: '4+ Stars' },
        { value: 4.5, label: '4.5+ Stars' },
    ];

    useEffect(() => {
        onNameFilterChange(debouncedNameFilter);
    }, [tabType]);

    // Handle name filter changes with debounce
    useEffect(() => {
        onNameFilterChange(debouncedNameFilter);
    }, [debouncedNameFilter, onNameFilterChange]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-grow relative">
                    <div className="relative">
                        <Input
                            placeholder="Filter by name"
                            value={nameFilter}
                            onChange={(e) => onNameFilterChange(e.target.value)}
                            className="w-full bg-white border-gray-200 focus-visible:ring-blue-500 pr-8"
                            disabled={loading}
                        />
                        {nameFilter && (
                            <button
                                type="button"
                                onClick={() => onNameFilterChange('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                                aria-label="Clear search"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    {loading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <div className="relative z-40">
                        <Select
                            value={categoryFilter}
                            onValueChange={onCategoryFilterChange}
                            disabled={loading}
                        >
                            <SelectTrigger className="w-[160px] bg-white border-gray-200">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                {tabType === 'saved' ? savedCategories.map(({ value, label, icon: Icon }) => (
                                    <SelectItem 
                                        key={value} 
                                        value={value}
                                        className="cursor-pointer"
                                    >
                                        <span className="flex items-center">
                                            {Icon && <Icon className="mr-2 h-4 w-4" />}
                                            {label}
                                        </span>
                                    </SelectItem>
                                )) : exploreCategories.map(({ value, label, icon: Icon }) => (
                                    <SelectItem 
                                        key={value} 
                                        value={value}
                                        className="cursor-pointer"
                                    >
                                        <span className="flex items-center">
                                            {Icon && <Icon className="mr-2 h-4 w-4" />}
                                            {label}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="relative z-30">
                        <Select
                            value={ratingFilter?.toString() || "null"}
                            onValueChange={(value) => {
                                const numValue = value === "null" ? null : parseFloat(value);
                                onRatingFilterChange(numValue);
                            }}
                            disabled={loading}
                        >
                            <SelectTrigger className="w-[140px] bg-white border-gray-200">
                                <SelectValue placeholder="Rating" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                {ratingOptions.map(({ value, label }) => (
                                    <SelectItem 
                                        key={value === null ? "null" : value.toString()} 
                                        value={value === null ? "null" : value.toString()}
                                        className="cursor-pointer"
                                    >
                                        <span className="flex items-center">
                                            {value !== null && <Star className="mr-2 h-4 w-4 text-yellow-400 fill-yellow-400" />}
                                            {label}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            
            {tabType === 'explore' && (
                <div className="text-sm text-gray-500">
                    Select a category to explore points of interest
                </div>
            )}
        </div>
    );
};

export default POIFilters;