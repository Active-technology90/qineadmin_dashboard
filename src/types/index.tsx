// src/types/index.ts
// All types match the exact backend serializer response shapes

// ── Auth & Users ──
export interface Membership {
  company_id: number;
  company_name: string;
  company_slug: string;
  role: string; // "owner" | "admin" | "staff"
}

export interface User {
  id: number;
  email: string;
  username: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  memberships?: Membership[];
  image?: string;
  profile_image?: string;
  role?: string;
  is_active?: boolean;
}

// ── Categories & SubCategories ──
export interface Category {
  id: number;
  name: string;
  name_am?: string;
  slug: string;
  code?: string;
  description?: string;
  description_am?: string;
  icon?: string | null;
  order?: number;
  is_active?: boolean;
  company_count?: number;
    rowNumber: number; 
  subcategories?: SubCategory[]; // Only in detail view
}

export interface SubCategory {
  id: number;
  category: number; // parent category ID
  name: string;
  name_am?: string;
  slug: string;
  item_code?: string;
  description?: string;
  icon?: string | null;
  order?: number;
  is_active?: boolean;
  company_count?: number;
}

// ── Companies ──
export interface Company {
  id: number;
  name: string;
  name_am?: string;
  slug: string;
  logo?: string | null;
  cover_image?: string | null;
  category: number;
  category_name: string;
  sub_category: number;
  sub_category_name: string;
  business_type: string; // "brand" | "factory" | "store" | "service"
  description?: string;
  description_am?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  is_active: boolean;
  is_featured: boolean;
  created_at?: string;
  // Financial fields (owner/admin only)
  chapa_sub_account_id?: string;
  tin_number?: string;
  vat_registration_number?: string;
  tax_type?: string;
}

// Lightweight version from CompanyListSerializer (includes all list fields)
export interface CompanyListItem {
  id: number;
  name: string;
  name_am?: string;
  slug: string;
  logo?: string | null;
  cover_image?: string | null;  // ✅ added – present in API response
  category: number;
  category_name: string;
  sub_category: number;
  sub_category_name: string;
  business_type: string;
  is_active: boolean;
  is_featured: boolean;
  description?: string; // optional, not always in list
}

// ── Catalog / Products ──
export interface ProductImage {
  id: number;
  image: string; // URL
  alt_text?: string;
  order?: number;
  is_primary?: boolean;
  created_at?: string; // sometimes present
}

export interface GlobalProduct {
  id: number;
  name: string;
  name_am?: string;
  description?: string;
  description_am?: string;
  category: number;
  category_name: string;
  sub_category: number;
  sub_category_name: string;
  seller_count: number;
  created_at: string;
  updated_at: string;
}

// Full company product (detail view)
export interface CompanyProduct {
  id: number;
  company: CompanyListItem;
  global_product?: number | null;
  sku?: string;
  title: string;
  title_am?: string;
  description?: string;
  description_am?: string;
  price: string; // Decimal as string
  compare_at_price?: string | null;
  currency: string;
  stock: number;
  unit?: string;
  attributes?: Record<string, any>;
  is_active: boolean;
  is_featured: boolean;
  images: ProductImage[];
  primary_image?: ProductImage | null;
  created_at: string;
  updated_at: string;
}

// Lightweight product for list views (no full images array)
export interface CompanyProductListItem {
  id: number;
  company: number;
  company_name: string;
  company_slug: string;
  global_product?: number | null;
  sku?: string;
  title: string;
  title_am?: string;
  price: string;
  compare_at_price?: string | null;
  currency: string;
  stock: number;
  unit?: string;
  is_active: boolean;
  is_featured: boolean;
  primary_image?: string | null; // URL string
}

// ── Cart ──
export interface CartItem {
  id: number;
  company_product: number;
  product_title: string;
  product_price: string;
  company_name: string;
  company_slug: string;
  qty: number;
  unit_price: string;
  line_total: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total: string;
  subtotal?: string;
  tax_total?: string;
  total_amount?: string;
  item_count: number;
  vendor_count: number;
  updated_at: string;
}

export interface LocalCartItem {
  id: string | number;
  company_product_id: number;
  title: string;
  price: number;
  image?: string;
  company_name: string;
  company_slug: string;
  qty: number;
  stock?: number;
  line_total?: number;
}

// ── Orders ──
export interface OrderItem {
  id: number;
  title: string;
  sku?: string;
  unit_price: string;
  qty: number;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  line_total: string;
  company_name?: string;
  product_reference?: number;
  product_image?: string;
}

export interface TaxInvoice {
  invoice_number: string;
  issued_at: string;
  company_name: string;
  company_tin?: string;
  company_vat_number?: string;
  tax_type?: string;
  customer_name?: string;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  currency: string;
  pdf_url?: string;
}
export interface Delivery {
   id: number;                          // unique ID of the delivery
  vendor_order: number;                // ID of the vendor order
  delivery_person?: number;            // ID of the assigned delivery person
 
  delivery_date?: string;
  delivery_time?: string;
  delivery_person_id?: number;
  delivery_person_phone?: string;
  delivery_person_name?: string;
  tracking_id?: string;
  status?: string;
}
export interface VendorOrder {
  id: number;
  company: CompanyListItem;
  subtotal: string;
  tax_amount: string;
  amount: string;
  status: string;
  delivery_status?: string;
  delivery_notes?: string;
  created_at: string;
  items: OrderItem[];
  tax_invoice?: TaxInvoice;
  recipient_name?: string;
  shipping_phone?: string;
  shipping_address_text?: string;
  delivery?: Delivery;
  payment_method: string;
}

export interface MasterOrder {
  id: number;
  user: number;
  status: string;
  fulfillment_type: string;
  payment_method: string;
  subtotal: string;
  tax_total: string;
  total_amount: string;
  currency: string;
  recipient_name: string;
  shipping_phone: string;
  shipping_address_text: string;
  created_at: string;
  updated_at: string;
  vendor_orders: VendorOrder[];
  vendor_count: number;
  payment_status: string;
}

export interface ShippingAddress {
  id: number;
  recipient_name: string;
  phone_number: string;
  city?: string;
  sub_city?: string;
  woreda?: string;
  house_number?: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at?: string;
}

export interface CheckoutRequest {
  cart_id: number;
  payment_method: "chapa" | "bank_transfer" | "cod";
  fulfillment_type: "delivery" | "pickup";
  shipping_address_id: number;
  recipient_name?: string;
  recipient_phone?: string;
  shipping_address_text?: string;
}

export interface CheckoutResponse {
  master_order_id: number;
  payment_url: string;
  payment_mode: string;
}

// ── Pagination ──
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Legacy / Deprecated (keep for compatibility) ──
export interface Product {
  id: number;
  company: number;
  title: string;
  price: string;
  stock: number;
  primary_image?: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: number;
  name: string;
  name_am: string;
  slug: string;
  address: string;
  business_type: "service";
  category: number;
  category_name: string;
  sub_category: number;
  sub_category_name: string;
  logo: string | null;
  cover_image: string | null;
  is_active: boolean;
  is_featured: boolean;
}

