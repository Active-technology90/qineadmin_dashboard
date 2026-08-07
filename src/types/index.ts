// src/types/index.ts

// ─────────────────────────────────────────────────────────────
// User & Membership (matching backend serializer)
// ─────────────────────────────────────────────────────────────
export type UserRole = "owner" | "admin" | "staff" | "viewer" | "delivery";
export interface Membership {
  company_id: number;
  company_name: string;
  company_slug: string;
  role: UserRole;
  is_active: boolean;
}

export interface User {
  id: number;
  email: string;
  username: string;
  phone_number: string | null;
  profile_image: string | null;
  first_name: string;
  last_name: string;
  memberships: Membership[];
  is_active?: boolean;
  role?: string;
  permissions?: string[];
  is_marketing?: boolean;
  daily_target?: number;
  weekly_target?: number;
}
export interface UsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}
// ─────────────────────────────────────────────────────────────
// Categories & SubCategories
// ─────────────────────────────────────────────────────────────
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
  subcategories?: SubCategory[];
}

export interface SubCategory {
  id: number;
  category: number;
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

// ── Head Companies (umbrella grouping) ──
export interface HeadCompany {
  id: number;
  name: string;
  name_am?: string;
  slug: string;
  logo?: string | null;
  cover_image?: string | null;
  is_active: boolean;
  branch_count?: number;
  created_at?: string;
}

// Nested parent-company info attached to a branch (head_company_detail)
export interface HeadCompanyMini {
  id: number;
  name: string;
  name_am?: string;
  slug: string;
  logo?: string | null;
}

// ── Companies ──
export interface Company {
  id: number;
  name: string;
  name_am?: string;
  slug: string;
  logo?: string | null;
  cover_image?: string | null;
  head_company?: number | null;
  head_company_detail?: HeadCompanyMini | null;
  category: number;
  category_name: string;
  sub_category: number;
  sub_category_name: string;
  business_type: string;
  description?: string;
  description_am?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  address_am?: string;
  is_active: boolean;
  is_featured: boolean;
  supports_table_service: boolean;
  created_at?: string;
  chapa_sub_account_id?: string;
  minimum_order_total?: string;
  latitude?: string;
  longitude?: string;
  delivery_fee_per_km?: string;
  theme_primary?: string;
  theme_dark?: string;
  theme_light?: string;
  tin_number?: string;
  vat_registration_number?: string;
  tax_type?: string;
  license?: string | null;
  registered_by?: number;
  registered_by_username?: string;
}

export interface CompanyListItem {
  id: number;
  name: string;
  name_am?: string;
  slug: string;
  logo?: string | null;
  cover_image?: string | null;
  head_company?: number | null;
  head_company_detail?: HeadCompanyMini | null;
  category: number;
  category_name: string;
  sub_category: number;
  sub_category_name: string;
  business_type: string;
  address?: string;
  address_am?: string;
  minimum_order_total?: string;
  latitude?: string;
  longitude?: string;
  delivery_fee_per_km?: string;
  theme_primary?: string;
  theme_dark?: string;
  theme_light?: string;
  is_active: boolean;
  is_featured: boolean;
  supports_table_service: boolean;
  description?: string;
  contact_phone: string;
  contact_email: string;
  tin_number?: string;
  vat_registration_number?: string;
  tax_type?: string;
  license?: string | null;
  registered_by?: number;
  registered_by_username?: string;
}

// ── Products ──
export interface ProductImage {
  id: number;
  image: string;
  alt_text?: string;
  order?: number;
  is_primary?: boolean;
  created_at?: string;
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

export interface CompanyProduct {
  id: number;
  company: CompanyListItem;
  global_product?: number | null;
  sku?: string;
  title: string;
  title_am?: string;
  description?: string;
  description_am?: string;
  price: string;
  compare_at_price?: string | null;
  currency: string;
  stock: number;
  unit?: string;
  attributes?: Record<string, any>;
  is_active: boolean;
  is_featured: boolean;
  images: ProductImage[];
  primary_image?: ProductImage | null;
  // ── View-Only Stats ──
  sales_count?: number;
  average_rating?: string | null;
  total_reviews?: number;
  created_at: string;
  updated_at: string;
}

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
  primary_image?: string | null;
  // ── View-Only Stats ──
  sales_count?: number;
  average_rating?: string | null;
  total_reviews?: number;
}

// ── Cart & Orders ──
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
  id: number;
  vendor_order: number;
  delivery_person?: number;
  delivery_date?: string;
  delivery_time?: string;
  delivery_person_id?: number;
  delivery_person_phone?: string;
  delivery_person_name?: string;
  tracking_id?: string;
  status?: string;
  delivery_person_image: string;
  customer_lat: number;
  customer_lon: number;
  current_lat: number;
  current_lng: number;
}

