import { useEffect } from "react";  // ADDED: useEffect import
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import SignIn from "./pages/SignIn";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import BankManagement from "./components/dashboard/bank/BankManagement";
import RegisterCompany from "./pages/RegisterCompany";
import TrackingPage from "./pages/TrackingPage";
import MarketerDashboardLayout from "./components/dashboard/MarketerDashboard";
import { CurrentCompanyProvider } from "./context/CurrentCompanyContext";
import { AuthProvider, useAuth } from "./context/authContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationsProvider } from "./context/NotificationsContext";

// Inner component to use auth hooks
function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if user is in marketer mode
  const isMarketerMode = localStorage.getItem("forceMarketerMode") === "true";
  const isMarketer = user?.role === "marketer" || isMarketerMode;
  
  // Redirect protection - prevents users from accessing wrong dashboard
  useEffect(() => {
    if (user) {
      const path = location.pathname;
      
      // If user is marketer but trying to access dashboard, redirect to marketing-dashboard
      if (isMarketer && path === "/dashboard") {
        navigate("/marketing-dashboard");
      }
      
      // If user is admin but trying to access marketing-dashboard without force mode
      if (!isMarketer && path === "/marketing-dashboard") {
        navigate("/dashboard");
      }
    }
  }, [user, location.pathname, isMarketer, navigate]);

  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route
        path="/dashboard"
        element={
          <CurrentCompanyProvider userMemberships={user?.memberships || null}>
            <ThemeProvider>
              <NotificationsProvider>
                <AdminDashboard />
              </NotificationsProvider>
            </ThemeProvider>
          </CurrentCompanyProvider>
        }
      />
      <Route path="/bank-accounts" element={<BankManagement />} />
      <Route path="/register-company" element={<RegisterCompany />} />
      <Route path="/tracking" element={<TrackingPage />} />
      <Route
        path="/marketing-dashboard"
        element={
          <CurrentCompanyProvider userMemberships={user?.memberships || null}>
            <ThemeProvider>
              <NotificationsProvider>
                <MarketerDashboardLayout />
              </NotificationsProvider>
            </ThemeProvider>
          </CurrentCompanyProvider>
        }
      /> 
      <Route path="/" element={<SignIn />} />
    </Routes>
  );
}

// Main App component wrapped with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}