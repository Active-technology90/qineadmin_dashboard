// src/pages/RegisterCompany.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import { useNotifications } from "../context/NotificationsContext";
// import { useAuth } from "../hooks/useAuth";
import { getCategories } from "../services/api";
import { useSubCategories } from "../hooks/useSubCategories";
import { mockRegisterCompany, mockCategories, mockSubCategories } from "../data/mockCompanyRegistration";
import type { Category, SubCategory } from "../types";
import { DragDropImageUpload } from "../components/ui/DragDropImageUpload";  
import LocationPickerModal from "../components/dashboard/CompanyManagement/LocationPickerModal";  
import { MapPin, Building2, Camera, ChevronLeft, ChevronRight, Check } from "lucide-react";  

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
  phone: string;  
  email: string;  
}

export default function RegisterCompany() {
  // const { user } = useAuth();   
  const navigate = useNavigate();
  // const { refetch } = useNotifications(); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<{ companyName: string; slug: string; address: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);  
  const [coverPreview, setCoverPreview] = useState<string | null>(null);  
  const [showMapPicker, setShowMapPicker] = useState(false);  
  const [currentStep, setCurrentStep] = useState(0);  
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
    phone: "",  
    email: "",  
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

const validateStep = (step: number): boolean => {  
  // Step 2 (Media) and Step 3 (Summary) - no validation needed
  if (step === 2 || step === 3) {
    console.log("✅ Step", step, "- no validation needed");
    return true;
  }
  
  const errors: Record<string, string> = {};
  
  // DEBUG: Log the current form data
  console.log("🔍 validateStep called with step:", step);
  console.log("📝 formData:", formData);
  console.log("📝 formData.address:", formData.address);
  console.log("📝 formData.phone:", formData.phone);
  console.log("📝 formData.email:", formData.email);
  console.log("📝 formData.name:", formData.name);
  console.log("📝 formData.slug:", formData.slug);
  
  // Safety check - ensure all form fields exist
  const safeFormData = {
    name: formData.name || "",
    name_am: formData.name_am || "",
    slug: formData.slug || "",
    address: formData.address || "",
    phone: formData.phone || "",
    email: formData.email || "",
    business_type: formData.business_type || "",
  };
  
  console.log("✅ safeFormData:", safeFormData);
  
  if (step === 0) {  
    if (!safeFormData.name.trim()) errors.name = "Company name is required";
    if (formData.category === 0) errors.category = "Please select a category";
    if (formData.sub_category === 0) errors.sub_category = "Please select a subcategory";
    if (!safeFormData.business_type) errors.business_type = "Please select a business type";
    if (!safeFormData.slug.trim()) errors.slug = "Slug is required";
    if (!/^[a-z0-9-]+$/.test(safeFormData.slug))
      errors.slug = "Slug must contain only lowercase letters, numbers, and hyphens";
  }  
  
  if (step === 1) {  
    if (!safeFormData.address.trim()) errors.address = "Address is required";
    if (!safeFormData.phone.trim()) errors.phone = "Phone number is required";
    if (!safeFormData.email.trim()) errors.email = "Email is required";
    if (safeFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeFormData.email))
      errors.email = "Please enter a valid email address";
  }  

  console.log("❌ errors:", errors);
  setFormErrors(errors);
  return Object.keys(errors).length === 0;
};

const handleNext = (e?: React.MouseEvent) => {  
  if (e) e.preventDefault();  // ADDED - Prevent any form submission
  console.log("➡️ handleNext called, currentStep:", currentStep);
  const isValid = validateStep(currentStep);
  console.log("✅ isValid:", isValid);
  if (isValid) {
    console.log("✅ Moving to step:", currentStep + 1);
    setCurrentStep(currentStep + 1);
  } else {
    console.log("❌ Validation failed, staying on step:", currentStep);
  }
};

const handleBack = () => {  
  setCurrentStep(currentStep - 1);
};

