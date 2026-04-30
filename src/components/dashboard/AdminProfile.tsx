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
  const isSuperAdmin = !user?.memberships?.length;

  const [avatar, setAvatar] = useState<string | null>(
    user?.profile_image || user?.image || null,
  );

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [activeForm, setActiveForm] = useState<
    "profile" | "password" | "membership"
  >("profile");

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
        className="rounded-2xl p-6 text-white flex items-center justify-between shadow-xl backdrop-blur-md"
        style={{
          backgroundColor: BRAND_COLOR,
          backgroundImage:
            "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,0,0,0.15))",
        }}
      >
        <div className="flex items-center gap-4">
          {/* AVATAR */}
          <div className="relative group w-16 h-16">
            {/* AVATAR IMAGE */}
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

            {/* CAMERA ICON OVERLAY */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition">
              <span className="text-white text-lg">📷</span>
            </div>

            {/* FILE INPUT */}
            <input
              type="file"
              onChange={handleAvatarChange}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* USER INFO */}
          {/* USER INFO + MEMBERSHIP */}
          <div className="space-y-1">
            {/* NAME */}
            <h2 className="text-lg font-bold">
              {user?.first_name} {user?.last_name}
            </h2>

            {/* EMAIL */}
            <p className="text-sm opacity-80">{user?.email}</p>

            {/* GLOBAL ROLE */}
            {/* <span className="text-xs bg-white/20 px-2 py-1 rounded-full inline-block">
    Role: {user?.role} 
  </span> */}

            {/* MEMBERSHIPS SECTION (NEW FEATURE) */}
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
      <div className="flex gap-2 mt-6 bg-white p-2 rounded-full w-fit shadow-sm">
        <button
          onClick={() => setActiveForm("profile")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            activeForm === "profile"
              ? "text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          style={
            activeForm === "profile" ? { backgroundColor: BRAND_COLOR } : {}
          }
        >
          Edit Profile
        </button>

        <button
          onClick={() => setActiveForm("password")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            activeForm === "password"
              ? "text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          style={
            activeForm === "password" ? { backgroundColor: BRAND_COLOR } : {}
          }
        >
          Change Password
        </button>
        {!isSuperAdmin && (
          <button
            onClick={() => setActiveForm("membership")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeForm === "membership"
                ? "text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            style={
              activeForm === "membership"
                ? { backgroundColor: BRAND_COLOR }
                : {}
            }
          >
            Membership
          </button>
        )}
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

      {/* MEMBERSHIP FORM */}
      {!isSuperAdmin && activeForm === "membership" && (
        <div className="bg-white p-6 rounded-2xl mt-6 shadow-lg border border-gray-100">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-800">
              Company Memberships
            </h3>

            <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
              {user?.memberships?.length || 0} companies
            </span>
          </div>

          {/* TABLE */}
          {user?.memberships?.length ? (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full">
                {/* HEADER */}
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                  </tr>
                </thead>

                {/* BODY */}
                <tbody className="divide-y divide-gray-100">
                  {user.memberships.map((m: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50 transition">
                      {/* COMPANY NAME */}
                      <td className="p-4 flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-sm font-bold">
                          🏢
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {m.company_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Member organization
                          </p>
                        </div>
                      </td>

                      {/* ROLE */}
                      <td className="p-4">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${
                            m.role === "admin"
                              ? "bg-green-100 text-green-700"
                              : m.role === "viewer"
                                ? "bg-gray-100 text-gray-600"
                                : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {m.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-gray-400 text-4xl mb-2">🏢</div>
              <p className="text-gray-500 text-sm">
                No company memberships found
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
