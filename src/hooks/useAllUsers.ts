import { useEffect, useState } from "react";
import api from "../services/api";

export interface SystemUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
}

export function useAllUsers() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get("/auth/users/");

        setUsers(Array.isArray(res.data) ? res.data : res.data?.results || []);
      } catch (err: any) {
        console.error("AUTH USERS ERROR:", err?.response?.data || err.message);

        setError(err);
        setUsers([]); // IMPORTANT → prevents white screen
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading, error };
}