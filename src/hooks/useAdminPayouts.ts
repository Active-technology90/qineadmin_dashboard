import { useEffect, useState } from "react";
import api from "../services/api";

export interface AdminPayout {
  id: number;
  order_number: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
}

export function useAdminPayouts() {
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchPayouts = async () => {
    try {
      setLoading(true);

      const res = await api.get("/payments/admin/payouts/");
      const data = res.data;

      const items = data.results ?? data;

      // ✅ SAFE mapping (matches your backend exactly)
      const mapped: AdminPayout[] = (items || []).map((item: any) => ({
        id: item.id,

        // vendor_order → order_number
        order_number: item.vendor_order
          ? `#${item.vendor_order}`
          : `#${item.id}`,

        // money fields are strings → convert safely
        amount: Number(item.net_amount ?? 0),

        // backend has no method field → static label
        method: "Payout",

        // status directly from backend
        status: item.status ?? "pending",

        // scheduled_at OR fallback
        created_at: item.scheduled_at ?? item.paid_at ?? new Date().toISOString(),
      }));

      setPayouts(mapped);
      setError(null);
    } catch (err) {
      setError(err);
      setPayouts([]); // prevent UI crash
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  return {
    payouts,
    loading,
    error,
    refetch: fetchPayouts,
  };
}