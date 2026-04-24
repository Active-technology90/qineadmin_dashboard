import { useState } from "react";
import api from "../services/api";

export function useRejectPayout() {
  const [loading, setLoading] = useState(false);

  const rejectPayout = async (id: number) => {
    try {
      setLoading(true);

      await api.patch(`/payments/admin/payouts/${id}/reject/`);

    } finally {
      setLoading(false);
    }
  };

  return { rejectPayout, loading };
}