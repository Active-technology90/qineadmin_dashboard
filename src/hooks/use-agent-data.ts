import { getAgentProperties, getAppointments, getLeads } from "@/services/api";
import { AgentProperty } from "@/types/agent";
import { Appointment } from "@/types/appointment";
import { Lead } from "@/types/property";
import { useQuery } from "@tanstack/react-query";

export const AGENT_QUERY_KEYS = {
    properties: ['agent-properties'] as const,
    leads: ['agent-leads'] as const,
    appointments: ['agent-appointments'] as const,
};

export function useAgentProperties() {
    return useQuery<AgentProperty[]>({
        queryKey: AGENT_QUERY_KEYS.properties,
        queryFn: async () => {
            const res = await getAgentProperties();
            const data = res.data.results ?? res.data;
            return Array.isArray(data) ? data : [];
        },
        staleTime: 1000 * 60 * 3,
    });
}

export function useLeads() {
    return useQuery<Lead[]>({
        queryKey: AGENT_QUERY_KEYS.leads,
        queryFn: async () => {
            const res = await getLeads();
            const data = res.data.results ?? res.data;
            return Array.isArray(data) ? data : [];
        },
        staleTime: 1000 * 60 * 3,
    });
}

export function useAppointments() {
    return useQuery<Appointment[]>({
        queryKey: AGENT_QUERY_KEYS.appointments,
        queryFn: async () => {
            const res = await getAppointments();
            const data = res.data.results ?? res.data;
            return Array.isArray(data) ? data : [];
        },
        staleTime: 1000 * 60 * 3,
    });
}

export function useAgentData() {
    const properties = useAgentProperties();
    const leads = useLeads();
    const appointments = useAppointments();

    const isLoading = properties.isLoading || leads.isLoading || appointments.isLoading;
    const isRefetching = properties.isRefetching || leads.isRefetching || appointments.isRefetching;

    return { properties, leads, appointments, isLoading, isRefetching };
}
