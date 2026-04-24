import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  CreditCard,
  LogOut,
  Menu,
  X,
  Layout,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import Overview from "./Overview";
// Import your specific components – adjust paths as needed
     // to be created
import CompanyUsers from "./CompanyUsers";           // to be created
import Orders from "./Orders";                       // to be created
import Payments from "./Payments";                   // to be created
import CompanyProducts from "./company-products/CompanyProducts";

type Tab =
  | "overview"
  | "products"
  | "users"
  | "orders"
  | "payments";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <Overview />;
      case "products":
        return <CompanyProducts />;
      case "users":
        return <CompanyUsers />;
      case "orders":
        return <Orders />;
      case "payments":
        return <Payments />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex h-screen font-sans bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative top-0 left-0 h-screen w-72 bg-gradient-to-b from-purple-900 to-[#6750A4] text-white flex flex-col shadow-2xl z-50 transform transition-transform duration-300
          ${isSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="p-8 border-b border-gray-800 flex items-center gap-3">
          <div className="bg-white/10 p-1 w-12 h-12 rounded-lg backdrop-blur-sm">
            <img src="/qinemartethio.jpeg" alt="Qine Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <div>
            <span className="block text-lg font-bold tracking-wide font-primary">
              Admin Panel
            </span>
            <span className="block text-xs text-indigo-300 font-secondary mt-0.5">
              Dashboard
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden ml-auto text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {/* Overview */}
          <button
            onClick={() => {
              setActiveTab("overview");
              setIsSidebarOpen(false);
            }}
            className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group
              ${activeTab === "overview"
                ? "bg-white/40 text-white shadow-lg shadow-indigo-900/50 translate-x-1"
                : "text-gray-200 hover:bg-white/5 hover:text-white hover:translate-x-1"
              }
            `}
          >
            <LayoutDashboard
              className={`h-5 w-5 ${activeTab === "overview"
                ? "text-white"
                : "text-gray-200 group-hover:text-white"
                }`}
            />
            Overview
          </button>

          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-8">
            Management
          </p>

          {/* Company Products */}
          <button
            onClick={() => {
              setActiveTab("products");
              setIsSidebarOpen(false);
            }}
            className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group
              ${activeTab === "products"
                ? "bg-white/40 text-white shadow-lg shadow-indigo-900/50 translate-x-1"
                : "text-gray-300 hover:bg-white/5 hover:text-white hover:translate-x-1"
              }
            `}
          >
            <Package
              className={`h-5 w-5 ${activeTab === "products"
                ? "text-white"
                : "text-gray-400 group-hover:text-white"
                }`}
            />
            Company Products
          </button>

          {/* Company Users */}
          <button
            onClick={() => {
              setActiveTab("users");
              setIsSidebarOpen(false);
            }}
            className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group
              ${activeTab === "users"
                ? "bg-white/40 text-white shadow-lg shadow-indigo-900/50 translate-x-1"
                : "text-gray-300 hover:bg-white/5 hover:text-white hover:translate-x-1"
              }
            `}
          >
            <Users
              className={`h-5 w-5 ${activeTab === "users"
                ? "text-white"
                : "text-gray-400 group-hover:text-white"
                }`}
            />
            Company Users
          </button>

          {/* Orders */}
          <button
            onClick={() => {
              setActiveTab("orders");
              setIsSidebarOpen(false);
            }}
            className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group
              ${activeTab === "orders"
                ? "bg-white/40 text-white shadow-lg shadow-indigo-900/50 translate-x-1"
                : "text-gray-300 hover:bg-white/5 hover:text-white hover:translate-x-1"
              }
            `}
          >
            <ShoppingBag
              className={`h-5 w-5 ${activeTab === "orders"
                ? "text-white"
                : "text-gray-400 group-hover:text-white"
                }`}
            />
            Orders
          </button>

          {/* Payments */}
          <button
            onClick={() => {
              setActiveTab("payments");
              setIsSidebarOpen(false);
            }}
            className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group
              ${activeTab === "payments"
                ? "bg-white/40 text-white shadow-lg shadow-indigo-900/50 translate-x-1"
                : "text-gray-300 hover:bg-white/5 hover:text-white hover:translate-x-1"
              }
            `}
          >
            <CreditCard
              className={`h-5 w-5 ${activeTab === "payments"
                ? "text-white"
                : "text-gray-400 group-hover:text-white"
                }`}
            />
            Payments
          </button>
        </nav>

        {/* <div className="p-4 m-4 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-gray-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
              {user?.first_name?.[0] || "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">
                {user?.first_name || "Admin"} {user?.last_name}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div> */}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white">
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                {user?.first_name?.[0] || "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user?.first_name || "Admin"} {user?.last_name}
                </p>
                <p className="text-xs text-gray-700 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* <div className="text-right hidden sm:block">
              <span className="block text-sm font-bold text-gray-900">
                {new Date().toLocaleDateString("en-US", { weekday: "long" })}
              </span>
              <span className="block text-xs text-gray-500">
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div> */}

            {/* <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border border-gray-200">
              <Calendar className="h-5 w-5" />
            </div> */}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full text-sm font-bold hover:bg-red-600 transition-all"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </header>

        <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}