export interface VendorOrder {
  id: number;
  company: CompanyListItem;
  payment_method: "chapa" | "bank_transfer" | string;
  receipt: {
    id: number;
    status: string;
    receipt_image: string;
    bank_name: string;
    amount: string;
    uploaded_at: string;
  } | null;
  subtotal: string;
  tax_amount: string;
  amount: string;
  recipient_image: string;
  delivery_fee: string;
  status: string;
  delivery_status?: string;
  delivery_notes?: string;
  created_at: string;
  items: OrderItem[];
  tax_invoice?: TaxInvoice;
  payment_status?: string;
  recipient_name?: string;
  shipping_phone?: string;
  shipping_address_text?: string;
  delivery?: Delivery;
  master_order_id?: number;
  fulfillment_type?: string
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
  delivery_fee: string;
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

// ── Analytics ──
export interface AnalyticsCompanyOption {
  id: number;
  name: string;
  slug: string;
}

export interface AnalyticsSummary {
  company_total_count: number;
  company_active_count: number;
  products: number;
  users: number;
  orders: number;
  payments_total: number;
  avg_order_value: number;
  success_rate: number;
  active_categories: number;
}

export interface AnalyticsRevenuePoint {
  label: string;
  revenue: number;
  prevRevenue: number;
}

export interface AnalyticsCategoryTrendPoint {
  month: string;
  [key: string]: string | number;
}

export interface AnalyticsRecentOrder {
  id: string;
  customer: string;
  amount: number;
  status: string;
  paymentStatus: string;
  date: string;
  vendors: number;
}

export interface AnalyticsOverviewResponse {
  scope: "platform" | "company";
  selected_company: AnalyticsCompanyOption | null;
  available_companies: AnalyticsCompanyOption[];
  summary: AnalyticsSummary;
  revenue_series: AnalyticsRevenuePoint[];
  order_status: { name: string; value: number }[];
  top_products: { name: string; sales: number; company_name: string }[];
  product_sales_trend: AnalyticsCategoryTrendPoint[];
  recent_orders: AnalyticsRecentOrder[];
}

// ── Legacy / Deprecated (keep if needed) ──
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

// ── Service Provider Management ──

export interface IntakeFormField {
  name: string;
  type: "text" | "textarea" | "select" | "number" | "date" | "checkbox";
  label: string;
  label_am?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface ServiceOfferingImage {
  id: number;
  image: string;
  alt_text?: string;
  order?: number;
  is_primary?: boolean;
}

export interface ServiceOffering {
  id: number;
  company?: number;
  company_name?: string;
  company_slug?: string;
  title: string;
  title_am?: string;
  description?: string;
  description_am?: string;
  slug: string;
  pricing_type: "fixed" | "starting_at" | "hourly" | "custom";
  price?: string | null;
  currency: string;
  duration_minutes?: number | null;
  booking_mode: "direct" | "inquiry" | "contact";
  payment_policy: "upfront" | "deposit" | "post_service";
  deposit_percentage?: string;
  service_category?: string;
  tags?: string[];
  intake_form_schema?: IntakeFormField[];
  is_active: boolean;
  is_featured: boolean;
  order?: number;
  average_rating?: string | number;
  total_reviews?: number;
  total_bookings?: number;
  images?: ServiceOfferingImage[];
  primary_image?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PortfolioImage {
  id: number;
  image: string;
  caption?: string;
  is_before: boolean;
  order: number;
}

export interface PortfolioItem {
  id: number;
  title: string;
  title_am?: string;
  description?: string;
  description_am?: string;
  service_offering?: number | null;
  is_active: boolean;
  order?: number;
  images: PortfolioImage[];
  created_at: string;
}

export interface AvailabilitySlot {
  id: number;
  day_of_week: number;
  day_name?: string;
  start_time: string;
  end_time: string;
  max_bookings: number;
  is_active: boolean;
}

export interface ServiceStaff {
  id: number;
  company: number;
  name: string;
  name_am?: string;
  avatar?: string | null;
  role_title?: string;
  assigned_service_ids?: number[];
  is_online?: boolean;
  is_active: boolean;
  working_days?: number[];
  start_time?: string;
  end_time?: string;
  average_rating?: number | string;
  review_count?: number;
  order?: number;
}

export interface ServiceAddon {
  id: number;
  service_offering: number;
  name: string;
  name_am?: string;
  price: string;
  duration_minutes: number;
  is_active: boolean;
}

export interface ServiceBooking {
  id: number;
  customer: number;
  customer_name?: string;
  customer_phone?: string;
  company?: CompanyListItem;
  offering?: ServiceOffering;
  assigned_staff?: ServiceStaff | null;
  selected_addons?: ServiceAddon[];
  location_type?: "provider_location" | "customer_location";
  service_address_text?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration?: number;
  quoted_price: string;
  final_price?: string | null;
  currency: string;
  payable_amount?: string;
  payment_status?: string;
  payment_method?: string;
  checkout_url?: string | null;
  intake_data: Record<string, unknown>;
  customer_notes?: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  company_notes?: string;
  master_order?: number | null;
  created_at: string;
  updated_at: string;
}

// ── Bank Management ──

export interface BankInfo {
  id: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  logo?: string | null;
  company?: number | null;
  company_name?: string;
  company_slug?: string;
  order?: number;
  is_active?: boolean;
  branch_name?: string;
  swift_code?: string;
  currency?: string;
  account_type?: "operating" | "savings" | "escrow";
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BankAccount extends BankInfo {
  company_id?: number;
  is_verified?: boolean;
  verified_at?: string | null;
  created_by?: string;
  created_by_name?: string;
}