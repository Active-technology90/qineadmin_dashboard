// src/mock/serviceApi.ts
export type { Service, Category } from "../types";

/* ========== TYPES ========== */
export interface ServiceField {
  name: string;
  type: string;
  label: string;
  options?: string[];
  required?: boolean;
}

export interface ReportSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  topCategory: string;
  monthlyTrend: { month: string; revenue: number; orders: number }[];
  categoryBreakdown: { name: string; count: number; revenue: number }[];
  topServices: { id: number; title: string; orders: number; revenue: number }[];
  complianceSummary: { verified: number; pending: number; flagged: number };
  providerSummary: { pending: number; approved: number; rejected: number };
}

export interface ProviderApprovalUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  businessName: string;
  businessAddress?: string;
  documents?: string[];
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  submittedAt: string;
}

export interface ComplianceRecord {
  id: number;
  customerName: string;
  email: string;
  documentType: string;
  documentNumber?: string;
  expiryDate?: string;
  notes?: string;
  status: "verified" | "pending" | "flagged";
  lastCheck: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent_id?: number | null;
  service_count?: number;
  is_active?: boolean;
}

/* ========== SERVICE GROUP ========== */
export interface ServiceGroup {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;          // URL
  image: string;         // cover image
  category: string;
  is_active: boolean;
  display_order: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  // denormalised stats
  total_services: number;
  total_providers: number;
  total_bookings: number;
  total_revenue: number;
}

/* ========== SERVICE PROVIDER ========== */
export interface ServiceProvider {
  id: number;
  name: string;
  businessName: string;
}

/* ========== API RESPONSE ENVELOPE ========== */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/* ========== PAGINATION & FILTER PARAMS ========== */
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export interface BookingFilterParams extends PaginationParams {
  status?: string;
  paymentStatus?: string;
  categoryId?: number;
  providerId?: number;
  dateFrom?: string;
  dateTo?: string;
}

/* ========== EXTENDED BOOKING MODEL ========== */
export interface Booking {
  id: number;
  bookingNumber: string;
  invoiceNumber: string;
  transactionId: string;
  paymentReference: string;
  bookingSource: "web" | "mobile" | "admin" | "api";
  serviceCategory: string;
  serviceGroup: string;
  provider: string;
  providerId: number;
  customer: string;
  customerId: number;
  customerAvatar: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerCity: string;
  customerLatitude?: number;
  customerLongitude?: number;
  bookingStatus: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  paymentStatus: "pending" | "paid" | "refunded" | "partial_refund" | "failed";
  paymentMethod: string;
  currency: string;
  subtotal: number;
  discount: number;
  coupon: string | null;
  tax: number;
  platformFee: number;
  providerEarning: number;
  total: number;
  duration: number;
  startTime: string;
  endTime: string;
  scheduledDate: string;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdBy: string;
  updatedBy: string;
  customerNotes: string | null;
  providerNotes: string | null;
  adminNotes: string | null;
  attachments: string[];
  rating: number | null;
  review: string | null;
  reviewDate: string | null;
  timeline: { status: string; timestamp: string; note?: string }[];
  history: { action: string; timestamp: string; user: string }[];
}
// ===== Provider Stats =====
export interface ProviderStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageRating: number;
  customerRetentionRate: number; // %
  servicePerformance: {
    serviceId: number;
    serviceName: string;
    bookings: number;
    revenue: number;
  }[];
  monthlyTrend: { month: string; bookings: number; revenue: number }[];
}
// src/mock/serviceApi.ts (add these after the existing code)

/* ----- Dashboard statistics helpers ----- */

export function getAdminStats() {
  const totalProviders = MOCK_PROVIDERS.length + MOCK_PROVIDER_APPROVALS.length;
  const totalBookings = MOCK_BOOKINGS.length;
  const totalRevenue = MOCK_BOOKINGS.reduce((sum, b) => sum + b.total, 0);

  // Category performance
  const categoryMap = new Map<string, { revenue: number; bookings: number }>();
  MOCK_BOOKINGS.forEach(b => {
    const cat = b.serviceCategory;
    if (!categoryMap.has(cat)) categoryMap.set(cat, { revenue: 0, bookings: 0 });
    const entry = categoryMap.get(cat)!;
    entry.revenue += b.total;
    entry.bookings += 1;
  });
  const categoryPerformance = Array.from(categoryMap.entries()).map(([name, stats]) => ({
    name,
    revenue: stats.revenue,
    bookings: stats.bookings,
  }));

  // Customer satisfaction (average rating from bookings that have ratings)
  const rated = MOCK_BOOKINGS.filter(b => b.rating !== null);
  const avgRating = rated.length
    ? rated.reduce((sum, b) => sum + (b.rating || 0), 0) / rated.length
    : 0;

  return {
    totalProviders,
    totalBookings,
    totalRevenue,
    categoryPerformance,
    avgRating,
  };
}

