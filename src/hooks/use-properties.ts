import { PropertyFilters } from "@/components/search";
import { getProperties } from "@/services/api";
import { Property } from "@/types/property";
import { useQuery } from "@tanstack/react-query";

function cleanFilters(filters: PropertyFilters): Record<string, unknown> {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filters)) {
        if (value !== null && value !== undefined && value !== '') {
            clean[key] = value;
        }
    }
    return clean;
}

export function useProperties(filters: PropertyFilters = {}) {
   return useQuery<Property[]>({
    queryKey: ["properties", filters],
    queryFn: async () => {
        const res = await getProperties(cleanFilters(filters));
        const data = res.data.results ?? res.data;
        return Array.isArray(data) ? data : []
    },
   }) 
}