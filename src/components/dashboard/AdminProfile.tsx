import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { updateProfile, changePassword, getMe } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

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

  const [avatar, setAvatar] = useState<string | null>(
    user?.profile_image || user?.image || null,
  );

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [activeForm, setActiveForm] = useState<"profile" | "password">(
    "profile",
  );

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

  // =========================
  // PROFILE UPDATE
  // =========================
  const onSubmitProfile = async (data: ProfileForm) => {
    setProfileLoading(true);

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

      if (updatedUser.profile_image) {
        setAvatar(updatedUser.profile_image ?? null);
      }

      alert("Profile updated successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  // =========================
  // PASSWORD CHANGE
  // =========================
  const onSubmitPassword = async (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setPasswordLoading(true);

    try {
      await changePassword({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      });

      alert("Password changed successfully");
      reset();
    } catch (err) {
      console.error(err);
      alert("Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  // =========================
  // AVATAR CHANGE (WEB)
  // =========================
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // (optional but recommended)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    // preview only
    const url = URL.createObjectURL(file);
    setAvatar(url);

    try {
      const formData = new FormData();

      // ⚠️ MUST MATCH BACKEND
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

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      {/* HEADER */}
      <div
        className="rounded-2xl p-6 text-white flex items-center justify-between shadow-lg"
        style={{ backgroundColor: BRAND_COLOR }}
      >
        <div className="flex items-center gap-4">
          {/* AVATAR */}
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                👤
              </div>
            )}

            <input
              type="file"
              onChange={handleAvatarChange}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* USER INFO */}
          <div>
            <h2 className="text-lg font-bold">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-sm opacity-80">{user?.email}</p>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              {user?.role}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-white text-black px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setActiveForm("profile")}
          className={`px-4 py-2 rounded-full transition ${
            activeForm === "profile"
              ? "text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          style={
            activeForm === "profile" ? { backgroundColor: BRAND_COLOR } : {}
          }
        >
          Edit Profile
        </button>

        <button
          onClick={() => setActiveForm("password")}
          className={`px-4 py-2 rounded-full transition ${
            activeForm === "password"
              ? "text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          style={
            activeForm === "password" ? { backgroundColor: BRAND_COLOR } : {}
          }
        >
          Change Password
        </button>
      </div>

      {/* PROFILE FORM */}
      {activeForm === "profile" && (
        <div className="bg-white p-6 rounded-2xl mt-6 space-y-4 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold">Personal Info</h3>

          <Controller
            control={control}
            name="first_name"
            render={({ field }) => (
              <input
                {...field}
                placeholder="First Name"
                className="w-full border border-gray-200 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
            )}
          />

          <Controller
            control={control}
            name="last_name"
            render={({ field }) => (
              <input
                {...field}
                placeholder="Last Name"
                className="w-full border border-gray-200 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <input
                {...field}
                placeholder="Email"
                className="w-full border border-gray-200 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
            )}
          />

          <Controller
            control={control}
            name="phone_number"
            render={({ field }) => (
              <input
                {...field}
                placeholder="Phone Number"
                className="w-full border border-gray-200 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
            )}
          />

          <button
            onClick={handleSubmit(onSubmitProfile)}
            disabled={profileLoading}
            className="w-full sm:w-auto px-6 py-2 rounded-full text-white font-medium transition-all duration-200 hover:shadow-lg hover:brightness-110 active:scale-95"
            style={{ backgroundColor: BRAND_COLOR }}
          >
            {profileLoading ? "Updating..." : "Update Profile"}
          </button>
        </div>
      )}

      {/* PASSWORD FORM */}
      {activeForm === "password" && (
        <div className="bg-white p-6 rounded-2xl mt-6 space-y-4 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold">Change Password</h3>

          <Controller
            control={passwordControl}
            name="currentPassword"
            render={({ field }) => (
              <input
                {...field}
                type="password"
                placeholder="Current Password"
                className="w-full border border-gray-200 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
            )}
          />

          <Controller
            control={passwordControl}
            name="newPassword"
            render={({ field }) => (
              <input
                {...field}
                type="password"
                placeholder="New Password"
                className="w-full border border-gray-200 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
            )}
          />

          <Controller
            control={passwordControl}
            name="confirmPassword"
            render={({ field }) => (
              <input
                {...field}
                type="password"
                placeholder="Confirm Password"
                className="w-full border border-gray-200 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
            )}
          />

          <button
            onClick={handlePasswordSubmit(onSubmitPassword)}
            disabled={passwordLoading}
            className="w-full sm:w-auto px-6 py-2 rounded-full text-white font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={{ backgroundColor: BRAND_COLOR }}
          >
            {passwordLoading ? "Saving..." : "Change Password"}
          </button>
        </div>
      )}
    </div>
  );
}