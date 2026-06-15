import { Routes, Route } from "react-router-dom";
import SignIn from "./pages/SignIn";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import { CurrentCompanyProvider } from "./context/CurrentCompanyContext";
import { useAuth } from "./context/authContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationsProvider } from "./context/NotificationsContext";

export default function App() {
  const { user } = useAuth();
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
      <Route path="/" element={<SignIn />} />
    </Routes>
  );
}
