// src/pages/admin/AdminDashboard.tsx
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
  ChevronDown,
  ChevronUp,
  FileText,
  Building2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import Overview from "./Overview";
import CompanyUsers from "./CompanyUsers";
import CompanyOrders from "./vedorOrders/CompanyOrders";
import Payments from "./Payments";
import CompanyProducts from "./company-products/CompanyProducts";
import CategoryManagement from "./CategoryManagement";
import SubCategoryManagement from "./SubCategoryManagement";
import CompanyManagement from "./CompanyManagement";
import MasterOrders from "./masterOrders/MasterOrders";
import AdminProfile from "./AdminProfile";


type Tab =
  | "overview"
  | "categories"
  | "subcategories"
  | "companies"
  | "products"
  | "users"
  | "masterOrders"
  | "companyOrders"
  | "payments"
  | "orders"
  | "profile";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ordersMenuOpen, setOrdersMenuOpen] = useState(false);

  // Determine if the user is a company admin (has at least one company membership)
  const isCompanyAdmin = user?.memberships && user.memberships.length > 0;

  // For company admin, the default active tab should be "companyOrders" or "products"
  // We'll keep "overview" as default for both roles.

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <Overview />;
      case "products":
        return <CompanyProducts />;
      case "users":
        return <CompanyUsers />;
      case "masterOrders":
        return <MasterOrders />;
      case "companyOrders":
        return <CompanyOrders />;
      case "payments":
        return <Payments />;
      case "profile":
        return <AdminProfile />;
      case "categories":
        return <CategoryManagement />;
      case "subcategories":
        return <SubCategoryManagement />;
      case "companies":
        return <CompanyManagement />;
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
            <img
              src="/qinemartethio.jpeg"
              alt="Qine Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <span className="block text-lg font-bold tracking-wide font-primary">
              {isCompanyAdmin ? "Company Admin Panel" : "Super Admin Panel"}
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
          {/* Overview – always visible */}
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
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </button>

          {/* Super Admin only sections */}
          {!isCompanyAdmin && (
            <>
              <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-8">
                Platform Admin
              </p>

              {/* Categories */}
              <button
                onClick={() => {
                  setActiveTab("categories");
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group
                  ${activeTab === "categories" ? "bg-white/40 text-white shadow-lg translate-x-1" : "text-gray-300 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}
              >
                <Layout className="h-5 w-5" /> Categories
              </button>

              {/* SubCategories */}
              <button
                onClick={() => {
                  setActiveTab("subcategories");
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group
                  ${activeTab === "subcategories" ? "bg-white/40 text-white shadow-lg translate-x-1" : "text-gray-300 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}
              >
                <Layout className="h-5 w-5" /> SubCategories
              </button>

              {/* Companies */}
            </>
          )}
          <button
            onClick={() => {
              setActiveTab("companies");
              setIsSidebarOpen(false);
            }}
            className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group
                  ${activeTab === "companies" ? "bg-white/40 text-white shadow-lg translate-x-1" : "text-gray-300 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}
          >
            <Users className="h-5 w-5" /> Companies
          </button>
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-8">
            Management
          </p>

          {/* Company Products – visible for all, but for company admin only their own */}
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
            <Package className="h-5 w-5" />
            Company Products
          </button>

          {/* Company Users – only for super admin */}
          {isCompanyAdmin && (
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
              <Users className="h-5 w-5" />
              Company Users
            </button>
          )}

          {/* Orders Dropdown – different content for company admin vs super admin */}
          <div>
            <button
              onClick={() => setOrdersMenuOpen(!ordersMenuOpen)}
              className={`flex items-center justify-between w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group
                ${activeTab === "masterOrders" || activeTab === "companyOrders"
                  ? "bg-white/40 text-white shadow-lg translate-x-1"
                  : "text-gray-300 hover:bg-white/5 hover:text-white hover:translate-x-1"
                }
              `}
            >
              <div className="flex items-center gap-3.5">
                <ShoppingBag className="h-5 w-5" />
                <span>Orders</span>
              </div>
              {ordersMenuOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {ordersMenuOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {/* Company Orders – always visible */}
                <button
                  onClick={() => {
                    setActiveTab("companyOrders");
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full text-left px-4 py-2 text-sm rounded-lg transition
                    ${activeTab === "companyOrders"
                      ? "bg-white/20 text-white font-semibold"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  <Building2 className="h-4 w-4" />
                  Company Orders
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

                {/* Profile */}
                <button
                  onClick={() => {
                    setActiveTab("profile");
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group
    ${activeTab === "profile"
                      ? "bg-white/40 text-white shadow-lg translate-x-1"
                      : "text-gray-300 hover:bg-white/5 hover:text-white hover:translate-x-1"
                    }`}
                >
                  👤 Profile
                </button>

                {/* Divider */}
                <div className="mt-8 px-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Account
                  </p>
                </div>

                <button
                  onClick={logout}
                  className="flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group text-red-300 hover:bg-red-500/10 hover:text-red-200 hover:translate-x-1"
                >
                  <LogOut className="h-5 w-5 text-red-300 group-hover:text-red-200" />
                  Logout
                </button>
              </div>
            )}
                {/* Master Orders – only for super admin */}
            {!isCompanyAdmin && (
              <button
                onClick={() => {
                  setActiveTab("masterOrders");
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center gap-3 w-full text-left px-4 py-2 text-sm rounded-lg transition
                      ${activeTab === "masterOrders"
                    ? "bg-white/20 text-white font-semibold"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }
                    `}
              >
                <FileText className="h-4 w-4" />
                Master Orders
              </button>
            )}
          </div>

        {/* Payments – only for super admin */}
        {!isCompanyAdmin && (
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
            <CreditCard className="h-5 w-5" />
            Payments
          </button>
        )}
      </nav>
    </aside>

      {/* Main Content */ }
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
            {isCompanyAdmin && user?.memberships?.[0] && (
              <p className="text-xs text-indigo-600 truncate">
                {user.memberships[0].company_name}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
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
    </div >
  );
}
