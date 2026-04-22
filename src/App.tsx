import { Routes, Route } from "react-router-dom";
import SignIn from "./pages/SignIn";
import AdminDashboard from "./components/dashboard/AdminDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/dashboard" element={<AdminDashboard />} />
      <Route path="/" element={<SignIn />} />
    </Routes>
  );
}
