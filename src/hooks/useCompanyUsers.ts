// src/hooks/useCompanyUsers.ts
import { useEffect, useState } from 'react';
import { getCompanyStaff } from '../services/api';
import type { User } from '../types';


export function useCompanyUsers(companySlug: string | null) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchUsers = async () => {
    if (!companySlug) return;
    try {
      setLoading(true);
      const res = await getCompanyStaff(companySlug);
      // API might return paginated results
      const items = res.data.results ?? res.data;
      // Flatten nested 'user' object
      const flattened = items.map((item: any) => ({
        id: item.id,
user_id: item.user?.id,
        username: item.user?.username,
        first_name: item.user?.first_name ?? '',
        last_name: item.user?.last_name ?? '',
        email: item.user?.email,
        role: item.role,
        is_active: item.is_active,
      }));
      setUsers(flattened);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [companySlug]);

  return { users, loading, error, refetch: fetchUsers };
}