const handleGoToStep = (step: number) => {
  setCurrentStep(step);
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // Only submit if we're on the last step (Step 3 - Summary)
  if (currentStep !== 3) {
    console.log("⛔ handleSubmit called but currentStep is not 3, returning");
    return;
  }
  console.log("🚀 handleSubmit called, submitting form...");
  if (!validateStep(currentStep)) {
    console.log("⛔ Validation failed for step 3");
    return;
  }
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
  phone: formData.phone || "",  
  email: formData.email || "",  
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

  // Refresh notifications 
  // refetch(); 

  // Show summary using response.data
  setSuccess({
    companyName: response.data.name,
    slug: response.data.slug,
    address: formData.address || "Not provided"
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

const steps = [
  { id: 'basic', label: 'Basic Info', icon: '📋' },
  { id: 'location', label: 'Location & Contact', icon: '📍' },
  { id: 'media', label: 'Media', icon: '🖼️' },
  { id: 'summary', label: 'Review', icon: '✅' },
];

  // Fix: Check if sub.category exists and matches
  const filteredSubcategories = subcategories.filter((sub) => {
    // Handle different data structures
    if (typeof sub.category === 'object' && sub.category !== null) {
      return sub.category.id === formData.category;
    }
    return sub.category === formData.category;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/80 flex items-center justify-center p-4">  
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden border border-gray-100">  
        {/* Header */}  
        <div className="bg-gradient-to-r from-secondary to-secondary-dark px-6 py-5 md:py-6">  
          <div className="flex items-center gap-3">  
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">  
              <Building2 className="h-5 w-5 text-white" />  
            </div> 
            <div>  
              <h1 className="text-xl md:text-2xl font-bold text-white">Register Your Company</h1>  
              <p className="text-white/70 text-sm">Fill in the details below to create your company</p>  
            </div>  
          </div>  
        </div>  

        {/* Step Progress */}  
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">  
          <div className="flex items-center justify-between max-w-md mx-auto">  
            {steps.map((step, index) => (  
              <div key={step.id} className="flex items-center">  
<div className="flex flex-col items-center">
  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${  
    currentStep === index  
      ? index === 3 
        ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20 scale-110' 
        : 'bg-secondary text-white ring-4 ring-secondary/20 scale-110'  
      : currentStep > index  
      ? 'bg-emerald-500 text-white'  
      : 'bg-gray-200 text-gray-500'  
  }`}>  
    {currentStep > index ? <Check className="w-4 h-4" /> : index + 1}  
  </div>  
  <span className={`text-[10px] mt-1 font-medium ${  
    currentStep === index 
      ? index === 3 
        ? 'text-emerald-600' 
        : 'text-secondary' 
      : 'text-gray-400'  
  }`}>  
    {step.label}  
  </span>  
</div> 
                {index < steps.length - 1 && (  
                  <div className={`w-12 h-0.5 mx-2 ${  
                    currentStep > index ? 'bg-emerald-500' : 'bg-gray-200'  
                  }`} />
                )}  
              </div>  
            ))}  
          </div>  
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

            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-4 justify-center flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">🏢</span>
                  <span className="text-sm font-bold text-gray-900">{success.companyName}</span>
                </div>
                <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">📍</span>
                  <span className="text-sm text-gray-600 truncate max-w-[200px]">{success.address}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">Company registered successfully</p>
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
                  setCurrentStep(0);  
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
                    phone: "",  
                    email: "",  
                  });
                  setLogoPreview(null);  
                  setCoverPreview(null);  
                }}
                className="flex-1 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Register Another
              </button>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Step 0: Basic Info */}
            {currentStep === 0 && (
              <div className="space-y-4">
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
                      className={`w-full border rounded-xl p-3 text-sm ${
                        formErrors.name ? "border-red-500" : "border-gray-300"
                      } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
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
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., my-company-slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className={`w-full border rounded-xl p-3 text-sm font-mono ${
                        formErrors.slug ? "border-red-500" : "border-gray-300"
                      } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
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
                      className={`w-full border rounded-xl p-3 text-sm ${
                        formErrors.business_type ? "border-red-500" : "border-gray-300"
                      } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition bg-white`}
                    >
                      <option value="">Select Business Type</option>
                      <option value="brand">Company</option>
                      <option value="store">Store</option>
                      <option value="service">Service</option>
                    </select>
                    {formErrors.business_type && <p className="text-red-500 text-xs mt-1">{formErrors.business_type}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className={`w-full border rounded-xl p-3 text-sm ${
                        formErrors.category ? "border-red-500" : "border-gray-300"
                      } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition bg-white`}
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
                      className={`w-full border rounded-xl p-3 text-sm ${
                        !formData.category ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                      } ${formErrors.sub_category ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
                    >
                      <option value={0}>Select Subcategory</option>
                      {filteredSubcategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                    {formErrors.sub_category && <p className="text-red-500 text-xs mt-1">{formErrors.sub_category}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="Enter company description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 1: Location & Contact */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Street, city, area..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full border rounded-xl p-3 text-sm ${
                      formErrors.address ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
                  />
                  {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+251 911 234 567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full border rounded-xl p-3 text-sm ${
                        formErrors.phone ? "border-red-500" : "border-gray-300"
                      } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
                    />
                    {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="info@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full border rounded-xl p-3 text-sm ${
                        formErrors.email ? "border-red-500" : "border-gray-300"
                      } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
                    />
                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📍 Company Location (GPS)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        placeholder="Latitude"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl p-3 text-sm pr-12 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">LAT</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        placeholder="Longitude"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl p-3 text-sm pr-12 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">LON</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="mt-2 w-full py-3 border-2 border-dashed border-secondary/40 hover:border-secondary hover:bg-purple-50/30 text-secondary rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    Choose Location on Map Picker
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Media */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Logo
                    </label>
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center transition-all hover:border-secondary hover:bg-gray-50/80 min-h-[180px]">
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              alert("File must be smaller than 5MB");
                              return;
                            }
                            setFormData((prev) => ({ ...prev, logo: file }));
                            const previewUrl = URL.createObjectURL(file);
                            setLogoPreview(previewUrl);
                          }
                        }}
                      />
                      {logoPreview ? (
                        <div className="relative w-full flex flex-col items-center">
                          <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-lg ring-2 ring-secondary/20">
                            <img
                              src={logoPreview}
                              alt="Logo Preview"
                              className="w-full h-full object-cover"
                              onLoad={() => URL.revokeObjectURL(logoPreview)}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, logo: null }));
                              setLogoPreview(null);
                              const fileInput = document.getElementById("logo-upload") as HTMLInputElement;
                              if (fileInput) fileInput.value = "";
                            }}
                            className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="logo-upload" className="flex flex-col items-center justify-center cursor-pointer w-full py-4 group">
                          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-2 group-hover:bg-secondary/20 transition">
                            <Camera className="w-6 h-6 text-secondary group-hover:scale-110 transition" />
                          </div>
                          <span className="text-sm font-semibold text-gray-600">Upload Logo</span>
                          <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
                          <span className="text-xs text-gray-400 mt-1">Square image recommended (1:1)</span>
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Image
                    </label>
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center transition-all hover:border-secondary hover:bg-gray-50/80 min-h-[180px]">
                      <input
                        type="file"
                        id="cover-upload"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              alert("File must be smaller than 10MB");
                              return;
                            }
                            setFormData((prev) => ({ ...prev, cover_image: file }));
                            const previewUrl = URL.createObjectURL(file);
                            setCoverPreview(previewUrl);
                          }
                        }}
                      />
                      {coverPreview ? (
                        <div className="relative w-full flex flex-col items-center">
                          <div className="w-full max-h-32 overflow-hidden rounded-xl shadow-lg">
                            <img
                              src={coverPreview}
                              alt="Cover Preview"
                              className="w-full object-cover"
                              onLoad={() => URL.revokeObjectURL(coverPreview)}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, cover_image: null }));
                              setCoverPreview(null);
                              const fileInput = document.getElementById("cover-upload") as HTMLInputElement;
                              if (fileInput) fileInput.value = "";
                            }}
                            className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="cover-upload" className="flex flex-col items-center justify-center cursor-pointer w-full py-4 group">
                          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-2 group-hover:bg-secondary/20 transition">
                            <Camera className="w-6 h-6 text-secondary group-hover:scale-110 transition" />
                          </div>
                          <span className="text-sm font-semibold text-gray-600">Upload Cover Image</span>
                          <span className="text-xs text-gray-400">PNG, JPG up to 10MB</span>
                          <span className="text-xs text-gray-400 mt-1">Wide banner recommended (16:9)</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Summary */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-300" />
                  <h2 className="text-lg font-bold text-gray-800">Review Your Company Details</h2>
                </div>

                {/* Basic Info Section */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <span className="text-lg">📋</span> Basic Information
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleGoToStep(0)}
                      className="text-xs font-semibold text-secondary hover:text-secondary-dark transition flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Company Name</p>
                      <p className="text-sm font-semibold text-gray-800">{formData.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Name (Amharic)</p>
                      <p className="text-sm font-semibold text-gray-800">{formData.name_am || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Slug</p>
                      <p className="text-sm font-mono text-gray-700">{formData.slug || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Business Type</p>
                      <p className="text-sm font-semibold text-gray-800 capitalize">{formData.business_type || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Category</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {categories.find(c => c.id === formData.category)?.name || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Subcategory</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {subcategories.find(s => s.id === formData.sub_category)?.name || '—'}
                      </p>
                    </div>
                  </div>
                  {formData.description && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Description</p>
                      <p className="text-sm text-gray-600">{formData.description}</p>
                    </div>
                  )}
                </div>

                {/* Location & Contact Section */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <span className="text-lg">📍</span> Location & Contact
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleGoToStep(1)}
                      className="text-xs font-semibold text-secondary hover:text-secondary-dark transition flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Address</p>
                      <p className="text-sm font-semibold text-gray-800">{formData.address || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Phone</p>
                      <p className="text-sm font-semibold text-gray-800">{formData.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Email</p>
                      <p className="text-sm font-semibold text-gray-800">{formData.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Latitude</p>
                      <p className="text-sm font-mono text-gray-700">{formData.latitude || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Longitude</p>
                      <p className="text-sm font-mono text-gray-700">{formData.longitude || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Media Section */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <span className="text-lg">🖼️</span> Media
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleGoToStep(2)}
                      className="text-xs font-semibold text-secondary hover:text-secondary-dark transition flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Logo</p>
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-lg object-cover mx-auto shadow-sm" />
                      ) : (
                        <p className="text-xs text-gray-400">No logo uploaded</p>
                      )}
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Cover Image</p>
                      {coverPreview ? (
                        <div className="w-full h-16 rounded-lg overflow-hidden shadow-sm">
                          <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No cover uploaded</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-xl p-4 border border-secondary/10">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-secondary">3</p>
                      <p className="text-[10px] text-gray-500">Steps Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-secondary">{formData.name ? '✅' : '❌'}</p>
                      <p className="text-[10px] text-gray-500">Company Name</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-secondary">{formData.slug ? '✅' : '❌'}</p>
                      <p className="text-[10px] text-gray-500">Slug</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleBack}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                  currentStep === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-secondary text-white rounded-xl text-sm font-bold hover:bg-secondary-dark transition flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 transition shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Register Company
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}

        {/* Location Picker Modal */}
        {showMapPicker && (
          <LocationPickerModal
            isOpen={showMapPicker}
            onClose={() => setShowMapPicker(false)}
            onSelect={(selectedLat, selectedLon) => {
              setFormData((prev) => ({
                ...prev,
                latitude: selectedLat,
                longitude: selectedLon,
              }));
            }}
            onSelectAddress={(address) => {
              setFormData((prev) => ({
                ...prev,
                address: address,
              }));
            }}
            initialLat={formData.latitude}
            initialLon={formData.longitude}
            initialAddress={formData.address}
          />
        )}
      </div>
    </div>
  );
}