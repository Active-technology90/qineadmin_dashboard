import { useState, useCallback, useRef, useEffect } from "react";
import { getAdminMasterOrders } from "../services/api";
import { useToast } from "./useToast";
import type { MasterOrder } from "../types";

const ITEMS_PER_PAGE = 10;

export function useMasterOrders() {
  const [orders, setOrders] = useState<MasterOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const fetchingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const { showToast } = useToast();

  const fetchOrders = useCallback(
    async (page: number, search: string, status: string) => {
      const token = localStorage.getItem("access");
      if (!token) {
        setError("Please log in to view orders");
        setLoading(false);
        return;
      }
      if (fetchingRef.current) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const res = await getAdminMasterOrders({
          page,
          page_size: ITEMS_PER_PAGE,
          search: search || undefined,
          status: status || undefined,
          ordering: "-created_at",
        });
        if (!controller.signal.aborted) {
          setOrders(res.data.results);
          setTotalCount(res.data.count);
        }
      } catch (err: any) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        const message =
          err.message === "SESSION_EXPIRED"
            ? "Your session has expired. Please log in again."
            : err.response?.data?.detail || err.message || "Failed to load master orders";
        setError(message);
        showToast("error", message);
      } finally {
        if (!controller.signal.aborted) {
          fetchingRef.current = false;
          setLoading(false);
        }
      }
    },
    [showToast]
  );

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return { orders, loading, error, totalCount, fetchOrders };
}