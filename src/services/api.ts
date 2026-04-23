// src/services/api.ts
import axios from "axios";
import type {
  Category,
  SubCategory,
  Company,
  CompanyListItem,
  CompanyProduct,
  CompanyProductListItem,
  GlobalProduct,
  Cart,
  CartItem,
  MasterOrder,
  ShippingAddress,
  CheckoutRequest,
  CheckoutResponse,
  PaginatedResponse,
  User,
  ProductImage,
} from "../types";

const API_URL = "https://backend-qine.activetechet.com/api/v1";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor (attach token)
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor (refresh token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;
    try {
      const refreshToken = localStorage.getItem("refresh");
      if (!refreshToken) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        return Promise.reject(new Error("SESSION_EXPIRED"));
      }
      const { data } = await axios.post(`${API_URL}/auth/jwt/refresh/`, {
        refresh: refreshToken,
      });
      if (data.access) {
        localStorage.setItem("access", data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      }
      throw new Error("No access token");
    } catch {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      return Promise.reject(new Error("SESSION_EXPIRED"));
    }
  },
);

// ========== AUTHENTICATION ==========
export const login = async (username: string, password: string) =>
  api.post("/auth/jwt/create/", { username, password });

export const registerUser = async (data: {
  email: string;
  username: string;
  password: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
}) => api.post("/auth/users/", data);

export const refreshToken = async (refresh: string) =>
  api.post("/auth/jwt/refresh/", { refresh });

export const getMe = async () => api.get<User>("/auth/users/me/");