export function getProviderStats(providerId: number) {
  const providerBookings = MOCK_BOOKINGS.filter(b => b.providerId === providerId);
  const totalBookings = providerBookings.length;
  const totalRevenue = providerBookings.reduce((sum, b) => sum + b.total, 0);
  const rated = providerBookings.filter(b => b.rating !== null);
  const avgRating = rated.length
    ? rated.reduce((sum, b) => sum + (b.rating || 0), 0) / rated.length
    : 0;

  // Customer retention: count distinct customers with more than one booking
  const customerCounts = new Map<number, number>();
  providerBookings.forEach(b => {
    customerCounts.set(b.customerId, (customerCounts.get(b.customerId) || 0) + 1);
  });
  const repeatCustomers = Array.from(customerCounts.values()).filter(c => c > 1).length;
  const retentionRate = customerCounts.size > 0 ? (repeatCustomers / customerCounts.size) * 100 : 0;

  // Service performance: group by service name (or title) – we'll use serviceCategory as a proxy
  const serviceMap = new Map<string, { bookings: number; revenue: number }>();
  providerBookings.forEach(b => {
    const key = b.serviceCategory;
    if (!serviceMap.has(key)) serviceMap.set(key, { bookings: 0, revenue: 0 });
    const entry = serviceMap.get(key)!;
    entry.bookings += 1;
    entry.revenue += b.total;
  });
  const servicePerformance = Array.from(serviceMap.entries()).map(([name, stats]) => ({
    name,
    bookings: stats.bookings,
    revenue: stats.revenue,
  }));

  return {
    totalBookings,
    totalRevenue,
    avgRating,
    retentionRate,
    servicePerformance,
  };
}
export async function fetchProviderStats(providerId: number): Promise<ProviderStats> {
  await delay(500);
  // In a real app, filter by providerId.
  // Return mock data for now.
  return {
    totalBookings: 120,
    completedBookings: 95,
    cancelledBookings: 10,
    totalRevenue: 28750,
    averageRating: 4.6,
    customerRetentionRate: 68,
    servicePerformance: [
      { serviceId: 2, serviceName: "Men's Haircut", bookings: 55, revenue: 13750 },
      { serviceId: 3, serviceName: "Shave", bookings: 30, revenue: 4500 },
      { serviceId: 4, serviceName: "Spa Massage", bookings: 35, revenue: 10500 },
    ],
    monthlyTrend: [
      { month: "May", bookings: 35, revenue: 8500 },
      { month: "June", bookings: 40, revenue: 10000 },
      { month: "July", bookings: 45, revenue: 10250 },
    ],
  };
}

// ===== Admin Stats =====
export interface AdminStats {
  totalProviders: number;
  totalBookings: number;
  totalRevenue: number;
  categoryPerformance: { category: string; bookings: number; revenue: number }[];
  customerSatisfaction: number; // average rating
}

export async function fetchAdminStats(): Promise<AdminStats> {
  await delay(500);
  return {
    totalProviders: 45,
    totalBookings: 314,
    totalRevenue: 75950,
    categoryPerformance: [
      { category: "Barber", bookings: 180, revenue: 39400 },
      { category: "Spa", bookings: 134, revenue: 36550 },
    ],
    customerSatisfaction: 4.3,
  };
}
// ----------- MOCK DATA GENERATION (300+ bookings) -----------
function generateMockBookings(count = 300): Booking[] {
  const statuses: Booking["bookingStatus"][] = [
    "pending", "confirmed", "in_progress", "completed", "cancelled", "no_show",
  ];
  const paymentStatuses: Booking["paymentStatus"][] = [
    "pending", "paid", "refunded", "partial_refund", "failed",
  ];
  const sources: Booking["bookingSource"][] = ["web", "mobile", "admin", "api"];
  const providers = [
    "Bekele’s Barbershop",
    "Meron Spa & Wellness",
    "Abebe’s Auto Garage",
    ...Array.from({ length: 97 }, (_, i) => `Provider ${i + 4}`),
  ];
  const categories = [
    "Barber", "Spa", "Auto", "Beauty", "Cleaning", "Plumbing",
    "Electrical", "Painting", "Moving", "Fitness",
  ];
  const paymentMethods = ["Telebirr", "CBE Birr", "Credit Card", "Cash", "PayPal"];
  const cities = [
    "Addis Ababa", "Dire Dawa", "Mekelle", "Bahir Dar",
    "Hawassa", "Jijiga", "Adama",
  ];

  const bookings: Booking[] = [];
  for (let i = 1; i <= count; i++) {
    const date = new Date(2025, 7, 1 + Math.floor(Math.random() * 30));
    const providerIdx = Math.floor(Math.random() * providers.length);
    const categoryIdx = Math.floor(Math.random() * categories.length);
    const subtotal = Math.round(50 + Math.random() * 2000);
    const discount = Math.round(Math.random() * subtotal * 0.2);
    const tax = Math.round((subtotal - discount) * 0.15);
    const platformFee = Math.round((subtotal - discount + tax) * 0.1);
    const total = subtotal - discount + tax;
    const providerEarning = total - platformFee;

    bookings.push({
      id: i,
      bookingNumber: `BKG-${String(i).padStart(6, "0")}`,
      invoiceNumber: `INV-${String(i).padStart(6, "0")}`,
      transactionId: `TXN-${Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase()}`,
      paymentReference: `PAY-${Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase()}`,
      bookingSource: sources[Math.floor(Math.random() * sources.length)],
      serviceCategory: categories[categoryIdx],
      serviceGroup: categories[categoryIdx], // simplified
      provider: providers[providerIdx],
      providerId: providerIdx + 1,
      customer: `Customer ${i}`,
      customerId: i + 1000,
      customerAvatar: `https://i.pravatar.cc/150?u=${i}`,
      customerPhone: `+251 9${Math.floor(10000000 + Math.random() * 90000000)}`,
      customerEmail: `customer${i}@example.com`,
      customerAddress: `${Math.floor(Math.random() * 100)} Sample St.`,
      customerCity: cities[Math.floor(Math.random() * cities.length)],
      customerLatitude: 9.0 + Math.random() * 0.2,
      customerLongitude: 38.7 + Math.random() * 0.2,
      bookingStatus: statuses[Math.floor(Math.random() * statuses.length)],
      paymentStatus:
        paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
      paymentMethod:
        paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      currency: "ETB",
      subtotal,
      discount,
      coupon: Math.random() > 0.7 ? `PROMO${Math.floor(Math.random() * 100)}` : null,
      tax,
      platformFee,
      providerEarning,
      total,
      duration: [30, 45, 60, 90, 120][Math.floor(Math.random() * 5)],
      startTime: `${8 + Math.floor(Math.random() * 10)}:${
        Math.floor(Math.random() * 2) === 0 ? "00" : "30"
      }`,
      endTime: `${9 + Math.floor(Math.random() * 10)}:${
        Math.floor(Math.random() * 2) === 0 ? "00" : "30"
      }`,
      scheduledDate: date.toISOString().split("T")[0],
      completedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      createdBy: "admin",
      updatedBy: "admin",
      customerNotes: null,
      providerNotes: null,
      adminNotes: null,
      attachments: [],
      rating: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : null,
      review: null,
      reviewDate: null,
      timeline: [{ status: "created", timestamp: new Date().toISOString() }],
      history: [
        { action: "created", timestamp: new Date().toISOString(), user: "system" },
      ],
    });
  }
  return bookings;
}

