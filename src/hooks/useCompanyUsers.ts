import { useEffect, useState } from 'react';
import { getCompanyStaff } from '../services/api';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  role?: string;
}

export function useCompanyUsers(companySlug: string | null) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchUsers = async () => {
    if (!companySlug) return;

    try {
      setLoading(true);
      const res = await getCompanyStaff(companySlug);
      setUsers(res.data.results || res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [companySlug]);

  return { users, loading, error };
}