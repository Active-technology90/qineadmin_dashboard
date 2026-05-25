import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  AlertCircle,
  Mail,
  Phone,
  UserIcon,
  User2Icon,
  UserCircle,
} from "lucide-react";
import type { User } from "../../../types";

// ============================================================
// Reusable Components
// ============================================================

interface FormInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  required?: boolean;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  icon,
  required,
  placeholder,
  error,
  autoComplete,
}) => {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;

  return (
    <div className="relative">
      <div
        className={`relative rounded-xl transition-all duration-200 ${
          focused
            ? "ring-2 ring-secondary/30 border-secondary"
            : "border-gray-200"
        } ${error ? "border-red-300 ring-red-100" : ""}`}
      >
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <span className="h-4 w-4 xs:h-4.5 xs:w-4.5 sm:h-5 sm:w-5">
              {icon}
            </span>
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder || (focused ? label : "")}
          required={required}
          autoComplete={autoComplete}
          className={`w-full bg-white/80 backdrop-blur-sm px-3 xs:px-4 py-2.5 xs:py-3 rounded-xl border transition-all duration-200 outline-none text-xs xs:text-sm sm:text-base ${
            icon ? "pl-8 xs:pl-10" : "pl-3 xs:pl-4"
          } ${
            error
              ? "border-red-300 focus:border-red-500"
              : "border-gray-200 focus:border-secondary"
          } text-gray-900 placeholder-gray-400`}
        />
        <label
          htmlFor={id}
          className={`absolute left-3 transition-all duration-200 pointer-events-none px-1 bg-white/80 backdrop-blur-sm text-xs xs:text-sm ${
            focused || hasValue
              ? "text-[10px] xs:text-xs -top-2.5 text-secondary"
              : "text-xs xs:text-sm top-1/2 -translate-y-1/2 text-gray-500"
          } ${icon ? "left-8 xs:left-10" : "left-3"}`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] xs:text-xs text-red-500 mt-1 ml-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
}) => {
  return (
    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 xs:p-4 bg-gray-50 rounded-xl gap-2 xs:gap-0">
      <div>
        <p className="font-medium text-gray-900 text-xs xs:text-sm">{label}</p>
        {description && <p className="text-[10px] xs:text-xs text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 xs:h-6 w-9 xs:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/50 ${
          checked ? "bg-secondary" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-3.5 xs:h-4 w-3.5 xs:w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-5 xs:translate-x-6" : "translate-x-0.5 xs:translate-x-1"
          }`}
        />
      </button>
    </div>
  );
};

// interface AvatarUploadProps {
//   imageUrl: string | null;
//   onImageChange: (file: File | null) => void;
//   name: string;
// }

// const AvatarUpload: React.FC<AvatarUploadProps> = ({
//   imageUrl,
//   onImageChange,
//   name,
// }) => {
//   const [preview, setPreview] = useState<string | null>(imageUrl);
//   const [isHovering, setIsHovering] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setPreview(reader.result as string);
//       };
//       reader.readAsDataURL(file);
//       onImageChange(file);
//     }
//   };

//   const getInitials = () => {
//     const parts = name.split(" ");
//     if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
//     if (parts.length === 1) return parts[0][0].toUpperCase();
//     return "U";
//   };

//   return (
//     <div className="flex flex-col items-center gap-3">
//       <motion.div
//         className="relative cursor-pointer"
//         whileHover={{ scale: 1.05 }}
//         onHoverStart={() => setIsHovering(true)}
//         onHoverEnd={() => setIsHovering(false)}
//         onClick={() => fileInputRef.current?.click()}
//       >
//         <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden shadow-lg">
//           {preview ? (
//             <img
//               src={preview}
//               alt="Avatar"
//               className="h-full w-full object-cover"
//             />
//           ) : (
//             <span className="text-3xl font-bold text-white">
//               {getInitials()}
//             </span>
//           )}
//         </div>
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: isHovering ? 1 : 0 }}
//           className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"
//         >
//           <Camera className="h-6 w-6 text-white" />
//         </motion.div>
//       </motion.div>
//       <input
//         ref={fileInputRef}
//         type="file"
//         accept="image/*"
//         onChange={handleFileChange}
//         className="hidden"
//       />
//       <button
//         type="button"
//         onClick={() => fileInputRef.current?.click()}
//         className="text-xs text-secondary hover:underline"
//       >
//         Change photo
//       </button>
//       {preview && (
//         <button
//           type="button"
//           onClick={() => {
//             setPreview(null);
//             onImageChange(null);
//           }}
//           className="text-xs text-red-500 hover:underline"
//         >
//           Remove
//         </button>
//       )}
//     </div>
//   );
// };

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 p-3 xs:p-4 bg-red-50 rounded-xl border border-red-200"
    >
      <AlertCircle className="h-4 w-4 xs:h-5 xs:w-5 text-red-500 flex-shrink-0" />
      <p className="text-xs xs:text-sm text-red-700 flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="p-1 hover:bg-red-100 rounded-lg">
          <X className="h-4 w-4 text-red-500" />
        </button>
      )}
    </motion.div>
  );
};

interface ActionButtonProps {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  type?: "button" | "submit";
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  loading,
  disabled,
  variant = "primary",
  children,
  type = "button",
}) => {
  const baseStyles =
    "px-4 xs:px-5 py-2 xs:py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-xs xs:text-sm sm:text-base";
  const variants = {
    primary:
      "bg-secondary text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0",
    secondary:
      "bg-white/80 backdrop-blur-sm border border-gray-300 text-gray-700 hover:bg-white",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]}`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  );
};