let MOCK_BOOKINGS = generateMockBookings(300);

/* ========== EXTEND SERVICE ========== */
declare module "../types" {
  interface Service {
    intake_form_schema?: ServiceField[];
    company_ids?: number[];
    latitude?: string;
    longitude?: string;
    address?: string;
    address_am?: string;
    service_fields?: ServiceField[];
    name?: string;
    category?: number;
    item_code?: string;
    icon?: string | null;
    provider_id?: number | null;
    provider_name?: string;
    group_id?: number | null;
    group_name?: string;
  }
}

/* ========== MOCK DATA ========== */
export const MOCK_COMPANIES = [
  { id: 1, name: "AutoFix Ltd" },
  { id: 2, name: "Quick Service Garage" },
  { id: 3, name: "Elite Motors" },
];

// Service Providers
let MOCK_PROVIDERS: ServiceProvider[] = [
  { id: 201, name: "Samuel Bekele", businessName: "Bekele’s Barbershop" },
  { id: 202, name: "Meron Tadesse", businessName: "Meron Spa & Wellness" },
  { id: 203, name: "Abebe Kebede", businessName: "Abebe’s Auto Garage" },
];

// Service Groups
let MOCK_SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: 1,
    name: "Barber Shop",
    slug: "barber-shop",
    description: "Traditional cuts and modern styles",
    icon: "https://picsum.photos/id/64/80/80",
    image: "https://picsum.photos/id/64/400/200",
    category: "Barber",
    is_active: true,
    display_order: 1,
    tags: ["barber", "hair"],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    total_services: 3,
    total_providers: 1,
    total_bookings: 1200,
    total_revenue: 180000,
  },
  {
    id: 2,
    name: "Spa Center",
    slug: "spa-center",
    description: "Relaxation and wellness treatments",
    icon: "https://picsum.photos/id/1015/80/80",
    image: "https://picsum.photos/id/1015/400/200",
    category: "Spa",
    is_active: true,
    display_order: 2,
    tags: ["spa", "wellness"],
    created_at: "2025-01-02T00:00:00Z",
    updated_at: "2025-01-02T00:00:00Z",
    total_services: 2,
    total_providers: 1,
    total_bookings: 800,
    total_revenue: 120000,
  },
  {
    id: 3,
    name: "Auto Garage",
    slug: "auto-garage",
    description: "Car maintenance and repair",
    icon: "https://picsum.photos/id/20/80/80",
    image: "https://picsum.photos/id/20/400/200",
    category: "Auto",
    is_active: true,
    display_order: 3,
    tags: ["auto", "repair"],
    created_at: "2025-01-03T00:00:00Z",
    updated_at: "2025-01-03T00:00:00Z",
    total_services: 2,
    total_providers: 1,
    total_bookings: 600,
    total_revenue: 90000,
  },
  {
    id: 4,
    name: "Beauty Salon",
    slug: "beauty-salon",
    description: "Makeup, hair styling, and more",
    icon: "https://picsum.photos/id/1/80/80",
    image: "https://picsum.photos/id/1/400/200",
    category: "Beauty",
    is_active: false,
    display_order: 4,
    tags: ["beauty", "makeup"],
    created_at: "2025-02-01T00:00:00Z",
    updated_at: "2025-02-01T00:00:00Z",
    total_services: 0,
    total_providers: 0,
    total_bookings: 0,
    total_revenue: 0,
  },
];

