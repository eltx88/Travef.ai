import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Building2, Landmark, UtensilsCrossed } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { POIType } from '../../Types/InterfaceTypes';
import { useDebounce } from '../hooks/debounce';

type TabType = 'saved' | 'explore';
type CategoryType = POIType;

interface POIFiltersProps {
    nameFilter: string;
    categoryFilter: CategoryType;
    onNameFilterChange: (value: string) => void;
    onCategoryFilterChange: (value: CategoryType) => void;
    onSearch?: () => void;
    tabType: TabType;
    loading?: boolean;
}

const POIFilters = ({
    nameFilter,
    categoryFilter,
    onNameFilterChange,
    onCategoryFilterChange,
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
    ];

    const exploreCategories = [
        { value: 'hotel' as const, label: 'Hotels', icon: Building2 },
        { value: 'restaurant' as const, label: 'Restaurants', icon: UtensilsCrossed },
        { value: 'attraction' as const, label: 'Attractions', icon: Landmark },
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
            <div className="flex gap-4">
                <div className="flex-grow relative">
                    <Input
                        placeholder="Filter by name"
                        value={localNameFilter}
                        onChange={(e) => setLocalNameFilter(e.target.value)}
                        className="w-full bg-white border-gray-200 focus-visible:ring-blue-500"
                        disabled={loading}
                    />
                    {loading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                </div>
                <div className="relative z-45">
                <Select
                    value={categoryFilter}
                    onValueChange={onCategoryFilterChange}
                    disabled={loading}
                >
                        <SelectTrigger className="w-[180px] bg-white border-gray-200">
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