import api from "../services/api";
import type { UserRole } from "../types";

export function useAddCompanyUser() {
  const addUser = async (
    companySlug: string,
    email: string,
    role: UserRole
  ) => {
    try {
        console.log("ADDING USER:", {
        companySlug,
        email,
        role
      });
      const res = await api.post(
        `/companies/${companySlug}/staff/`,
        { email, role }
      );

      return res.data;
    } catch (error: any) {
      console.error("ADD USER ERROR:", error?.response?.data || error.message);
      throw error;
    }
  };

  return { addUser };
}