// Services (simplified example – you can expand to 150)
let MOCK_SERVICES: Service[] = [
  {
    id: 1,
    title: "Barber Services",
    title_am: "የፀጉር አስተካካይ አገልግሎቶች",
    description: "All barber-related services",
    description_am: "",
    slug: "barber-services",
    pricing_type: "fixed",
    price: "0.00",
    currency: "ETB",
    duration_minutes: 0,
    booking_mode: "direct",
    payment_policy: "upfront",
    deposit_percentage: "0.00",
    service_category: "Barber",
    tags: ["barber", "hair"],
    intake_form_schema: [],
    is_active: true,
    is_featured: true,
    order: 1,
    address: "",
    address_am: "",
    latitude: "",
    longitude: "",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    recent_activity: [],
    orders_count: 0,
    revenue: 0,
    company_ids: [],
    company_count: 0,
    parent_id: null,
    name: "Barber Services",
    category: 0,
    item_code: "SVC-001",
    icon: null,
    provider_id: null,
    provider_name: "",
    group_id: 1,
    group_name: "Barber Shop",
  },
  {
    id: 2,
    title: "Men's Haircut",
    title_am: "የወንዶች ፀጉር መቁረጥ",
    description: "Classic men's haircut with wash",
    description_am: "",
    slug: "mens-haircut",
    pricing_type: "fixed",
    price: "250.00",
    currency: "ETB",
    duration_minutes: 45,
    booking_mode: "direct",
    payment_policy: "upfront",
    deposit_percentage: "0.00",
    service_category: "Barber",
    tags: ["popular", "express"],
    intake_form_schema: [
      { name: "hair_length", type: "select", label: "Hair Length", options: ["Short", "Medium", "Long"], required: true },
      { name: "notes", type: "textarea", label: "Special Requests", required: false },
    ],
    is_active: true,
    is_featured: true,
    order: 2,
    address: "123 Main St, Addis Ababa",
    address_am: "አዲስ አበባ ፣ 123 ዋና መንገድ",
    latitude: "9.0227",
    longitude: "38.7468",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-06-10T14:20:00Z",
    recent_activity: [{ date: "2025-06-10", description: "Price updated" }],
    orders_count: 124,
    revenue: 31000,
    company_ids: [1, 2],
    company_count: 2,
    parent_id: 1,
    name: "Men's Haircut",
    category: 1,
    item_code: "SVC-002",
    icon: "https://picsum.photos/id/1015/80/80",
    provider_id: 201,
    provider_name: "Bekele’s Barbershop",
    group_id: 1,
    group_name: "Barber Shop",
  },
  {
    id: 3,
    title: "Shave",
    title_am: "መላጨት",
    description: "Professional shave with hot towel",
    description_am: "",
    slug: "shave",
    pricing_type: "fixed",
    price: "150.00",
    currency: "ETB",
    duration_minutes: 30,
    booking_mode: "direct",
    payment_policy: "upfront",
    deposit_percentage: "0.00",
    service_category: "Barber",
    tags: ["shave", "hot towel"],
    intake_form_schema: [],
    is_active: true,
    is_featured: false,
    order: 3,
    address: "",
    address_am: "",
    latitude: "",
    longitude: "",
    created_at: "2025-02-01T09:00:00Z",
    updated_at: "2025-07-01T10:00:00Z",
    recent_activity: [],
    orders_count: 56,
    revenue: 8400,
    company_ids: [1],
    company_count: 1,
    parent_id: 1,
    name: "Shave",
    category: 1,
    item_code: "SVC-003",
    icon: null,
    provider_id: 201,
    provider_name: "Bekele’s Barbershop",
    group_id: 1,
    group_name: "Barber Shop",
  },
  {
    id: 4,
    title: "Spa Massage",
    title_am: "ስፓ መታጠብ",
    description: "Relaxing full body massage",
    description_am: "",
    slug: "spa-massage",
    pricing_type: "fixed",
    price: "350.00",
    currency: "ETB",
    duration_minutes: 60,
    booking_mode: "direct",
    payment_policy: "upfront",
    deposit_percentage: "0.00",
    service_category: "Spa",
    tags: ["relax", "wellness"],
    intake_form_schema: [
      { name: "oil_type", type: "select", label: "Oil Type", options: ["Lavender", "Eucalyptus", "Neutral"], required: true },
      { name: "focus_area", type: "text", label: "Focus Area", required: false },
    ],
    is_active: true,
    is_featured: false,
    order: 4,
    address: "456 Bole Rd, Addis Ababa",
    address_am: "ቦሌ መንገድ 456",
    latitude: "9.0050",
    longitude: "38.7636",
    created_at: "2025-02-20T08:00:00Z",
    updated_at: "2025-07-01T12:00:00Z",
    recent_activity: [{ date: "2025-07-01", description: "Price increased to 350 ETB" }],
    orders_count: 89,
    revenue: 31150,
    company_ids: [2],
    company_count: 1,
    parent_id: null,
    name: "Spa Massage",
    category: 2,
    item_code: "SVC-004",
    icon: "https://picsum.photos/id/1025/80/80",
    provider_id: 202,
    provider_name: "Meron Spa & Wellness",
    group_id: 2,
    group_name: "Spa Center",
  },
  {
    id: 5,
    title: "Express Manicure",
    title_am: "ፈጣን የእጅ ጥገና",
    description: "Quick and neat manicure",
    description_am: "",
    slug: "express-manicure",
    pricing_type: "fixed",
    price: "120.00",
    currency: "ETB",
    duration_minutes: 20,
    booking_mode: "direct",
    payment_policy: "upfront",
    deposit_percentage: "0.00",
    service_category: "Spa",
    tags: ["quick", "nails"],
    intake_form_schema: [],
    is_active: false,
    is_featured: false,
    order: 5,
    address: "",
    address_am: "",
    latitude: "",
    longitude: "",
    created_at: "2025-03-10T09:00:00Z",
    updated_at: "2025-07-15T16:00:00Z",
    recent_activity: [{ date: "2025-07-15", description: "Marked inactive" }],
    orders_count: 45,
    revenue: 5400,
    company_ids: [],
    company_count: 0,
    parent_id: null,
    name: "Express Manicure",
    category: 2,
    item_code: "SVC-005",
    icon: null,
    provider_id: 202,
    provider_name: "Meron Spa & Wellness",
    group_id: 2,
    group_name: "Spa Center",
  },
  {
    id: 6,
    title: "Oil Change",
    title_am: "ዘይት መቀየር",
    description: "Engine oil replacement",
    description_am: "",
    slug: "oil-change",
    pricing_type: "fixed",
    price: "800.00",
    currency: "ETB",
    duration_minutes: 30,
    booking_mode: "direct",
    payment_policy: "upfront",
    deposit_percentage: "0.00",
    service_category: "Auto",
    tags: ["maintenance", "engine"],
    intake_form_schema: [],
    is_active: true,
    is_featured: false,
    order: 6,
    address: "789 Industrial Zone",
    address_am: "",
    latitude: "",
    longitude: "",
    created_at: "2025-04-01T08:00:00Z",
    updated_at: "2025-04-01T08:00:00Z",
    recent_activity: [],
    orders_count: 30,
    revenue: 24000,
    company_ids: [3],
    company_count: 1,
    parent_id: null,
    name: "Oil Change",
    category: 3,
    item_code: "SVC-006",
    icon: null,
    provider_id: 203,
    provider_name: "Abebe’s Auto Garage",
    group_id: 3,
    group_name: "Auto Garage",
  },
  {
    id: 7,
    title: "Brake Service",
    title_am: "ብሬክ አገልግሎት",
    description: "Brake pad replacement and rotor check",
    description_am: "",
    slug: "brake-service",
    pricing_type: "fixed",
    price: "1200.00",
    currency: "ETB",
    duration_minutes: 90,
    booking_mode: "request",
    payment_policy: "deposit",
    deposit_percentage: "20.00",
    service_category: "Auto",
    tags: ["safety", "repair"],
    intake_form_schema: [],
    is_active: true,
    is_featured: false,
    order: 7,
    address: "",
    address_am: "",
    latitude: "",
    longitude: "",
    created_at: "2025-05-10T09:00:00Z",
    updated_at: "2025-05-10T09:00:00Z",
    recent_activity: [],
    orders_count: 18,
    revenue: 21600,
    company_ids: [],
    company_count: 0,
    parent_id: null,
    name: "Brake Service",
    category: 3,
    item_code: "SVC-007",
    icon: null,
    provider_id: 203,
    provider_name: "Abebe’s Auto Garage",
    group_id: 3,
    group_name: "Auto Garage",
  },
];

