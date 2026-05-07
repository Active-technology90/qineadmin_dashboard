import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { updateProfile, changePassword, getMe } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useCurrentCompany } from "../../context/CurrentCompanyContext";
import {
  User,
  Mail,
  Phone,
  Lock,
  Key,
  Building,
  ArrowRight,
  Camera,
  LogOut,
  CheckCircle,
} from "lucide-react";

type ProfileForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const BRAND_COLOR = "#6750A4";

export default function AdminProfile() {
  const { user, setUser, logout } = useAuth();
  const { company, switchCompany } = useCurrentCompany();
  const isSuperAdmin = !user?.memberships?.length;
  console.log(user);

  const [avatar, setAvatar] = useState<string | null>(
    user?.profile_image || user?.image || null,
  );
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [activeForm, setActiveForm] = useState<
    "profile" | "password" | "membership"
  >("profile");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const { control, handleSubmit } = useForm<ProfileForm>({
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      phone_number: user?.phone_number || "",
    },
  });

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset,
  } = useForm<PasswordForm>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmitProfile = async (data: ProfileForm) => {
    setProfileLoading(true);
    setToast(null);
    try {
      const formData = new FormData();
      formData.append("first_name", data.first_name);
      formData.append("last_name", data.last_name);
      formData.append("email", data.email);
      formData.append("phone_number", data.phone_number);
      await updateProfile(formData);
      const res = await getMe();
      const updatedUser = res.data;
      setUser(updatedUser);
      if (updatedUser.profile_image) setAvatar(updatedUser.profile_image);
      setToast({ message: "Profile updated successfully", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to update profile";
      setToast({ message: errorMsg, type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setProfileLoading(false);
    }
  };

  const onSubmitPassword = async (data: PasswordForm) => {
    // Clear previous errors
    setPasswordErrors({});
    setToast(null);

    // Validate current password is not empty
    if (!data.currentPassword) {
      setPasswordErrors({ currentPassword: "Current password is required" });
      return;
    }

    // Validate password length
    if (data.newPassword.length < 8) {
      setPasswordErrors({
        newPassword: "Password must be at least 8 characters",
      });
      return;
    }

    // Validate password match
    if (data.newPassword !== data.confirmPassword) {
      setPasswordErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      });
      setToast({ message: "Password changed successfully", type: "success" });
      setTimeout(() => setToast(null), 3000);
      reset();
    } catch (err) {
      console.error(err);
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to change password";

      // Handle specific backend errors
      if (
        errorMsg.toLowerCase().includes("current") ||
        errorMsg.toLowerCase().includes("old password")
      ) {
        setPasswordErrors({ currentPassword: errorMsg });
      } else if (errorMsg.toLowerCase().includes("match")) {
        setPasswordErrors({ confirmPassword: errorMsg });
      } else {
        setToast({ message: errorMsg, type: "error" });
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setAvatar(url);
    try {
      const formData = new FormData();
      formData.append("profile_image", file);
      await updateProfile(formData);
      const res = await getMe();
      const updatedUser = res.data;
      setUser(updatedUser);
      setAvatar(updatedUser.profile_image ?? null);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to upload avatar");
    }
  };

  const handleSwitchCompany = (membership: any) => {
    switchCompany({
      slug: membership.company_slug,
      name: membership.company_name,
      role: membership.role,
    });
  };

  // Determine if a membership is currently selected
  const isCurrentCompany = (membership: any) => {
    return company?.slug === membership.company_slug;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300 ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          } border rounded-xl shadow-lg p-4 max-w-sm`}
        >
          <div className="flex items-center gap-3">
            {toast.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                !
              </div>
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
        <div
          className="relative h-32 bg-gradient-to-r from-[#6750A4] to-[#8B6BB4]"
          style={{
            backgroundImage: `linear-gradient(135deg, ${BRAND_COLOR}, #6750A4)`,
          }}
        >
          <div className="absolute -bottom-12 left-6 flex items-end gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                {avatar ? (
                  <img
                    src={avatar}
                    className="w-full h-full object-cover"
                    alt="avatar"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    <User className="h-10 w-10" />
                  </div>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md cursor-pointer hover:bg-gray-50 transition"
              >
                <Camera className="h-4 w-4 text-gray-600" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
                {user?.first_name} {user?.last_name}
              </h1>

              <div className="mt-2 inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-white" />
                <p className="text-black/60 text-sm font-medium">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

        </div>
        <div className="pt-16 pb-6 px-6">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200">
            <button
              onClick={() => setActiveForm("profile")}
              className={`px-5 py-2.5 text-sm font-medium transition-all relative ${
                activeForm === "profile"
                  ? "text-[#6750A4]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Edit Profile
              {activeForm === "profile" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6750A4] rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveForm("password")}
              className={`px-5 py-2.5 text-sm font-medium transition-all relative ${
                activeForm === "password"
                  ? "text-[#6750A4]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Change Password
              {activeForm === "password" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6750A4] rounded-full" />
              )}
            </button>
            {!isSuperAdmin && (
              <button
                onClick={() => setActiveForm("membership")}
                className={`px-5 py-2.5 text-sm font-medium transition-all relative ${
                  activeForm === "membership"
                    ? "text-[#6750A4]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Memberships
                {activeForm === "membership" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6750A4] rounded-full" />
                )}
              </button>
            )}
          </div>

          {/* Profile Form */}
          {activeForm === "profile" && (
            <div className="mt-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <Controller
                    control={control}
                    name="first_name"
                    render={({ field }) => (
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          {...field}
                          className={`w-full pl-9 pr-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6750A4] transition ${
                            passwordErrors.confirmPassword
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-200 focus:border-transparent"
                          }`}
                          placeholder="First Name"
                        />
                      </div>
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <Controller
                    control={control}
                    name="last_name"
                    render={({ field }) => (
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          {...field}
                          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6750A4] focus:border-transparent transition"
                          placeholder="Last Name"
                        />
                      </div>
                    )}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Controller
                  control={control}
                  name="email"
                  render={({ field }) => (
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...field}
                        type="email"
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6750A4] focus:border-transparent transition text-gray-900"
                        placeholder="you@example.com"
                      />
                    </div>
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Controller
                  control={control}
                  name="phone_number"
                  render={({ field }) => (
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...field}
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6750A4] focus:border-transparent transition text-gray-900"
                        placeholder="+251 9XX XXX XXX"
                      />
                    </div>
                  )}
                />
              </div>
              <div className="pt-2">
                <button
                  onClick={handleSubmit(onSubmitProfile)}
                  disabled={profileLoading}
                  className="px-6 py-2.5 bg-[#6750A4] text-white rounded-xl font-medium hover:bg-[#5a3d8c] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {profileLoading ? "Updating..." : "Update Profile"}
                </button>
              </div>
            </div>
          )}

          {/* Password Form */}
          {activeForm === "password" && (
            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <Controller
                  control={passwordControl}
                  name="currentPassword"
                  render={({ field }) => (
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...field}
                        type="password"
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6750A4] focus:border-transparent transition"
                        placeholder="Enter current password"
                      />
                    </div>
                  )}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <Controller
                  control={passwordControl}
                  name="newPassword"
                  render={({ field }) => (
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...field}
                        type="password"
                        className={`w-full pl-9 pr-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6750A4] transition ${
                          passwordErrors.currentPassword
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-200 focus:border-transparent"
                        }`}
                        placeholder="New password"
                      />
                    </div>
                  )}
                />
                {passwordErrors.newPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <Controller
                  control={passwordControl}
                  name="confirmPassword"
                  render={({ field }) => (
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...field}
                        type="password"
                        className={`w-full pl-9 pr-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6750A4] transition ${
                          passwordErrors.newPassword
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-200 focus:border-transparent"
                        }`}
                        placeholder="Confirm new password"
                      />
                    </div>
                  )}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>
              <div className="pt-2">
                <button
                  onClick={handlePasswordSubmit(onSubmitPassword)}
                  disabled={passwordLoading}
                  className="px-6 py-2.5 bg-[#6750A4] text-white rounded-xl font-medium hover:bg-[#5a3d8c] transition shadow-sm disabled:opacity-50"
                >
                  {passwordLoading ? "Saving..." : "Change Password"}
                </button>
              </div>
            </div>
          )}

          {/* Membership Section with current selection highlight */}
          {!isSuperAdmin && activeForm === "membership" && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Your Companies
                </h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {user?.memberships?.length || 0} memberships
                </span>
              </div>

              {user?.memberships?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.memberships.map((membership: any, idx: number) => {
                    const isActive = isCurrentCompany(membership);
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSwitchCompany(membership)}
                        className={`relative bg-white border rounded-xl p-4 cursor-pointer transition-all duration-200 group ${
                          isActive
                            ? "border-[#6750A4] shadow-md ring-1 ring-[#6750A4]/20"
                            : "border-gray-200 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                isActive
                                  ? "bg-[#6750A4] text-white"
                                  : "bg-[#6750A4]/10 text-[#6750A4]"
                              }`}
                            >
                              <Building className="h-5 w-5" />
                            </div>
                            <div>
                              <p
                                className={`font-medium transition-colors ${
                                  isActive
                                    ? "text-[#6750A4]"
                                    : "text-gray-800 group-hover:text-[#6750A4]"
                                }`}
                              >
                                {membership.company_name}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {isActive
                                  ? "Currently active"
                                  : "Click to switch"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                membership.role === "admin"
                                  ? "bg-green-100 text-green-700"
                                  : membership.role === "staff"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {membership.role}
                            </span>
                            {isActive ? (
                              <CheckCircle className="h-4 w-4 text-[#6750A4]" />
                            ) : (
                              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#6750A4] transition-colors" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Building className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="text-gray-500 mt-2">
                    No company memberships found
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
