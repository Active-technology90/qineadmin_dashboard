import { useState, useEffect, useCallback } from "react";
import {
  getManageServiceBookings,
  updateServiceBookingStatus,
  getServiceBookingDetail,   // ← new import
} from "../services/api";
import type { ServiceBooking } from "../types";
import { normalizeListResponse } from "../utils/normalizeListResponse";

export function useServiceBookings(
  companySlug: string | null,
  filters?: { status?: string; date?: string },
) {
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);

  // ── Fetch list (existing) ──────────────────────────
  useEffect(() => {
    if (!companySlug) {
      setBookings([]);
      return;
    }

    let active = true;
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getManageServiceBookings(companySlug, filters);
        if (active) setBookings(normalizeListResponse(res.data));
      } catch {
        if (active) setError("Failed to load bookings");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetch();
    return () => {
      active = false;
    };
  }, [companySlug, filters?.status, filters?.date, refetchCounter]);

  const refetch = useCallback(() => setRefetchCounter((c) => c + 1), []);

  // ── Update status (existing) ──────────────────────
  const updateStatus = async (
    bookingId: number,
    data: {
      status: ServiceBooking["status"];
      company_notes?: string;
      final_price?: string | number;
    },
  ) => {
    if (!companySlug) throw new Error("No company selected");
    const res = await updateServiceBookingStatus(companySlug, bookingId, data);
    refetch();
    return res.data;
  };

  // ── NEW: Fetch a single booking detail ─────────────
  const getBookingDetail = useCallback(
    async (bookingId: number): Promise<ServiceBooking> => {
      if (!companySlug) throw new Error("No company selected");
      const res = await getServiceBookingDetail(companySlug, bookingId);
      return res.data;
    },
    [companySlug],
  );

  return { bookings, loading, error, refetch, updateStatus, getBookingDetail };
}