// Categories
let MOCK_CATEGORIES: Category[] = [
  { id: 1, name: "Barber", slug: "barber", description: "Haircuts, shaves, and grooming", icon: "https://picsum.photos/id/64/80/80", parent_id: null, service_count: 3, is_active: true },
  { id: 2, name: "Spa", slug: "spa", description: "Massages, facials, and wellness", icon: "https://picsum.photos/id/1015/80/80", parent_id: null, service_count: 2, is_active: true },
  { id: 3, name: "Auto", slug: "auto", description: "Car maintenance and repair", icon: "https://picsum.photos/id/20/80/80", parent_id: null, service_count: 2, is_active: true },
];

// Provider Approvals
let MOCK_PROVIDER_APPROVALS: ProviderApprovalUser[] = [
  {
    id: 101,
    name: "John Doe",
    email: "john@example.com",
    phone: "+251 911 123456",
    businessName: "John's Cuts",
    businessAddress: "Bole, Addis Ababa",
    documents: ["https://picsum.photos/id/1/200/300", "https://picsum.photos/id/2/200/300"],
    status: "pending",
    submittedAt: "2025-07-15",
  },
  {
    id: 102,
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+251 922 654321",
    businessName: "Jane's Spa",
    businessAddress: "Sarbet, Addis Ababa",
    documents: ["https://picsum.photos/id/3/200/300"],
    status: "pending",
    submittedAt: "2025-07-18",
  },
];

// Pricing Policy
export interface PricingPolicy {
  commissionRate: number;
  minServicePrice: number;
  maxDiscount: number;
  taxRate: number;
}
let MOCK_PRICING_POLICY: PricingPolicy = {
  commissionRate: 12,
  minServicePrice: 50,
  maxDiscount: 20,
  taxRate: 15,
};

