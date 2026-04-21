import { getMyDevelopments, getMyProperties, getSellerPropertyDetail } from '@/services/api';
import { Development } from '@/types/development';
import { Property } from '@/types/property';
import { SellerDevelopment, SellerProperty } from '@/types/seller';
import { useQuery } from '@tanstack/react-query';

export const SELLER_QUERY_KEYS = {
    properties: ['seller-properties'] as const,
    property: ['seller-property'] as const,
    developments: ['seller-developments'] as const,
};

export function useSellerProperties() {
    return useQuery<SellerProperty[]>({
        queryKey: SELLER_QUERY_KEYS.properties,
        queryFn: async () => {
            const res = await getMyProperties();
            const data = res.data.results ?? res.data;
            return Array.isArray(data) ? data : [];
        },
        staleTime: 1000 * 60 * 3,
    });
}

export function useSellerProperty(id: number) {
    return useQuery<Property>({
        queryKey: [...SELLER_QUERY_KEYS.property, id],
        queryFn: async () => {
            const res = await getSellerPropertyDetail(id);
            return res.data;
        },
        enabled: id !== null && !isNaN(Number(id)),
        staleTime: 60 * 1000 * 5,
    })
}

export function useSellerDevelopments() {
    return useQuery<Development[]>({
        queryKey: SELLER_QUERY_KEYS.developments,
        queryFn: async () => {
            const res = await getMyDevelopments();
            const data = res.data.results ?? res.data;
            return Array.isArray(data) ? data : [];
        },
        staleTime: 1000 * 60 * 3,
    });
}

export function useSellerData() {
    const properties = useSellerProperties();
    // const property = useSellerProperty(id)
    const developments = useSellerDevelopments();

    const isLoading = properties.isLoading || developments.isLoading;
    const isRefetching = properties.isRefetching || developments.isRefetching;
    const refecth = properties.refetch || developments.refetch;

    return { properties, developments, isLoading, isRefetching, refecth };
}
