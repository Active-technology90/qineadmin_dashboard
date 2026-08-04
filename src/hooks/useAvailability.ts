import { useState, useEffect, useCallback } from "react";
import {
  getManageAvailability,
  createAvailabilitySlot,
  updateAvailabilitySlot,
  deleteAvailabilitySlot,
} from "../services/api";
import type { AvailabilitySlot } from "../types";
import { normalizeListResponse } from "../utils/normalizeListResponse";

export function useAvailability(companySlug: string | null) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);

  useEffect(() => {
    if (!companySlug) {
      setSlots([]);
      return;
    }

    let active = true;
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getManageAvailability(companySlug);
        if (active) setSlots(normalizeListResponse(res.data));
      } catch {
        if (active) setError("Failed to load availability");
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

  const create = async (data: Partial<AvailabilitySlot>) => {
    if (!companySlug) throw new Error("No company selected");
    const res = await createAvailabilitySlot(companySlug, data);
    refetch();
    return res.data;
  };

  const update = async (id: number, data: Partial<AvailabilitySlot>) => {
    if (!companySlug) throw new Error("No company selected");
    const res = await updateAvailabilitySlot(companySlug, id, data);
    refetch();
    return res.data;
  };

  const remove = async (id: number) => {
    if (!companySlug) throw new Error("No company selected");
    await deleteAvailabilitySlot(companySlug, id);
    refetch();
  };

  return { slots, loading, error, refetch, create, update, remove };
}