// Compliance
let MOCK_COMPLIANCE: ComplianceRecord[] = [
  { id: 201, customerName: "Alex Brown", email: "alex@example.com", documentType: "ID Card", documentNumber: "ID-987654", expiryDate: "2028-05-12", notes: "Clear images.", status: "verified", lastCheck: "2025-07-10" },
  { id: 202, customerName: "Sam White", email: "sam@example.com", documentType: "Passport", documentNumber: "P-456123", expiryDate: "2026-01-20", notes: "Blurry image.", status: "pending", lastCheck: "2025-07-12" },
  { id: 203, customerName: "Pat Green", email: "pat@example.com", documentType: "Driving License", documentNumber: "DL-321789", expiryDate: "2025-11-30", notes: "Suspected mismatch.", status: "flagged", lastCheck: "2025-07-14" },
];

// Promotions
export interface Promotion {
  id: number;
  code: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  applicableServices: number[];
  isActive: boolean;
}
let MOCK_PROMOTIONS: Promotion[] = [
  { id: 301, code: "SUMMER10", discountPercent: 10, startDate: "2025-07-01", endDate: "2025-08-31", applicableServices: [2, 4], isActive: true },
  { id: 302, code: "WELCOME5", discountPercent: 5, startDate: "2025-06-01", endDate: "2025-12-31", applicableServices: [2, 3, 4, 5], isActive: true },
  { id: 303, code: "LOYALTY20", discountPercent: 20, startDate: "2025-01-01", endDate: "2025-05-30", applicableServices: [2], isActive: false },
];

// Reports
let MOCK_REPORT: ReportSummary = {
  totalRevenue: 75950,
  totalOrders: 314,
  avgOrderValue: 241.88,
  topCategory: "Barber",
  monthlyTrend: [
    { month: "May", revenue: 18000, orders: 80 },
    { month: "June", revenue: 22000, orders: 95 },
    { month: "July", revenue: 35950, orders: 139 },
  ],
  categoryBreakdown: [
    { name: "Barber", count: 3, revenue: 39400 },
    { name: "Spa", count: 2, revenue: 36550 },
  ],
  topServices: [
    { id: 2, title: "Men's Haircut", orders: 124, revenue: 31000 },
    { id: 4, title: "Spa Massage", orders: 89, revenue: 31150 },
    { id: 3, title: "Shave", orders: 56, revenue: 8400 },
    { id: 5, title: "Express Manicure", orders: 45, revenue: 5400 },
    { id: 1, title: "Barber Services", orders: 0, revenue: 0 },
  ],
  complianceSummary: { verified: 1, pending: 1, flagged: 1 },
  providerSummary: { pending: 2, approved: 0, rejected: 0 },
};

// Users
export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "manager" | "viewer";
  createdAt: string;
}
let MOCK_USERS: User[] = [
  { id: 1, name: "Alice Admin", email: "alice@example.com", role: "admin", createdAt: "2025-01-01T00:00:00Z" },
  { id: 2, name: "Bob Manager", email: "bob@example.com", role: "manager", createdAt: "2025-02-15T00:00:00Z" },
  { id: 3, name: "Charlie Viewer", email: "charlie@example.com", role: "viewer", createdAt: "2025-03-20T00:00:00Z" },
];

/* ========== HELPERS ========== */
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

/* ========== API FUNCTIONS ========== */

// Service Groups
export async function fetchServiceGroups(): Promise<ServiceGroup[]> {
  await delay();
  return JSON.parse(JSON.stringify(MOCK_SERVICE_GROUPS));
}
export async function createServiceGroup(data: Partial<ServiceGroup>): Promise<ServiceGroup> {
  await delay();
  const newGroup: ServiceGroup = {
    id: Math.max(...MOCK_SERVICE_GROUPS.map(g => g.id), 0) + 1,
    name: data.name || "New Group",
    slug: data.slug || "new-group",
    description: data.description || "",
    icon: data.icon || "",
    image: data.image || "",
    category: data.category || "Uncategorized",
    is_active: data.is_active ?? true,
    display_order: data.display_order ?? 0,
    tags: data.tags || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_services: 0,
    total_providers: 0,
    total_bookings: 0,
    total_revenue: 0,
  };
  MOCK_SERVICE_GROUPS.push(newGroup);
  return newGroup;
}
export async function updateServiceGroup(id: number, data: Partial<ServiceGroup>): Promise<ServiceGroup> {
  await delay();
  const group = MOCK_SERVICE_GROUPS.find(g => g.id === id);
  if (!group) throw new Error("Group not found");
  Object.assign(group, data, { updated_at: new Date().toISOString() });
  return group;
}
export async function deleteServiceGroup(id: number): Promise<void> {
  await delay();
  const index = MOCK_SERVICE_GROUPS.findIndex(g => g.id === id);
  if (index === -1) throw new Error("Group not found");
  MOCK_SERVICE_GROUPS.splice(index, 1);
}

