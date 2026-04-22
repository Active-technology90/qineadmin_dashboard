import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login as loginApi, getMe } from "../../services/api";
import { useAuth } from "../../context/authContext";
import { Eye, EyeOff } from "lucide-react";

export default function SignIn(): JSX.Element {
  const [email, setEmail] = useState(""); // UI keeps email input
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f0ff] via-[#f5e9ff] to-[#efe1ff] font-sans">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white/90 rounded-3xl shadow-2xl overflow-hidden">

        {/* LEFT SIDE */}
        <div className="hidden md:flex flex-col justify-center items-center text-white p-10 bg-[#a200ff] relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_30%,white,transparent_40%),radial-gradient(circle_at_80%_70%,white,transparent_40%)]"></div>

          <div className="relative z-10 text-center">
            <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center mb-6">
              <span className="text-2xl">🛍️</span>
            </div>

            <h1 className="text-3xl font-bold mb-2">
              Qine Mart Admin
            </h1>

            <p className="text-sm opacity-90">
              Manage your ecommerce platform with full control
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-8 md:p-10 flex flex-col justify-center">

          <div className="mb-6">
           <h2 className="text-2xl font-bold text-[#111827]">
  Welcome back
</h2>

            <p className="text-[#6b7280] text-sm">
  Sign in to continue to your dashboard
</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-100 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">

            <div>
             <label className="text-sm text-[#6b7280]">
                Email / Username
              </label>

              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#a200ff] focus:ring-offset-2 transition-all duration-200 outline-none"
                placeholder="admin@qine.com"
              />
            </div>

            <div className="relative">
             <label className="text-sm text-[#6b7280]">
                Password
              </label>

              <input
               type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#a200ff] focus:ring-offset-2 transition-all duration-200 outline-none"
                placeholder="••••••••"
              />
             <button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-800 transition"
>
  {showPassword ? (
    <EyeOff className="w-5 h-5" />
  ) : (
    <Eye className="w-5 h-5" />
  )}
</button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-[#a200ff] to-[#8a00d4] shadow-lg shadow-[#a200ff]/30 hover:scale-[1.02] active:scale-[0.98] text-white p-3 rounded-xl font-semibold hover:from-[#8a00d4] hover:to-[#6f00cc] transition"
            >
              {loading ? (
  <span className="flex items-center justify-center gap-2">
    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    Signing in...
  </span>
) : (
  "Sign In"
)}
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