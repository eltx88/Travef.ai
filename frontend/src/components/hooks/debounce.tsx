// To avoid excessive API calls, we can use a debounce hook to delay the API call until the user has stopped typing. This will reduce the number of API calls and improve the user experience.
// called by the file POIFilters.tsx
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}