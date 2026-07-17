// src/data/mockCompanyRegistration.ts

export interface MockCompanyData {
  id: number;
  name: string;
  name_am: string;
  slug: string;
  category: number;
  category_name: string;
  sub_category: number;
  sub_category_name: string;
  business_type: string;
  address: string;
  description: string;
  latitude: string;
  longitude: string;
  logo: string | null;
  cover_image: string | null;
  is_active: boolean;
  is_featured: boolean;
  minimum_order_total: string;
  delivery_fee_per_km: string;
  created_at: string;
  updated_at: string;
}

export const mockCompanyRegistrationResponse: MockCompanyData = {
  id: 999,
  name: "ABC Electronics",
  name_am: "ኤቢሲ ኤሌክትሮኒክስ",
  slug: "abc-electronics",
  category: 1,
  category_name: "Electronics",
  sub_category: 5,
  sub_category_name: "Consumer Electronics",
  business_type: "brand",
  address: "Bole, Addis Ababa, Ethiopia",
  description: "Leading provider of electronic products and solutions in Ethiopia.",
  latitude: "9.0331",
  longitude: "38.7467",
  logo: "https://backend-qine.activetechet.com/media/companies/logos/abc_electronics_logo.png",
  cover_image: "https://backend-qine.activetechet.com/media/companies/covers/abc_electronics_cover.jpg",
  is_active: true,
  is_featured: true,
  minimum_order_total: "100.00",
  delivery_fee_per_km: "15.00",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ── SUCCESS RESPONSE ──
export interface MockApiResponse {
  success: boolean;
  message: string;
  data: MockCompanyData;
  statusCode: number;
}

export const mockSuccessResponse: MockApiResponse = {
  success: true,
  message: "Company registered successfully",
  data: mockCompanyRegistrationResponse,
  statusCode: 201,
};

// ── ERROR RESPONSE ──
export interface MockErrorResponse {
  success: boolean;
  message: string;
  errors: Record<string, string[]>;
  statusCode: number;
}

export const mockErrorResponse: MockErrorResponse = {
  success: false,
  message: "Validation failed",
  errors: {
    name: ["Company name is required"],
    slug: ["Slug must be unique"],
    category: ["Please select a valid category"],
  },
  statusCode: 400,
};

// ── CATEGORIES MOCK DATA ──
export const mockCategories = [
  { id: 1, name: "Electronics", name_am: "ኤሌክትሮኒክስ" },
  { id: 2, name: "Clothing", name_am: "ልብስ" },
  { id: 3, name: "Food", name_am: "ምግብ" },
  { id: 4, name: "Furniture", name_am: "ቤት እቃ" },
  { id: 5, name: "Books", name_am: "መጽሐፍ" },
];

// ── SUBCATEGORIES MOCK DATA ──
export const mockSubCategories = [
  { id: 1, name: "Smartphones", category: 1 },
  { id: 2, name: "Laptops", category: 1 },
  { id: 3, name: "Accessories", category: 1 },
  { id: 4, name: "Men's Wear", category: 2 },
  { id: 5, name: "Women's Wear", category: 2 },
  { id: 6, name: "Children's Wear", category: 2 },
  { id: 7, name: "Beverages", category: 3 },
  { id: 8, name: "Snacks", category: 3 },
  { id: 9, name: "Dairy", category: 3 },
  { id: 10, name: "Sofas", category: 4 },
  { id: 11, name: "Tables", category: 4 },
  { id: 12, name: "Chairs", category: 4 },
  { id: 13, name: "Educational", category: 5 },
  { id: 14, name: "Fiction", category: 5 },
  { id: 15, name: "Non-fiction", category: 5 },
];

// ── COMPANY REGISTRATION REQUEST MOCK ──
export interface CompanyRegistrationRequest {
  name: string;
  name_am: string;
  slug: string;
  category: number;
  sub_category: number;
  business_type: string;
  address: string;
  description: string;
  latitude: string;
  longitude: string;
  logo: File | null;
  cover_image: File | null;
}

export const mockRegistrationRequest: CompanyRegistrationRequest = {
  name: "ABC Electronics",
  name_am: "ኤቢሲ ኤሌክትሮኒክስ",
  slug: "abc-electronics",
  category: 1,
  sub_category: 5,
  business_type: "brand",
  address: "Bole, Addis Ababa, Ethiopia",
  description: "Leading provider of electronic products and solutions in Ethiopia.",
  latitude: "9.0331",
  longitude: "38.7467",
  logo: null,
  cover_image: null,
};

// ── MOCK API FUNCTION ──
export const mockRegisterCompany = async (data: CompanyRegistrationRequest): Promise<MockApiResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Simulate success
  const success = true;

  if (success) {
    return {
      success: true,
      message: "Company registered successfully",
      data: {
        ...mockCompanyRegistrationResponse,
        name: data.name || mockCompanyRegistrationResponse.name,
        name_am: data.name_am || mockCompanyRegistrationResponse.name_am,
        slug: data.slug || mockCompanyRegistrationResponse.slug,
        category: data.category || mockCompanyRegistrationResponse.category,
        sub_category: data.sub_category || mockCompanyRegistrationResponse.sub_category,
        business_type: data.business_type || mockCompanyRegistrationResponse.business_type,
        address: data.address || mockCompanyRegistrationResponse.address,
        description: data.description || mockCompanyRegistrationResponse.description,
        latitude: data.latitude || mockCompanyRegistrationResponse.latitude,
        longitude: data.longitude || mockCompanyRegistrationResponse.longitude,
        logo: mockCompanyRegistrationResponse.logo,
        cover_image: mockCompanyRegistrationResponse.cover_image,
        is_active: true,
        is_featured: true,
        minimum_order_total: "100.00",
        delivery_fee_per_km: "15.00",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      statusCode: 201,
    };
  }

  return mockErrorResponse;
};