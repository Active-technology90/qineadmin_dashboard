import api from "../services/api";

export function useDeleteCompanyUser() {
  const deleteUser = async (companySlug: string, userId: number) => {
    try {
      console.log("DELETING USER:", { companySlug, userId });

      const res = await api.delete(
        `/companies/${companySlug}/staff/${userId}/`
      );

      return res.data;
    } catch (error: any) {
      console.error("DELETE ERROR:", error?.response?.data || error.message);
      throw error;
    }
  };

  return { deleteUser };
}