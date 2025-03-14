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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type TabType = 'saved' | 'explore' | 'search';
type CategoryType = POIType | 'all';

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
    sortByRating?: boolean;
    onSortByRatingChange?: (value: boolean) => void;
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
    sortByRating = false,
    onSortByRatingChange,
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
        { value: 4.7, label: '4.7+ Stars' },
        { value: 4.5, label: '4.5+ Stars' },
        { value: 4.0, label: '4.0+ Stars' },
        { value: 3.5, label: '3.5+ Stars' },
    ];

    useEffect(() => {
        onNameFilterChange(debouncedNameFilter);
    }, [tabType]);

    // Handle name filter changes with debounce
    useEffect(() => {
        onNameFilterChange(debouncedNameFilter);
    }, [debouncedNameFilter, onNameFilterChange]);

    // Helper function to render star icons for rating options
    const renderRatingStars = (rating: number | null) => {
        if (rating === null) return null;

        const fullStars = Math.floor(rating);
        const hasPartialStar = rating % 1 > 0;
        const partialStarPercentage = (rating % 1) * 100;

        return (
            <span className="flex items-center">
                <span className="mr-2 font-medium">{rating}+</span>
                {Array(fullStars).fill(0).map((_, i) => (
                    <Star key={i} className="mr-0.5 h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                ))}
                {hasPartialStar && (
                    <span className="relative mr-0.5">
                        <Star className="h-3.5 w-3.5 text-yellow-400" />
                        <Star 
                            className="absolute top-0 left-0 h-3.5 w-3.5 text-yellow-400 fill-yellow-400 overflow-hidden" 
                            style={{ 
                                clipPath: `polygon(0 0, ${partialStarPercentage}% 0, ${partialStarPercentage}% 100%, 0 100%)` 
                            }} 
                        />
                    </span>
                )}
                {Array(5 - Math.ceil(rating)).fill(0).map((_, i) => (
                    <Star key={`empty-${i}`} className="mr-0.5 h-3.5 w-3.5 text-gray-300" />
                ))}
            </span>
        );
    };

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
                {(tabType === 'saved' || tabType === 'explore') && (
                    <div className="relative">
                        <Select
                            value={categoryFilter}
                            onValueChange={onCategoryFilterChange}
                            disabled={loading}
                        >
                            <SelectTrigger className="w-[160px] bg-white border-gray-200 z-10">
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
                )}
                    
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
                            {ratingOptions.map(({ value }) => (
                                <SelectItem 
                                    key={value === null ? "null" : value.toString()} 
                                    value={value === null ? "null" : value.toString()}
                                    className="cursor-pointer"
                                >
                                    <span className="flex items-center gap-2">
                                        {value !== null ? renderRatingStars(value) : "Any Rating"}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                </div>
            </div>

            {/* Sort by rating toggle */}
            {onSortByRatingChange && (
                <div className="flex items-center space-x-2 pt-2">
                    <Switch
                        id="sort-by-rating"
                        checked={sortByRating}
                        onCheckedChange={onSortByRatingChange}
                        disabled={loading}
                    />
                    <Label htmlFor="sort-by-rating" className="text-sm text-gray-700">
                        Sort by highest rating
                    </Label>
                </div>
            )}
            
            {tabType === 'explore' && (
                <div className="text-sm text-gray-500">
                    Select a category to explore points of interest
                </div>
            )}
        </div>
    );
};

export default POIFilters;