// Services
export async function fetchServices(): Promise<Service[]> {
  await delay();
  return JSON.parse(JSON.stringify(MOCK_SERVICES));
}
export async function createService(formData: any): Promise<Service> {
  await delay();
  const newService: Service = {
    ...formData,
    id: Math.max(...MOCK_SERVICES.map(s => s.id), 0) + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    orders_count: 0,
    revenue: 0,
    recent_activity: [],
    company_count: formData.company_ids?.length || 0,
    address: formData.address || "",
    address_am: formData.address_am || "",
    latitude: formData.latitude || "",
    longitude: formData.longitude || "",
    name: formData.title,
    category: 0,
    icon: formData.icon || null,
    intake_form_schema: formData.intake_form_schema || [],
    parent_id: formData.parent_id ?? null,
    provider_id: formData.provider_id ?? null,
    provider_name: formData.provider_name || "",
    group_id: formData.group_id ?? null,
    group_name: formData.group_name || "",
  };
  MOCK_SERVICES.push(newService);
  return newService;
}
export async function updateService(slug: string, formData: any): Promise<Service> {
  await delay();
  const index = MOCK_SERVICES.findIndex(s => s.slug === slug);
  if (index === -1) throw new Error("Service not found");
  const existing = MOCK_SERVICES[index];
  MOCK_SERVICES[index] = {
    ...existing,
    ...formData,
    updated_at: new Date().toISOString(),
    name: formData.title || existing.title,
    category: formData.category ?? existing.category,
    address: formData.address ?? existing.address,
    address_am: formData.address_am ?? existing.address_am,
    latitude: formData.latitude ?? existing.latitude,
    longitude: formData.longitude ?? existing.longitude,
    intake_form_schema: formData.intake_form_schema ?? existing.intake_form_schema,
    parent_id: formData.parent_id !== undefined ? formData.parent_id : existing.parent_id,
    provider_id: formData.provider_id !== undefined ? formData.provider_id : existing.provider_id,
    provider_name: formData.provider_name !== undefined ? formData.provider_name : existing.provider_name,
    group_id: formData.group_id !== undefined ? formData.group_id : existing.group_id,
    group_name: formData.group_name !== undefined ? formData.group_name : existing.group_name,
  };
  return MOCK_SERVICES[index];
}
export async function deleteService(slug: string): Promise<void> {
  await delay();
  const index = MOCK_SERVICES.findIndex(s => s.slug === slug);
  if (index === -1) throw new Error("Service not found");
  MOCK_SERVICES.splice(index, 1);
}
export async function updateServiceFields(slug: string, fields: ServiceField[]): Promise<Service> {
  await delay();
  const service = MOCK_SERVICES.find(s => s.slug === slug);
  if (!service) throw new Error("Service not found");
  service.intake_form_schema = fields;
  service.service_fields = fields;
  service.updated_at = new Date().toISOString();
  return service;
}
export async function updateServiceCompanies(slug: string, companyIds: number[]): Promise<Service> {
  await delay();
  const service = MOCK_SERVICES.find(s => s.slug === slug);
  if (!service) throw new Error("Service not found");
  service.company_ids = companyIds;
  service.company_count = companyIds.length;
  service.updated_at = new Date().toISOString();
  return service;
}

// Providers
export async function fetchProviders(): Promise<ServiceProvider[]> {
  await delay();
  return JSON.parse(JSON.stringify(MOCK_PROVIDERS));
}

// Provider Approval
export async function fetchProviderApprovals(): Promise<ProviderApprovalUser[]> {
  await delay();
  return JSON.parse(JSON.stringify(MOCK_PROVIDER_APPROVALS));
}
export async function updateProviderStatus(
  id: number,
  status: "approved" | "rejected",
  rejectionReason?: string
): Promise<void> {
  await delay();
  const user = MOCK_PROVIDER_APPROVALS.find(u => u.id === id);
  if (user) {
    user.status = status;
    if (status === "rejected" && rejectionReason) user.rejectionReason = rejectionReason;
  }
}

// Categories
export async function fetchCategoriesMock(): Promise<Category[]> {
  await delay();
  return JSON.parse(JSON.stringify(MOCK_CATEGORIES));
}
export async function createCategory(data: Partial<Category>): Promise<Category> {
  await delay();
  const newCat: Category = {
    id: Math.max(...MOCK_CATEGORIES.map(c => c.id), 0) + 1,
    name: data.name || "New Category",
    slug: data.slug || "new-category",
    description: data.description || "",
    icon: data.icon || "",
    parent_id: data.parent_id || null,
    service_count: 0,
    is_active: data.is_active ?? true,
  };
  MOCK_CATEGORIES.push(newCat);
  return newCat;
}
export async function updateCategory(id: number, data: Partial<Category>): Promise<Category> {
  await delay();
  const cat = MOCK_CATEGORIES.find(c => c.id === id);
  if (!cat) throw new Error("Category not found");
  Object.assign(cat, data);
  return cat;
}
export async function deleteCategory(id: number): Promise<void> {
  await delay();
  MOCK_CATEGORIES = MOCK_CATEGORIES.filter(c => c.id !== id);
}

// Pricing Policy
export async function fetchPricingPolicy(): Promise<PricingPolicy> {
  await delay();
  return JSON.parse(JSON.stringify(MOCK_PRICING_POLICY));
}
export async function updatePricingPolicy(policy: Partial<PricingPolicy>): Promise<PricingPolicy> {
  await delay();
  MOCK_PRICING_POLICY = { ...MOCK_PRICING_POLICY, ...policy };
  return MOCK_PRICING_POLICY;
}

