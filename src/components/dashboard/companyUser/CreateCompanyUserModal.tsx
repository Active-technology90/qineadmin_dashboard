

import {
  X,
  Loader2,
  UserPlus,
  Shield,
  Phone,
  Mail,
  Lock,
  User,
  AtSign,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useMemo, useState } from "react";

interface CreateCompanyUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  onSubmit: (data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    username: string;
    password: string;
    role: "admin" | "staff" | "viewer" | "delivery";
  }) => void;
}

type FormErrors = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  username?: string;
  password?: string;
  confirm_password?: string;
};

export function CreateCompanyUserModal({
  isOpen,
  onClose,
  loading,
  onSubmit,
}: CreateCompanyUserModalProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    phone_number: "",
    password: "",
    confirm_password: "",
    role: "staff" as "admin" | "staff" | "viewer" | "delivery",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(\+251|0)?9\d{8}$/;
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

  const validate = () => {
    const newErrors: FormErrors = {};

    // First Name
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = "Minimum 2 characters required";
    }

    // Last Name
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = "Minimum 2 characters required";
    }

    // Username
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!usernameRegex.test(formData.username)) {
      newErrors.username =
        "3-20 characters. Letters, numbers & underscore only";
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    // Phone
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone_number)) {
      newErrors.phone_number =
        "Use valid Ethiopian phone number";
    }

    // Password
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Minimum 8 characters required";
    } else if (
      !/[A-Z]/.test(formData.password) ||
      !/[0-9]/.test(formData.password) ||
      !/[^A-Za-z0-9]/.test(formData.password)
    ) {
      newErrors.password =
        "Include uppercase, number and special character";
    }

    // Confirm Password
    if (!formData.confirm_password) {
      newErrors.confirm_password =
        "Please confirm your password";
    } else if (
      formData.confirm_password !== formData.password
    ) {
      newErrors.confirm_password =
        "Passwords do not match";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    field: keyof typeof formData,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));

    validate();
  };

  const passwordStrength = useMemo(() => {
    let score = 0;

    if (formData.password.length >= 8) score++;
    if (/[A-Z]/.test(formData.password)) score++;
    if (/[0-9]/.test(formData.password)) score++;
    if (/[^A-Za-z0-9]/.test(formData.password)) score++;

    return score;
  }, [formData.password]);

  const passwordStrengthText = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    return "Strong";
  };

  const handleSubmit = () => {
    const isValid = validate();

    if (!isValid) {
      setTouched({
        first_name: true,
        last_name: true,
        email: true,
        username: true,
        phone_number: true,
        password: true,
        confirm_password: true,
      });

      return;
    }

    onSubmit({
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      username: formData.username,
      phone_number: formData.phone_number,
      password: formData.password,
      role: formData.role,
    });
  };

  const inputClass = (field: keyof FormErrors) => `
    w-full pl-10 pr-12 py-3 rounded-2xl border bg-white
    outline-none transition-all duration-200
    ${
      touched[field] && errors[field]
        ? "border-red-300 focus:ring-4 focus:ring-red-100 focus:border-red-500"
        : "border-gray-200 focus:ring-4 focus:ring-[#6750A4]/10 focus:border-[#6750A4]"
    }
  `;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-[#6750A4]/5 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Create User
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Create and onboard a company user instantly
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/80 transition"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* FIRST NAME */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                First Name <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                <input
                  type="text"
                  placeholder="Abebe"
                  value={formData.first_name}
                  onChange={(e) =>
                    handleChange("first_name", e.target.value)
                  }
                  onBlur={() => handleBlur("first_name")}
                  className={inputClass("first_name")}
                />
              </div>

              {touched.first_name && errors.first_name && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.first_name}
                </p>
              )}
            </div>

            {/* LAST NAME */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Last Name <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                <input
                  type="text"
                  placeholder="Bikila"
                  value={formData.last_name}
                  onChange={(e) =>
                    handleChange("last_name", e.target.value)
                  }
                  onBlur={() => handleBlur("last_name")}
                  className={inputClass("last_name")}
                />
              </div>

              {touched.last_name && errors.last_name && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.last_name}
                </p>
              )}
            </div>

            {/* USERNAME */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Username <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                <input
                  type="text"
                  placeholder="abebe123"
                  value={formData.username}
                  onChange={(e) =>
                    handleChange(
                      "username",
                      e.target.value.replace(/\s/g, ""),
                    )
                  }
                  onBlur={() => handleBlur("username")}
                  className={inputClass("username")}
                />
              </div>

              {touched.username && errors.username && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.username}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Email <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                <input
                  type="email"
                  placeholder="abebe@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    handleChange("email", e.target.value)
                  }
                  onBlur={() => handleBlur("email")}
                  className={inputClass("email")}
                />
              </div>

              {touched.email && errors.email && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* PHONE */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Phone Number <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                <input
                  type="text"
                  placeholder="+251911000000"
                  value={formData.phone_number}
                  onChange={(e) =>
                    handleChange("phone_number", e.target.value)
                  }
                  onBlur={() => handleBlur("phone_number")}
                  className={inputClass("phone_number")}
                />
              </div>

              {touched.phone_number && errors.phone_number && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.phone_number}
                </p>
              )}
            </div>

            {/* ROLE */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Role
              </label>

              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                <select
                  value={formData.role}
                  onChange={(e) =>
                    handleChange("role", e.target.value)
                  }
                  className="w-full appearance-none pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white focus:ring-4 focus:ring-[#6750A4]/10 focus:border-[#6750A4] outline-none transition"
                >
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="delivery">Delivery</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Password <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Strong password..."
                  value={formData.password}
                  onChange={(e) =>
                    handleChange("password", e.target.value)
                  }
                  onBlur={() => handleBlur("password")}
                  className={inputClass("password")}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {formData.password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">
                      Password strength
                    </span>

                    <span
                      className={`text-xs font-medium ${
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
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Confirm Password <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                <input
                  type={
                    showConfirmPassword ? "text" : "password"
                  }
                  placeholder="Confirm password..."
                  value={formData.confirm_password}
                  onChange={(e) =>
                    handleChange(
                      "confirm_password",
                      e.target.value,
                    )
                  }
                  onBlur={() =>
                    handleBlur("confirm_password")
                  }
                  className={inputClass("confirm_password")}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword,
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {touched.confirm_password &&
                errors.confirm_password && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.confirm_password}
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl border border-gray-200 hover:bg-white transition font-medium"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-3 rounded-2xl bg-[#6750A4] hover:bg-[#5b4694] text-white transition shadow-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Create User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}