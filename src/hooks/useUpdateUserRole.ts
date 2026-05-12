import api from "../services/api";

export function useUpdateUserRole() {
  const updateUserRole = async (
    companySlug: string,
    userId: number,
    role: "admin" | "staff" | "viewer"
  ) => {
    try {

      // ✅ ADD HERE (BEFORE PATCH)
      console.log("UPDATING:", {
        companySlug,
        userId,
        role
      });

      const res = await api.patch(
        `/companies/${companySlug}/staff/${userId}/`,
        { role }
      );

      // ✅ OPTIONAL: log response
      console.log("RESPONSE:", res.data);

      return res.data;
    } catch (error: any) {
      console.error("UPDATE ROLE ERROR:", error?.response?.data || error.message);
      throw error;
    }
  };

  return { updateUserRole };
}