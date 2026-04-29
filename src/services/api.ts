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
  VendorOrder,
  Delivery,
} from "../types";

const API_URL = "https://backend-qine.activetechet.com/api/v1";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Flag to prevent multiple simultaneous token refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor: attach token
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If not 401 or already retried → reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request while refresh is in progress
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem("refresh");
    if (!refreshToken) {
      // No refresh token → force logout
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/signin";
      return Promise.reject(new Error("SESSION_EXPIRED"));
    }

    try {
      const { data } = await axios.post(`${API_URL}/auth/jwt/refresh/`, {
        refresh: refreshToken,
      });
      if (data.access) {
        localStorage.setItem("access", data.access);
        processQueue(null, data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } else {
        throw new Error("No access token in refresh response");
      }
    } catch (refreshError) {
      // Refresh failed → clear tokens and redirect to login
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      processQueue(refreshError as Error, null);
      window.location.href = "/signin";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ========== AUTHENTICATION ==========
export const login = async (username: string, password: string) =>
  api.post("/auth/jwt/create/", { username, password });

export const getAllUsers = async () => api.get<User[]>("users/admin/all-users/");
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

export const createCategory = async (data: FormData | Record<string, any>) => {
  const isFormData = data instanceof FormData;
  return api.post("/categories/", data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};

export const updateCategory = async (
  slug: string,
  data: FormData | Partial<Category>
) => {
  const isFormData = data instanceof FormData;
  return api.patch(`/categories/${slug}/`, data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};

export const deleteCategory = async (slug: string) =>
  api.delete(`/categories/${slug}/`);

// ========== SUBCATEGORIES ==========
export const getSubCategories = async (categorySlug?: string) => {
  const params = categorySlug ? { category: categorySlug } : {};
  return api.get<SubCategory[]>("/subcategories/", { params });
};

export const getSubCategoryDetail = async (slug: string) =>
  api.get<SubCategory>(`/subcategories/${slug}/`);

export const createSubCategory = async (data: FormData | any) => {
  const isFormData = data instanceof FormData;
  return api.post("/subcategories/", data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};

export const updateSubCategory = async (slug: string, data: FormData | any) => {
  const isFormData = data instanceof FormData;
  return api.patch(`/subcategories/${slug}/`, data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};

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

export const createCompany = async (data: FormData | Record<string, any>) => {
  const isFormData = data instanceof FormData;
  return api.post<Company>("/companies/", data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};

export const updateCompany = async (
  slug: string,
  data: FormData | Partial<Company>
) => {
  const isFormData = data instanceof FormData;
  return api.patch<Company>(`/companies/${slug}/`, data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};

export const deleteCompany = async (slug: string) =>
  api.delete(`/companies/${slug}/`);

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
    `/catalog/global/${id}/offers/`
  );

export const getCompanyProducts = async (
  companySlug: string,
  params?: {
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  }
) =>
  api.get<PaginatedResponse<CompanyProductListItem>>(
    `/catalog/company/${companySlug}/`,
    { params }
  );

export const getCompanyProductDetail = async (
  companySlug: string,
  productId: number
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

// Company Product Management
export const createCompanyProduct = async (
  companySlug: string,
  data: {
    sku: string;
    title: string;
    title_am?: string;
    price: string | number;
    stock: number;
    unit: string;
  }
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
  }>
) =>
  api.patch<CompanyProduct>(`/catalog/company/${companySlug}/${productId}/`, data);

export const deleteCompanyProduct = async (
  companySlug: string,
  productId: number
) => api.delete(`/catalog/company/${companySlug}/${productId}/`);

// Product Images
export const uploadProductImage = async (
  companySlug: string,
  productId: number,
  file: File,
  isPrimary: boolean = false
) => {
  const formData = new FormData();
  formData.append("image", file);
  if (isPrimary) formData.append("is_primary", "true");
  return api.post<ProductImage>(
    `/catalog/company/${companySlug}/${productId}/images/`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
};

export const deleteProductImage = async (
  companySlug: string,
  productId: number,
  imageId: number
) =>
  api.delete(
    `/catalog/company/${companySlug}/${productId}/images/${imageId}/`
  );

export const updateProductImage = async (
  companySlug: string,
  productId: number,
  imageId: number,
  data: Partial<{ order: number; is_primary: boolean }>
) =>
  api.patch<ProductImage>(
    `/catalog/company/${companySlug}/${productId}/images/${imageId}/`,
    data
  );

export const reorderProductImages = async (
  companySlug: string,
  productId: number,
  imageIds: number[]
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
  data: Omit<ShippingAddress, "id" | "created_at" | "is_default">
) => api.post<ShippingAddress>("/orders/shipping-addresses/", data);
export const updateShippingAddress = async (
  id: number,
  data: Partial<ShippingAddress>
) => api.patch<ShippingAddress>(`/orders/shipping-addresses/${id}/`, data);
export const deleteShippingAddress = async (id: number) =>
  api.delete(`/orders/shipping-addresses/${id}/`);

// ========== PAYMENTS ==========
// ========== PAYMENTS ==========
export const getPayouts = async (
  companySlug: string,
  params?: { page?: number; page_size?: number; status?: string }
) => api.get(`/payments/payouts/${companySlug}/`, { params });

export const getAdminPayouts = async (params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) => api.get('/payments/admin/payouts/', { params });

export const getBankInfo = async () => api.get("/payments/bank-info/");

export const uploadPaymentReceipt = async (
  orderId: number,
  file: File | Blob,
  bankId?: string,
  bankName?: string,
  amount?: string
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

// ========== ADMIN ORDERS ==========
export const getAdminMasterOrders = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  ordering?: string;
  signal?: AbortSignal;
}) => {
  const { signal, ...queryParameters } = params || {};
  return api.get<PaginatedResponse<MasterOrder>>("/orders/admin/master-orders", {
    params: queryParameters,
    signal,
  });
};

export const getAdminVendorOrders = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  company?: string;
  status?: string;
  master_order?: number;
  ordering?: string;
  signal?: AbortSignal;
}) => {
  const { signal, ...queryParameters } = params || {};
  return api.get<PaginatedResponse<VendorOrder>>("orders/admin/vendor-orders/", {
    params: queryParameters,
    signal,
  });
};

// ========== COMPANY ORDERS (for company admin) ==========
export const getCompanyVendorOrders = async (
  companySlug: string,
  params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    ordering?: string;
    signal?: AbortSignal;
  }
) => {
  const { signal, ...queryParameters } = params || {};
  return api.get<PaginatedResponse<VendorOrder>>(`/orders/company/${companySlug}/`, {
    params: queryParameters,
    signal,
  });
};
  // ========== DELIVERIES ==========
export const assignDelivery = async (data: { vendor_order: number; delivery_person: number }) =>
  api.post("/deliveries/", data);

export const updateDeliveryPerson = async (deliveryId: number, deliveryPersonId: number) =>
  api.patch(`/deliveries/${deliveryId}/`, { delivery_person: deliveryPersonId });
export const getDeliveries = async (params?: {
  vendor_order?: number;
  delivery_person?: number;
  status?: string;
}) => api.get<PaginatedResponse<Delivery>>("/deliveries/", { params });
// ========== USER SEARCH (for company admin) ==========
export const searchUsers = async (query: string) =>
  api.get<PaginatedResponse<User>>("/users/search/", { params: { q: query } });


// NEW: Get company staff filtered by role (e.g., delivery)
export const getCompanyStaffByRole = async (companySlug: string, role: string) =>
  api.get(`/companies/${companySlug}/staff/`, { params: { role } });
// ========== RECEIPTS ==========

// Get company receipts
export const getCompanyReceipts = async (companySlug: string, params?: {
  page?: number;
  page_size?: number;
}) =>
  api.get(`/payments/company/${companySlug}/receipts/`, { params });
// Review / approve / reject receipt

export const reviewReceipt = async (
  receiptId: number,
  data: {
    status: "approved" | "rejected" | "pending";
    admin_notes?: string;
  }
) =>
  api.patch(`/payments/receipts/${receiptId}/review/`, data);
export default api;