export const updateProfile = async (data: FormData | Partial<User>) => {
  const isFormData = data instanceof FormData;
  return api.patch<User>("/auth/users/me/", data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};

export const changePassword = async (data: {
  current_password: string;
  new_password: string;
}) => api.post("/auth/users/set_password/", data);

export const resetPassword = async (email: string) =>
  api.post("/auth/users/reset_password/", { email });

export const resetPasswordConfirm = async (data: {
  uid: string;
  token: string;
  new_password: string;
}) => api.post("/auth/users/reset_password_confirm/", data);

// ========== CATEGORIES ==========
export const getCategories = async () => api.get<Category[]>("/categories/");
export const getCategoryDetail = async (slug: string) =>
  api.get<Category>(`/categories/${slug}/`);

// Create category (admin only)
// src/services/api.ts

export const createCategory = async (data: FormData | Record<string, any>) => {
  const isFormData = data instanceof FormData;

  return api.post('/categories/', data, {
    headers: isFormData
      ? { 'Content-Type': 'multipart/form-data' }
      : undefined,
  });
};

export const updateCategory = async (
  slug: string,
  data: FormData | Partial<Category>
) => {
  const isFormData = data instanceof FormData;

  return api.patch(`/categories/${slug}/`, data, {
    headers: isFormData
      ? { 'Content-Type': 'multipart/form-data' }
      : undefined,
  });
};
// Delete category (admin only)
export const deleteCategory = async (slug: string) =>
  api.delete(`/categories/${slug}/`);

// ========== SUBCATEGORIES ==========
export const getSubCategories = async (categorySlug?: string) => {
  const params = categorySlug ? { category: categorySlug } : {};
  return api.get<SubCategory[]>("/subcategories/", { params });
};

export const getSubCategoryDetail = async (slug: string) =>
  api.get<SubCategory>(`/subcategories/${slug}/`);

// Create subcategory (admin only)
export const createSubCategory = async (data: FormData | any) => {
  const isFormData = data instanceof FormData;

  return api.post("/subcategories/", data, {
    headers: isFormData
      ? { "Content-Type": "multipart/form-data" }
      : undefined,
  });
};

export const updateSubCategory = async (
  slug: string,
  data: FormData | any
) => {
  const isFormData = data instanceof FormData;

  return api.patch(`/subcategories/${slug}/`, data, {
    headers: isFormData
      ? { "Content-Type": "multipart/form-data" }
      : undefined,
  });
};
// Delete subcategory (admin only)
export const deleteSubCategory = async (slug: string) =>
  api.delete(`/subcategories/${slug}/`);

// ========== COMPANIES ==========
export const getCompanies = async (params?: {
  category?: string;
  sub_category?: string;
  business_type?: string;
  featured?: string;
  search?: string;
  page?: number;
  ordering?: string;
}) => api.get<PaginatedResponse<CompanyListItem>>("/companies/", { params });

export const getCompanyDetail = async (slug: string) =>
  api.get<Company>(`/companies/${slug}/`);

export const getFeaturedCompanies = async () =>
  api.get<PaginatedResponse<CompanyListItem>>("/companies/", {
    params: { featured: "true" },
  });

// Create company (admin only) – supports both JSON and FormData
// In api.ts
export const createCompany = async (data: FormData | Record<string, any>) => {
  const isFormData = data instanceof FormData;
  return api.post<Company>('/companies/', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
};

export const updateCompany = async (slug: string, data: FormData | Partial<Company>) => {
  const isFormData = data instanceof FormData;
  return api.patch<Company>(`/companies/${slug}/`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
};
// Delete company (admin only)
export const deleteCompany = async (slug: string) =>
  api.delete(`/companies/${slug}/`);

// Get company staff (admin)
export const getCompanyStaff = async (companySlug: string) =>
  api.get(`/companies/${companySlug}/staff/`);

// ========== PRODUCTS (Catalog) ==========
export const getGlobalProducts = async (params?: {
  search?: string;
  page?: number;
}) => api.get<PaginatedResponse<GlobalProduct>>("/catalog/global/", { params });

export const getGlobalProductDetail = async (id: number) =>
  api.get<GlobalProduct>(`/catalog/global/${id}/`);

export const getGlobalProductOffers = async (id: number) =>
  api.get<PaginatedResponse<CompanyProductListItem>>(
    `/catalog/global/${id}/offers/`,
  );

export const getCompanyProducts = async (
  companySlug: string,
  params?: {
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  },
) =>
  api.get<PaginatedResponse<CompanyProductListItem>>(
    `/catalog/company/${companySlug}/`,
    { params },
  );

export const getCompanyProductDetail = async (
  companySlug: string,
  productId: number,
) => api.get<CompanyProduct>(`/catalog/company/${companySlug}/${productId}/`);

export const searchProducts = async (params?: {
  search?: string;
  category?: string;
  sub_category?: string;
  price_min?: string;
  price_max?: string;
  ordering?: string;
  page?: number;
}) =>
  api.get<PaginatedResponse<CompanyProductListItem>>("/catalog/search/", {
    params,
  });

// Company Product Management (for the company admin)
export const createCompanyProduct = async (
  companySlug: string,
  data: {
    sku: string;
    title: string;
    title_am?: string;
    price: string | number;
    stock: number;
    unit: string;
  },
) => api.post<CompanyProduct>(`/catalog/company/${companySlug}/`, data);

export const updateCompanyProduct = async (
  companySlug: string,
  productId: number,
  data: Partial<{
    sku: string;
    title: string;
    title_am: string;
    price: string | number;
    stock: number;
    unit: string;
  }>,
) =>
  api.patch<CompanyProduct>(
    `/catalog/company/${companySlug}/${productId}/`,
    data,
  );

export const deleteCompanyProduct = async (
  companySlug: string,
  productId: number,
) => api.delete(`/catalog/company/${companySlug}/${productId}/`);

// Product Images
export const uploadProductImage = async (
  companySlug: string,
  productId: number,
  file: File,
  isPrimary: boolean = false,
) => {
  const formData = new FormData();
  formData.append("image", file);
  if (isPrimary) formData.append("is_primary", "true");
  return api.post<ProductImage>(
    `/catalog/company/${companySlug}/${productId}/images/`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
};

export const deleteProductImage = async (
  companySlug: string,
  productId: number,
  imageId: number,
) =>
  api.delete(`/catalog/company/${companySlug}/${productId}/images/${imageId}/`);

export const updateProductImage = async (
  companySlug: string,
  productId: number,
  imageId: number,
  data: Partial<{ order: number; is_primary: boolean }>,
) =>
  api.patch<ProductImage>(
    `/catalog/company/${companySlug}/${productId}/images/${imageId}/`,
    data,
  );

export const reorderProductImages = async (
  companySlug: string,
  productId: number,
  imageIds: number[],
) =>
  api.patch(`/catalog/company/${companySlug}/${productId}/images/reorder/`, {
    image_ids: imageIds,
  });

// ========== CART ==========
export const getCart = async () => api.get<Cart>("/cart/");
export const addCartItem = async (companyProductId: number, qty: number = 1) =>
  api.post<CartItem>("/cart/items/", {
    company_product: companyProductId,
    qty,
  });
export const updateCartItem = async (itemId: number, qty: number) =>
  api.patch<CartItem>(`/cart/items/${itemId}/`, { qty });
export const removeCartItem = async (itemId: number) =>
  api.delete(`/cart/items/${itemId}/`);
export const getCurrentCart = async () => api.get<Cart>("/cart/");

// ========== ORDERS & CHECKOUT ==========
export const checkout = async (data: CheckoutRequest) =>
  api.post<CheckoutResponse>("/orders/checkout/", data);
export const getMyOrders = async () =>
  api.get<PaginatedResponse<MasterOrder>>("/orders/my/");
export const getMyOrder = async () =>
  api.get<PaginatedResponse<MasterOrder>>("/orders/");
export const getOrderDetail = async (id: number) =>
  api.get<MasterOrder>(`/orders/${id}/`);

// ========== SHIPPING ADDRESSES ==========
export const getShippingAddresses = async () =>
  api.get<ShippingAddress[]>("/orders/shipping-addresses/");
export const addShippingAddress = async (
  data: Omit<ShippingAddress, "id" | "created_at" | "is_default">,
) => api.post<ShippingAddress>("/orders/shipping-addresses/", data);
export const updateShippingAddress = async (
  id: number,
  data: Partial<ShippingAddress>,
) => api.patch<ShippingAddress>(`/orders/shipping-addresses/${id}/`, data);
export const deleteShippingAddress = async (id: number) =>
  api.delete(`/orders/shipping-addresses/${id}/`);

// ========== PAYMENTS ==========
export const getPayouts = async (companySlug: string) =>
  api.get(`/payments/payouts/${companySlug}/`);
export const getBankInfo = async () => api.get("/payments/bank-info/");

export const uploadPaymentReceipt = async (
  orderId: number,
  file: File | Blob,
  bankId?: string,
  bankName?: string,
  amount?: string,
) => {
  const formData = new FormData();
  formData.append("receipt_image", file);
  if (bankId) formData.append("bank_id", bankId);
  if (bankName) formData.append("bank_name", bankName);
  if (amount) formData.append("amount", amount);
  return api.post(`/orders/${orderId}/upload-receipt/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
    },
  });
};

export default api;
