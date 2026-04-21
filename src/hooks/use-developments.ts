import { getDevelopmentById, getDevelopments, getProperties } from "@/services/api";
import { Development } from "@/types/development";
import { Property } from "@/types/property";
import { useQuery } from "@tanstack/react-query";

export interface DevelopmentFilters {
    search?: string;
    status?: string;
}

export function useDevelopments(filters: DevelopmentFilters = {}) {
    return useQuery<Development[]>({
        queryKey: ["developments", filters],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (filters.search?.trim()) params.search = filters.search.trim();
            if (filters.status) params.status = filters.status;
            const res = await getDevelopments(params);
            const data = res.data;
            return Array.isArray(data) ? data : (data.results ?? []);
        },
        staleTime: 1000 * 60 * 5,
    })
}

// fetch a single development by id
export function useDevelopment(id: string | number | null) {
    return useQuery<Development>({
        queryKey: ["development", id],
        queryFn: async () => {
            const res = await getDevelopmentById(id!);
            return res.data;
        },
        enabled: id !== null && !isNaN(Number(id)),
        staleTime: 1000 * 60 * 5,
    })
}

export function useDevelopmentUnits(id: string | number | null) {
    return useQuery<Property[]>({
        queryKey: ["development-units", id],
        queryFn: async () => {
            const res = await getProperties({development: id});
            const data = res.data;
            return Array.isArray(data) ? data : (data.results ?? []);

        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    })
}