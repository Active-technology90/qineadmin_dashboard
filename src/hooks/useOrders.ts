import { useState, useEffect, useCallback } from 'react';
import { getMyOrders, getOrderDetail } from '../services/api';
import type { MasterOrder } from '../types/index';

export function useOrders() {
  const [orders, setOrders] = useState<MasterOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await getMyOrders();
      setOrders(data.results);
    } catch (err: any) {
      setError(err?.message || 'Failed to load orders');
      console.error('useOrders error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}

export function useOrderDetail(orderId: number | undefined) {
  const [order, setOrder] = useState<MasterOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);
      const { data } = await getOrderDetail(orderId);
      setOrder(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { order, loading, error, refetch: fetch };
}
