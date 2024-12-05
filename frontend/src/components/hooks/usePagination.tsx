//Used by usePOIData.tsx
import { useState, useCallback } from 'react';
import type { POI } from '@/Types/InterfaceTypes';

interface UsePaginationReturn {
    currentPage: number;
    totalPages: number;
    currentItems: POI[];
    nextPage: () => void;
    prevPage: () => void;
    setPage: (page: number) => void;
    resetPagination: () => void;
}

export const usePagination = (items: POI[], itemsPerPage: number = 10): UsePaginationReturn => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = items.slice(startIndex, startIndex + itemsPerPage);

    const nextPage = useCallback(() => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    }, [totalPages]);

    const prevPage = useCallback(() => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    }, []);

    const setPage = useCallback((page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }, [totalPages]);

    const resetPagination = useCallback(() => {
        setCurrentPage(1);
    }, []);

    return {
        currentPage,
        totalPages,
        currentItems,
        nextPage,
        prevPage,
        setPage,
        resetPagination
    };
};