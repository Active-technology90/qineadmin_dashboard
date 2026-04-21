import { getProperty } from "@/services/api";
import { Property } from "@/types/property";
import { useQuery } from "@tanstack/react-query";

export function useProperty(id: string | number) {
    return useQuery<Property>({
        queryKey: ["property", id],
        queryFn: async () => {
            const res = await getProperty(id);
            return res.data;
        },
        enabled: id !== null && !isNaN(Number(id)),
        staleTime: 60 * 1000 * 5,
    })
}