import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login as loginApi, getMe } from "../services/api";
import { useAuth } from "../context/authContext";

export default function SignIn(): React.JSX.Element {
  const [email, setEmail] = useState(""); // UI keeps email input
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      // 🔥 IMPORTANT FIX: backend expects "username"
      const response = await loginApi(email, password);

      const access = response?.data?.access;
      const refresh = response?.data?.refresh;

      if (!access || !refresh) {
        throw new Error("Invalid login response from server");
      }

      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);

      let userData = null;

      try {
        const userResponse = await getMe();
        userData = userResponse.data;
      } catch (err) {
        console.warn("Profile fetch failed");
      }

      await login(access, refresh, userData);

      navigate("/dashboard");

    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        "Login failed. Check credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#5f4bb6] via-[#6a5acd] to-[#4b3ca7] font-sans">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* LEFT SIDE */}
        <div className="hidden md:flex flex-col justify-center items-center text-white p-10 bg-gradient-to-br from-[#6a5acd] to-[#4b3ca7] relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_30%,white,transparent_40%),radial-gradient(circle_at_80%_70%,white,transparent_40%)]"></div>

          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center mb-6">
              <img src="/qinemartethio.jpeg" alt="Qine Logo" className="w-full h-full object-cover rounded-full" />
            </div>

            <h1 className="text-3xl font-bold mb-2">
              Qine Mart Admin
            </h1>

            <p className="text-sm opacity-90">
              Manage your platform with full control
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-8 md:p-10 flex flex-col justify-center">

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Welcome
            </h2>

            <p className="text-gray-500 text-sm">
              Enter your credentials to access admin panel
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-100 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <label className="text-sm text-gray-600">
                Email / Username
              </label>

              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#6a5acd] outline-none"
                placeholder="admin@qine.com"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Password
              </label>

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#6a5acd] outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6a5acd] text-white p-3 rounded-xl font-semibold hover:bg-[#5a4ac0] transition"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

          </form>

          <div className="mt-6 text-xs text-gray-400 text-center">
            Qine Market Admin • v1.0.0
          </div>

        </div>
      </div>
    </div>
  );
}