// Compliance
export async function fetchComplianceRecords(): Promise<ComplianceRecord[]> {
  await delay();
  return JSON.parse(JSON.stringify(MOCK_COMPLIANCE));
}
export async function updateComplianceStatus(id: number, status: "verified" | "flagged"): Promise<void> {
  await delay();
  const rec = MOCK_COMPLIANCE.find(r => r.id === id);
  if (rec) rec.status = status;
}

// Promotions
export async function fetchPromotions(): Promise<Promotion[]> {
  await delay();
  return JSON.parse(JSON.stringify(MOCK_PROMOTIONS));
}
export async function createPromotion(data: Omit<Promotion, "id">): Promise<Promotion> {
  await delay();
  const newPromo: Promotion = { ...data, id: Math.max(...MOCK_PROMOTIONS.map(p => p.id), 0) + 1 };
  MOCK_PROMOTIONS.push(newPromo);
  return newPromo;
}
export async function updatePromotion(id: number, data: Partial<Promotion>): Promise<Promotion> {
  await delay();
  const promo = MOCK_PROMOTIONS.find(p => p.id === id);
  if (!promo) throw new Error("Promotion not found");
  Object.assign(promo, data);
  return promo;
}
export async function deletePromotion(id: number): Promise<void> {
  await delay();
  MOCK_PROMOTIONS = MOCK_PROMOTIONS.filter(p => p.id !== id);
}

// Reports
export async function fetchReportSummary(): Promise<ReportSummary> {
  await delay();
  return JSON.parse(JSON.stringify(MOCK_REPORT));
}

// Users
export async function fetchUsers(): Promise<User[]> {
  await delay();
  return JSON.parse(JSON.stringify(MOCK_USERS));
}
export async function createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
  await delay();
  const newUser: User = {
    ...userData,
    id: Math.max(...MOCK_USERS.map(u => u.id), 0) + 1,
    createdAt: new Date().toISOString(),
  };
  MOCK_USERS.push(newUser);
  return newUser;
}
export async function updateUser(id: number, userData: Partial<Omit<User, "id" | "createdAt">>): Promise<User> {
  await delay();
  const index = MOCK_USERS.findIndex(u => u.id === id);
  if (index === -1) throw new Error("User not found");
  MOCK_USERS[index] = { ...MOCK_USERS[index], ...userData };
  return MOCK_USERS[index];
}
export async function deleteUser(id: number): Promise<void> {
  await delay();
  const index = MOCK_USERS.findIndex(u => u.id === id);
  if (index === -1) throw new Error("User not found");
  MOCK_USERS.splice(index, 1);
}

/* ========== BOOKING API (fixed) ========== */
const categoryNameById = Object.fromEntries(
  MOCK_CATEGORIES.map(c => [c.id, c.name])
);

export async function getBookings(
  params: BookingFilterParams = {}
): Promise<ApiResponse<Booking[]>> {
  await delay(600);
  const {
    page = 1,
    limit = 10,
    search,
    status,
    paymentStatus,
    categoryId,
    providerId,
    dateFrom,
    dateTo,
    sortField = "scheduledDate",
    sortOrder = "desc",
  } = params;

  let filtered = [...MOCK_BOOKINGS];

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      b =>
        b.bookingNumber.toLowerCase().includes(s) ||
        b.customer.toLowerCase().includes(s) ||
        b.provider.toLowerCase().includes(s)
    );
  }
  if (status) filtered = filtered.filter(b => b.bookingStatus === status);
  if (paymentStatus)
    filtered = filtered.filter(b => b.paymentStatus === paymentStatus);
  if (categoryId) {
    const catName = categoryNameById[categoryId];
    if (catName) filtered = filtered.filter(b => b.serviceCategory === catName);
  }
  if (providerId) filtered = filtered.filter(b => b.providerId === providerId);
  if (dateFrom) filtered = filtered.filter(b => b.scheduledDate >= dateFrom);
  if (dateTo) filtered = filtered.filter(b => b.scheduledDate <= dateTo);

  // Sort
  filtered.sort((a, b) => {
    const aVal = (a as any)[sortField] ?? "";
    const bVal = (b as any)[sortField] ?? "";
    if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return {
    success: true,
    message: "Bookings fetched successfully",
    statusCode: 200,
    data,
    meta: { page, limit, total, totalPages },
  };
}

export async function getBookingById(id: number): Promise<ApiResponse<Booking>> {
  await delay(300);
  const booking = MOCK_BOOKINGS.find(b => b.id === id);
  if (!booking)
    throw { success: false, message: "Booking not found", statusCode: 404 };
  return {
    success: true,
    message: "Booking fetched",
    statusCode: 200,
    data: booking,
  };
}

export async function updateBookingStatus(
  id: number,
  status: string,
  note?: string
): Promise<ApiResponse<Booking>> {
  await delay(400);
  const booking = MOCK_BOOKINGS.find(b => b.id === id);
  if (!booking)
    throw { success: false, message: "Booking not found", statusCode: 404 };

  booking.bookingStatus = status as any;
  booking.timeline.push({
    status: `status_${status}`,
    timestamp: new Date().toISOString(),
    note,
  });
  booking.history.push({
    action: "status_update",
    timestamp: new Date().toISOString(),
    user: "admin",
  });

  return {
    success: true,
    message: "Status updated",
    statusCode: 200,
    data: booking,
  };
}