// ============================================================
// Main Modal Component
// ============================================================

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (updatedUser: Partial<User>) => Promise<void>;
}

const EditUserModal: React.FC<EditUserModalProps> = React.memo(
  ({ isOpen, onClose, user, onSave }) => {
    const [formData, setFormData] = useState({
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      username: "",

      is_active: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
      if (user) {
        setFormData({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email,
          phone_number: user.phone_number || "",
          username: user.username,
          is_active: Boolean(user.is_active),
        });
        setFieldErrors({});
      }
    }, [user]);

    const validate = useCallback(() => {
      const errors: Record<string, string> = {};
      if (!formData.email.trim()) errors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email))
        errors.email = "Invalid email format";
      if (!formData.username.trim()) errors.username = "Username is required";
      if (
        formData.phone_number &&
        !/^\+?[0-9\s\-()]{8,}$/.test(formData.phone_number)
      )
        errors.phone_number = "Invalid phone number";
      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    }, [formData]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setLoading(true);
      setError("");

      try {
        const updateData: Partial<User> = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone_number: formData.phone_number,
          username: formData.username,
          is_active: formData.is_active,
        };
        console.log(updateData);
        await onSave(updateData);
        onClose();
      } catch (err: any) {
        setError(err.message || "Failed to update user");
      } finally {
        setLoading(false);
      }
    };

    if (!isOpen) return null;

    // Responsive modal classes
    const modalContainerClasses = `
      bg-white p-4 shadow-[0_25px_80px_rgba(0,0,0,0.15)] border border-secondary/10 
      w-full flex flex-col
      max-[319px]:h-[100dvh] max-[319px]:rounded-none
      xs:h-[95dvh] xs:rounded-t-3xl xs:mt-auto
      sm:max-w-lg sm:max-h-[92dvh] sm:rounded-3xl sm:mx-auto
      md:max-w-2xl
      lg:max-w-4xl
      xl:max-w-5xl
      2xl:max-w-6xl
    `;

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-0 sm:p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className={modalContainerClasses}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-secondary py-3 xs:py-4 rounded-t-3xl max-[319px]:rounded-none xs:rounded-t-3xl">
                <div className="flex items-center justify-between px-4 xs:px-5 sm:px-6">
                  <div>
                    <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-white">
                      Edit User Profile
                    </h2>
                    <p className="text-purple-100 text-xs xs:text-sm mt-1">
                      Update user information and permissions
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <form onSubmit={handleSubmit} className="px-4 xs:px-5 sm:px-6 py-6 xs:py-8 space-y-5">
                  {/* Avatar Upload */}
                  {/* <div className="flex justify-center">
                    <AvatarUpload
                      imageUrl={user?.profile_image || null}
                      onImageChange={setAvatarFile}
                      name={`${formData.first_name} ${formData.last_name}`}
                    />
                  </div> */}

                  {/* Two-column layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-5">
                    <FormInput
                      id="first_name"
                      label="First Name"
                      value={formData.first_name}
                      onChange={(val) =>
                        setFormData({ ...formData, first_name: val })
                      }
                      icon={<User2Icon className="h-4 w-4" />}
                      autoComplete="given-name"
                    />
                    <FormInput
                      id="last_name"
                      label="Last Name"
                      value={formData.last_name}
                      onChange={(val) =>
                        setFormData({ ...formData, last_name: val })
                      }
                      icon={<UserIcon className="h-4 w-4" />}
                      autoComplete="family-name"
                    />
                    <FormInput
                      id="username"
                      label="Username"
                      value={formData.username}
                      onChange={(val) =>
                        setFormData({ ...formData, username: val })
                      }
                      icon={<UserCircle className="h-4 w-4" />}
                      required
                      error={fieldErrors.username}
                      autoComplete="username"
                    />
                    <FormInput
                      id="email"
                      label="Email Address"
                      type="email"
                      value={formData.email}
                      onChange={(val) => setFormData({ ...formData, email: val })}
                      icon={<Mail className="h-4 w-4" />}
                      required
                      error={fieldErrors.email}
                      autoComplete="email"
                    />
                    <FormInput
                      id="phone_number"
                      label="Phone Number"
                      value={formData.phone_number}
                      onChange={(val) =>
                        setFormData({ ...formData, phone_number: val })
                      }
                      icon={<Phone className="h-4 w-4" />}
                      error={fieldErrors.phone_number}
                      autoComplete="tel"
                    />
                  </div>

                  {/* Toggle Switch */}
                  <ToggleSwitch
                    checked={formData.is_active}
                    onChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                    label="Active Account"
                    description="User can log in and access the platform"
                  />

                  {/* Error Message */}
                  {error && (
                    <ErrorAlert message={error} onDismiss={() => setError("")} />
                  )}
                </form>
              </div>

              {/* Sticky Footer with buttons */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 xs:px-5 sm:px-6 py-3 xs:py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 xs:gap-3" style={{ paddingBottom: `max(env(safe-area-inset-bottom, 1rem), 1rem)` }}>
                <ActionButton
                  onClick={onClose}
                  variant="secondary"
                  type="button"
                >
                  Cancel
                </ActionButton>
                <ActionButton
                  loading={loading}
                  variant="primary"
                  type="submit"
                  onClick={handleSubmit as any}
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </ActionButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);

EditUserModal.displayName = "EditUserModal";

export default EditUserModal;