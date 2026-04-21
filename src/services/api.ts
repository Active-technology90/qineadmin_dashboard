// src/services/api.ts
import axios from 'axios';
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
} from '../types';

// ── Configuration ──
// Use environment variable for API URL (create a .env file with REACT_APP_API_URL)
const API_URL = 'https://backend-qine.activetechet.com/api/v1';

// ── Axios Instance ──
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor: Attach JWT from localStorage ──
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('access');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor: Auto‑refresh on 401 ──
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshToken = localStorage.getItem('refresh');
      if (!refreshToken) {
        console.log('No refresh token available, redirecting to login');
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        return Promise.reject(new Error('SESSION_EXPIRED'));
      }

      console.log('Refreshing token...');
      const { data } = await axios.post(
        `${API_URL}/auth/jwt/refresh/`,
        { refresh: refreshToken }
      );

      if (data.access) {
        localStorage.setItem('access', data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } else {
        throw new Error('No access token in response');
      }
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      return Promise.reject(new Error('SESSION_EXPIRED'));
    }
  }
);

// ── Authentication ──
export const login = async (username: string, password: string) => {
  return api.post('/auth/jwt/create/', { username, password });
};

export const registerUser = async (data: {
  email: string;
  username: string;
  password: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
}) => {
  return api.post('/auth/users/', data);
};

export const refreshToken = async (refresh: string) => {
  return api.post('/auth/jwt/refresh/', { refresh });
};

export const getMe = async () => {
  return api.get<User>('/auth/users/me/');
};

export const updateProfile = async (data: FormData | Partial<User>) => {
  const isFormData = data instanceof FormData;
  return api.patch<User>('/auth/users/me/', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
};

export const changePassword = async (data: {
  current_password: string;
  new_password: string;
}) => {
  return api.post('/auth/users/set_password/', data);
};

export const resetPassword = async (email: string) => {
  return api.post('/auth/users/reset_password/', { email });
};

export const resetPasswordConfirm = async (data: {
  uid: string;
  token: string;
  new_password: string;
}) => {
  return api.post('/auth/users/reset_password_confirm/', data);
};

// ── Categories ──
export const getCategories = async () => {
  return api.get<Category[]>('/categories/');
};

export const getCategoryDetail = async (slug: string) => {
  return api.get<Category>(`/categories/${slug}/`);
};

// ── Sub Categories ──
export const getSubCategories = async (categorySlug?: string) => {
  const params = categorySlug ? { category: categorySlug } : {};
  return api.get<SubCategory[]>('/subcategories/', { params });
};

export const getSubCategoryDetail = async (slug: string) => {
  return api.get<SubCategory>(`/subcategories/${slug}/`);
};

// ── Companies ──
export const getCompanies = async (params?: {
  category?: string;
  sub_category?: string;
  business_type?: string;
  featured?: string;
  search?: string;
  page?: number;
  ordering?: string;
}) => {
  return api.get<PaginatedResponse<CompanyListItem>>('/companies/', { params });
};

export const getCompanyDetail = async (slug: string) => {
  return api.get<Company>(`/companies/${slug}/`);
};

export const getFeaturedCompanies = async () => {
  return api.get<PaginatedResponse<CompanyListItem>>('/companies/', {
    params: { featured: 'true' },
  });
};

// ── Products ──
export const getGlobalProducts = async (params?: {
  search?: string;
  page?: number;
}) => {
  return api.get<PaginatedResponse<GlobalProduct>>('/catalog/global/', { params });
};

export const getGlobalProductDetail = async (id: number) => {
  return api.get<GlobalProduct>(`/catalog/global/${id}/`);
};

export const getGlobalProductOffers = async (id: number) => {
  return api.get<PaginatedResponse<CompanyProductListItem>>(
    `/catalog/global/${id}/offers/`,
  );
};

export const getCompanyProducts = async (
  companySlug: string,
  params?: {
    search?: string;
    ordering?: string;
    page?: number;
  },
) => {
  return api.get<PaginatedResponse<CompanyProductListItem>>(
    `/catalog/company/${companySlug}/`,
    { params },
  );
};

export const getCompanyProductDetail = async (
  companySlug: string,
  productId: number,
) => {
  return api.get<CompanyProduct>(
    `/catalog/company/${companySlug}/${productId}/`,
  );
};

export const searchProducts = async (params?: {
  search?: string;
  category?: string;
  sub_category?: string;
  price_min?: string;
  price_max?: string;
  ordering?: string;
  page?: number;
}) => {
  return api.get<PaginatedResponse<CompanyProductListItem>>(
    '/catalog/search/',
    { params },
  );
};

// ── Cart ──
export const getCart = async () => {
  return api.get<Cart>('/cart/');
};

export const addCartItem = async (companyProductId: number, qty: number = 1) => {
  return api.post<CartItem>('/cart/items/', {
    company_product: companyProductId,
    qty,
  });
};

export const updateCartItem = async (itemId: number, qty: number) => {
  return api.patch<CartItem>(`/cart/items/${itemId}/`, { qty });
};

export const removeCartItem = async (itemId: number) => {
  return api.delete(`/cart/items/${itemId}/`);
};

export const getCurrentCart = async () => {
  const response = await api.get<Cart>('/cart/');
  return response;
};

// ── Orders & Checkout ──
export const checkout = async (data: CheckoutRequest) => {
  return api.post<CheckoutResponse>('/orders/checkout/', data);
};

export const getMyOrders = async () => {
  return api.get<PaginatedResponse<MasterOrder>>('/orders/my/');
};

export const getOrderDetail = async (id: number) => {
  return api.get<MasterOrder>(`/orders/${id}/`);
};

// ── Shipping Addresses ──
export const getShippingAddresses = async () => {
  return api.get<ShippingAddress[]>('/orders/shipping-addresses/');
};

export const addShippingAddress = async (
  data: Omit<ShippingAddress, 'id' | 'created_at' | 'is_default'>,
) => {
  return api.post<ShippingAddress>('/orders/shipping-addresses/', data);
};

export const updateShippingAddress = async (
  id: number,
  data: Partial<ShippingAddress>,
) => {
  return api.patch<ShippingAddress>(`/orders/shipping-addresses/${id}/`, data);
};

export const deleteShippingAddress = async (id: number) => {
  return api.delete(`/orders/shipping-addresses/${id}/`);
};

// ── Payments ──
export const getPayouts = async (companySlug: string) => {
  return api.get(`/payments/payouts/${companySlug}/`);
};

export const getBankInfo = async () => {
  return api.get('/payments/bank-info/');
};

// Upload payment receipt (web version: works with File or Blob)
export const uploadPaymentReceipt = async (
  orderId: number,
  file: File | Blob,
  bankId?: string,
  bankName?: string,
  amount?: string
) => {
  const formData = new FormData();
  formData.append('receipt_image', file);
  if (bankId) formData.append('bank_id', bankId);
  if (bankName) formData.append('bank_name', bankName);
  if (amount) formData.append('amount', amount);

  return api.post(`/orders/${orderId}/upload-receipt/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Accept: 'application/json',
    },
  });
};
// ── Company Products Management (Create/Update) ──

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
) => {
  return api.post<CompanyProduct>(`/catalog/company/${companySlug}/`, data);
};

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
) => {
  return api.patch<CompanyProduct>(`/catalog/company/${companySlug}/${productId}/`, data);
};
export const deleteCompanyProduct = async (companySlug: string, productId: number) => {
  return api.delete(`/catalog/company/${companySlug}/${productId}/`);
};

export default api;