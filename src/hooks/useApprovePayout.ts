import { useState } from "react";
import api from "../services/api";

export function useApprovePayout() {
  const [loading, setLoading] = useState(false);

  const approvePayout = async (id: number) => {
    try {
      setLoading(true);

      await api.patch(`/payments/admin/payouts/${id}/approve/`);

    } finally {
      setLoading(false);
    }
  };

  return { approvePayout, loading };
}