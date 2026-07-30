// src/components/admin/CreateUserModal.tsx
import React, { useState, useMemo } from "react";
import {
  X,
  Mail,
  Lock,
  Phone,
  UserCircle,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AtSign,
  AlertCircle,
  Info,
  UserPlus,
} from "lucide-react";
import { registerUser } from "../../../services/api";
import { useToast } from "../../../hooks/useToast";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  email: string;
  username: string;
  password: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  confirm_password: string;
}

interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  confirm_password?: string;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    username: "",
    password: "",
    phone_number: "",
    first_name: "",
    last_name: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(\+251|0)?9\d{8}$/;
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

  // FIXED: Move useMemo BEFORE the early return
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (formData.password.length >= 8) score++;
    if (/[A-Z]/.test(formData.password)) score++;
    if (/[0-9]/.test(formData.password)) score++;
    if (/[^A-Za-z0-9]/.test(formData.password)) score++;
    return score;
  }, [formData.password]);

  // FIXED: Move early return AFTER all hooks
  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = "Minimum 2 characters required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = "Minimum 2 characters required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!usernameRegex.test(formData.username)) {
      newErrors.username = "3-20 characters. Letters, numbers & underscore only";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone_number)) {
      newErrors.phone_number = "Use Ethiopian format: 09XXXXXXXX or +2519XXXXXXXX";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Minimum 8 characters required";
    } else if (
      !/[A-Z]/.test(formData.password) ||
      !/[0-9]/.test(formData.password) ||
      !/[^A-Za-z0-9]/.test(formData.password)
    ) {
      newErrors.password = "Include uppercase, number and special character";
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = "Please confirm your password";
    } else if (formData.confirm_password !== formData.password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allTouched: Record<string, boolean> = {
      first_name: true,
      last_name: true,
      email: true,
      username: true,
      phone_number: true,
      password: true,
      confirm_password: true,
    };
    setTouched(allTouched);

    if (!validateForm()) return;

    setLoading(true);
    try {
      await registerUser({
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password,
        phone_number: formData.phone_number.replace(/\D/g, "") || undefined,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
      });

      setSuccess(true);
      showToast("success", "User created successfully!");

      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.email?.[0] ||
        error?.response?.data?.username?.[0] ||
        error?.response?.data?.password?.[0] ||
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to create user";

      showToast("error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      email: "",
      username: "",
      password: "",
      phone_number: "",
      first_name: "",
      last_name: "",
      confirm_password: "",
    });
    setErrors({});
    setTouched({});
    setSuccess(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateForm();
  };

  const passwordStrengthText = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    return "Strong";
  };

  const inputClass = (field: keyof FormErrors) => `
    w-full pl-8 sm:pl-10 pr-4 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base rounded-2xl border bg-white
    outline-none transition-all duration-200
    ${
      touched[field] && errors[field]
        ? "border-red-300 focus:ring-4 focus:ring-red-100 focus:border-red-500"
        : "border-gray-200 focus:ring-4 focus:ring-purple-100 focus:border-purple-500"
    }
  `;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-8"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[95%] sm:max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] sm:max-h-[85vh] flex flex-col"
      >
        {/* HEADER */}
        <div className="sticky top-0 z-30 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-purple-50 to-indigo-50 backdrop-blur-sm">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-secondary">
              Create New User
            </h2>
            <p className="text-xs sm:text-sm text-secondary-light mt-1">
              Add a new user to the platform
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 rounded-full hover:bg-white/80 transition flex-shrink-0"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-8 flex flex-col items-center justify-center flex-1">
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              User Created!
            </h3>
            <p className="text-gray-500 text-center">
              The user has been created successfully.
            </p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* FIRST NAME */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Abebe"
                    value={formData.first_name}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                    onBlur={() => handleBlur("first_name")}
                    className={inputClass("first_name")}
                  />
                </div>
                {touched.first_name && errors.first_name && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.first_name}
                  </p>
                )}
              </div>

              {/* LAST NAME */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Bikila"
                    value={formData.last_name}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                    onBlur={() => handleBlur("last_name")}
                    className={inputClass("last_name")}
                  />
                </div>
                {touched.last_name && errors.last_name && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.last_name}
                  </p>
                )}
              </div>

              {/* USERNAME */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="abebe123"
                    value={formData.username}
                    onChange={(e) =>
                      handleChange("username", e.target.value.replace(/\s/g, ""))
                    }
                    onBlur={() => handleBlur("username")}
                    className={inputClass("username")}
                  />
                </div>
                {touched.username && errors.username && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.username}
                  </p>
                )}
              </div>

              {/* EMAIL */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="abebe@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    className={inputClass("email")}
                  />
                </div>
                {touched.email && errors.email && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email}
                  </p>
                )}
              </div>

              {/* PHONE */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block">
                  Phone Number <span className="text-red-500">*</span>
                  <span className="text-[10px] text-gray-400 ml-1">
                    (Ethiopian numbers only)
                  </span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="09XXXXXXXX or +2519XXXXXXXX"
                    value={formData.phone_number}
                    onChange={(e) => handleChange("phone_number", e.target.value)}
                    onBlur={() => handleBlur("phone_number")}
                    className={inputClass("phone_number")}
                  />
                  <div
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-help"
                    title="Only Ethiopian mobile numbers are accepted"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </div>
                </div>
                {touched.phone_number && errors.phone_number && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.phone_number}
                  </p>
                )}
                {!errors.phone_number && (
                  <p className="mt-1 text-[10px] text-gray-400">
                    Example: +251911000000 or 0911000000
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Strong password..."
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    className={inputClass("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-500">
                        Password strength
                      </span>
                      <span
                        className={`text-[10px] font-medium ${
                          passwordStrength <= 1
                            ? "text-red-500"
                            : passwordStrength <= 3
                              ? "text-yellow-500"
                              : "text-green-600"
                        }`}
                      >
                        {passwordStrengthText()}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded-full transition ${
                            passwordStrength >= level
                              ? passwordStrength <= 1
                                ? "bg-red-500"
                                : passwordStrength <= 3
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {touched.password && errors.password && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.password}
                  </p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password..."
                    value={formData.confirm_password}
                    onChange={(e) =>
                      handleChange("confirm_password", e.target.value)
                    }
                    onBlur={() => handleBlur("confirm_password")}
                    className={inputClass("confirm_password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </button>
                </div>
                {touched.confirm_password && errors.confirm_password && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />{" "}
                    {errors.confirm_password}
                  </p>
                )}
              </div>
            </div>
          </form>
        )}

        {/* FOOTER */}
        {!success && (
          <div className="sticky bottom-0 z-20 mt-auto px-4 sm:px-6 py-4 sm:py-5 border-t border-gray-100 bg-gray-50/95 backdrop-blur-sm flex flex-row justify-end gap-2 sm:gap-3 rounded-b-2xl sm:rounded-b-3xl">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 sm:px-5 py-2 sm:py-3 rounded-xl border border-gray-200 hover:bg-white transition font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 sm:px-5 py-2 sm:py-3 rounded-xl bg-secondary text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Create User
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateUserModal;