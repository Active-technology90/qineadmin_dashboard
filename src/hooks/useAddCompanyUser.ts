import api from "../services/api";

export function useAddCompanyUser() {
  const addUser = async (
    companySlug: string,
    email: string,
    role: "admin" | "staff" | "viewer" | "delivery"
  ) => {
    try {
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