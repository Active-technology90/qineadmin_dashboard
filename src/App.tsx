import { Routes, Route } from "react-router-dom";
import SignIn from "./pages/SignIn";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import { CurrentCompanyProvider } from "./context/CurrentCompanyContext";
import { useAuth } from "./context/authContext";

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route
        path="/dashboard"
        element={
          <CurrentCompanyProvider userMemberships={user?.memberships || null}>
            <AdminDashboard />
          </CurrentCompanyProvider>
        }
      />
      <Route path="/" element={<SignIn />} />
    </Routes>
  );
}
