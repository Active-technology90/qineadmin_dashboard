// useServiceOfferings.ts
import { useState, useEffect, useCallback } from "react";
import {
  getManageServiceOfferings,
  getServiceOfferingDetail, // you'll need to import this from your api
  createServiceOffering,
  updateServiceOffering,
  deleteServiceOffering,
} from "../services/api";
import type { ServiceOffering } from "../types";
import { normalizeListResponse } from "../utils/normalizeListResponse";

export function useServiceOfferings(companySlug: string | null) {
  const [offerings, setOfferings] = useState<ServiceOffering[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);

  useEffect(() => {
    if (!companySlug) {
      setOfferings([]);
      return;
    }
    let active = true;
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getManageServiceOfferings(companySlug);
        if (active) setOfferings(normalizeListResponse(res.data));
      } catch {
        if (active) setError("Failed to load service offerings");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetch();
    return () => {
      active = false;
    };
  }, [companySlug, refetchCounter]);

  const refetch = useCallback(() => setRefetchCounter((c) => c + 1), []);

  const create = async (data: Partial<ServiceOffering>) => {
    if (!companySlug) throw new Error("No company selected");
    const res = await createServiceOffering(companySlug, data);
    refetch();
    return res.data;
  };

  const update = async (id: number, data: Partial<ServiceOffering>) => {
    if (!companySlug) throw new Error("No company selected");
    const res = await updateServiceOffering(companySlug, id, data);
    refetch();
    return res.data;
  };

  const remove = async (id: number) => {
    if (!companySlug) throw new Error("No company selected");
    await deleteServiceOffering(companySlug, id);
    refetch();
  };

  // 👇 New function – fetches full detail
  const getDetail = useCallback(
    async (id: number): Promise<ServiceOffering> => {
      if (!companySlug) throw new Error("No company selected");
      const res = await getServiceOfferingDetail(companySlug, id);
      return res.data;
    },
    [companySlug]
  );

  return { offerings, loading, error, refetch, create, update, remove, getDetail };
}