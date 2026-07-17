// src/pages/RegisterCompany.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import { useAuth } from "../hooks/useAuth";
import { getCategories } from "../services/api";
import { useSubCategories } from "../hooks/useSubCategories";
import { mockRegisterCompany, mockCategories, mockSubCategories } from "../data/mockCompanyRegistration";
import type { Category, SubCategory } from "../types";

interface CompanyFormData {
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

export default function RegisterCompany() {
  // const { user } = useAuth();   
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ companyName: string; slug: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    name_am: "",
    slug: "",
    category: 0,
    sub_category: 0,
    business_type: "",
    address: "",
    description: "",
    latitude: "",
    longitude: "",
    logo: null,
    cover_image: null,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

// Load categories
// Load categories – USING MOCK DATA
useEffect(() => {
  // Try to fetch real categories, fallback to mock if fails
  const fetchCategories = async () => {
    try {
      const categoriesRes = await getCategories();
      setCategories(categoriesRes.data);
    } catch (err) {
      console.warn("Failed to load categories from API, using mock data");
      setCategories(mockCategories as Category[]);
    }
  };
  fetchCategories();
}, []);

// Use the subcategories hook with mock fallback
const { subCategories: allSubcategories, loading: subLoading } = useSubCategories();

// Update subcategories when loaded
useEffect(() => {
  if (allSubcategories && allSubcategories.length > 0) {
    setSubcategories(allSubcategories);
    console.log("Subcategories loaded via hook:", allSubcategories.length);
  } else {
    // If hook returns empty, use mock data
    console.warn("No subcategories from API, using mock data");
    setSubcategories(mockSubCategories as SubCategory[]);
  }
}, [allSubcategories]);

  // Temporarily disabled - registration should be public
  // useEffect(() => {
  //   if (!user) {
  //     navigate("/signin");
  //   }
  // }, [user, navigate]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Company name is required";
    if (!formData.slug.trim()) errors.slug = "Slug is required";
    if (!/^[a-z0-9-]+$/.test(formData.slug))
      errors.slug = "Slug must contain only lowercase letters, numbers, and hyphens";
    if (formData.category === 0) errors.category = "Please select a category";
    if (formData.sub_category === 0) errors.sub_category = "Please select a subcategory";
    if (!formData.business_type) errors.business_type = "Please select a business type";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;
  setLoading(true);
  setError(null);

  try {
    // Prepare the request data without FormData (for mock)
    const requestData = {
      name: formData.name,
      name_am: formData.name_am || "",
      slug: formData.slug,
      category: formData.category,
      sub_category: formData.sub_category,
      business_type: formData.business_type,
      address: formData.address || "",
      description: formData.description || "",
      latitude: formData.latitude || "",
      longitude: formData.longitude || "",
      logo: null,
      cover_image: null,
    };

    // 🔥 USE MOCK API INSTEAD OF REAL API
    const response = await mockRegisterCompany(requestData);

if (response.success) {
  // Create the company data object using response.data
const companyData = {
  id: Date.now(),
  name: response.data.name,
  name_am: formData.name_am || "",
  slug: response.data.slug,
  category: formData.category,
  sub_category: formData.sub_category,
  business_type: formData.business_type,
  address: formData.address || "",
  description: formData.description || "",
  registered_at: new Date().toISOString(),
  registered_by: "Marketer 1", 
  marketer_name: "Marketer 1", 
  status: "Active",
  subscription_plan: "Free",
  subscription_status: "Active",
  plan_start_date: new Date().toISOString(),
  plan_end_date: null,
};

  // Get existing companies from localStorage
  const existing = JSON.parse(localStorage.getItem("registeredCompanies") || "[]");
  const updated = [...existing, companyData];
  localStorage.setItem("registeredCompanies", JSON.stringify(updated));

  // Show summary using response.data
  setSuccess({
    companyName: response.data.name,
    slug: response.data.slug
  });
} else {
      setError(response.message || "Failed to register company");
    }
    setLoading(false);
  } catch (err: any) {
    const msg = err.message || "Failed to create company";
    setError(msg);
    setLoading(false);
  }
};

// Fix: Check if sub.category exists and matches
const filteredSubcategories = subcategories.filter((sub) => {
  // Handle different data structures
  if (typeof sub.category === 'object' && sub.category !== null) {
    return sub.category.id === formData.category;
  }
  return sub.category === formData.category;
});

// Debug: Log what's happening
console.log("===== Subcategory Debug =====");
console.log("1. Selected Category ID:", formData.category);
console.log("2. All subcategories count:", subcategories.length);
console.log("3. Filtered subcategories count:", filteredSubcategories.length);
if (subcategories.length > 0) {
  console.log("4. Sample subcategory keys:", Object.keys(subcategories[0]));
  console.log("5. Sample subcategory:", subcategories[0]);
  // Check if any subcategory has category field matching
  const anyMatch = subcategories.some(sub => sub.category === formData.category);
  console.log("6. Any match found?", anyMatch);
}
console.log("============================");
// DEBUG: Log what's happening
console.log("===== Subcategory Debug =====");
console.log("1. Selected Category ID:", formData.category);
console.log("2. All subcategories:", subcategories);
console.log("3. Filtered subcategories:", filteredSubcategories);

// Debug: Inspect the first subcategory to see its structure
if (subcategories.length > 0) {
  console.log("4. First subcategory keys:", Object.keys(subcategories[0]));
  console.log("5. First subcategory:", subcategories[0]);
  console.log("6. Checking if any subcategory has category =", formData.category);
  const anyMatch = subcategories.some(sub => sub.category === formData.category);
  console.log("7. Any match found?", anyMatch);
}
console.log("============================");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 md:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-secondary">Register Your Company</h1>
          <p className="text-gray-500 text-sm mt-1">Fill in the details below to create your company</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Success Summary */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-green-800">Company Registered Successfully!</h2>
                <p className="text-sm text-green-600">Your company has been created. Here are the details:</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm font-medium text-gray-600">Company Name</span>
                <span className="text-sm font-bold text-gray-900">{success.companyName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Company Slug</span>
                <span className="text-sm font-mono text-gray-900">{success.slug}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex-1 py-2.5 bg-secondary text-white rounded-xl text-sm font-bold hover:bg-secondary-dark transition"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  setSuccess(null);
                  setFormData({
                    name: "",
                    name_am: "",
                    slug: "",
                    category: 0,
                    sub_category: 0,
                    business_type: "",
                    address: "",
                    description: "",
                    latitude: "",
                    longitude: "",
                    logo: null,
                    cover_image: null,
                  });
                }}
                className="flex-1 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Register Another
              </button>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter company name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full border rounded-lg p-2.5 text-sm ${
                    formErrors.name ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary outline-none transition`}
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name (Amharic)
                </label>
                <input
                  type="text"
                  placeholder="Enter company name in Amharic"
                  value={formData.name_am}
                  onChange={(e) => setFormData({ ...formData, name_am: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., my-company-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className={`w-full border rounded-lg p-2.5 text-sm font-mono ${
                    formErrors.slug ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary outline-none transition`}
                />
                {formErrors.slug && <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.business_type}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                  className={`w-full border rounded-lg p-2.5 text-sm ${
                    formErrors.business_type ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary outline-none transition`}
                >
                  <option value="">Select Business Type</option>
                  <option value="brand">Company</option>
                  <option value="store">Store</option>
                  <option value="service">Service</option>
                </select>
                {formErrors.business_type && <p className="text-red-500 text-xs mt-1">{formErrors.business_type}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const catId = Number(e.target.value);
                    setFormData({ ...formData, category: catId, sub_category: 0 });
                  }}
                  className={`w-full border rounded-lg p-2.5 text-sm ${
                    formErrors.category ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary outline-none transition`}
                >
                  <option value={0}>Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory <span className="text-red-500">*</span>
                </label>
<select
  value={formData.sub_category}
  onChange={(e) => setFormData({ ...formData, sub_category: Number(e.target.value) })}
  disabled={!formData.category}
  className={`w-full border rounded-lg p-2.5 text-sm ${
    !formData.category ? "bg-gray-100 cursor-not-allowed" : "bg-white"
  } ${formErrors.sub_category ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary outline-none transition`}
>
  <option value={0}>Select Subcategory</option>
  {subcategories.length > 0 ? (
    subcategories.map((sub) => (
      <option key={sub.id} value={sub.id}>{sub.name}</option>
    ))
  ) : (
    <option value={0} disabled>No subcategories available</option>
  )}
</select>
                {formErrors.sub_category && <p className="text-red-500 text-xs mt-1">{formErrors.sub_category}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Street, city, area..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary outline-none transition"
                />
                <p className="text-xs text-gray-400 mt-1">Physical address of the company (optional)</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Enter company description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary outline-none transition resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-secondary hover:bg-secondary-dark text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </>
                ) : (
                  "Register Company"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}