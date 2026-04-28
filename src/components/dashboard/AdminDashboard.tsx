// src/pages/admin/AdminDashboard.tsx
import { useState, useRef, useEffect } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import Overview from "./Overview";
import CompanyUsers from "./companyUser/CompanyUsers";
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
  | "profile";

// ════════════════════════════════════════════════════════
// Extracted OrdersMenu component (no longer created during render)
// ════════════════════════════════════════════════════════
function OrdersMenu({
  collapsed,
  activeTab,
  onNavigate,
  showMasterOrders,
  ordersMenuOpen,
  onToggleOrdersMenu,
}: {
  collapsed: boolean;
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
  showMasterOrders: boolean;
  ordersMenuOpen: boolean;
  onToggleOrdersMenu: () => void;
}) {
  // Collapsed dropdown state (internal)
  const [collapsedOrdersOpen, setCollapsedOrdersOpen] = useState(false);
  const ordersRef = useRef<HTMLDivElement>(null);

  // Close collapsed dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ordersRef.current && !ordersRef.current.contains(event.target as Node)) {
        setCollapsedOrdersOpen(false);
      }
    };
    if (collapsedOrdersOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [collapsedOrdersOpen]);

  // ── Expanded mode ──
  if (!collapsed) {
    const isActive =
      activeTab === "masterOrders" || activeTab === "companyOrders";

    return (
      <div>
        <button
          onClick={onToggleOrdersMenu}
          className={`flex items-center justify-between w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group ${
            isActive
              ? "bg-white/40 text-white shadow-lg"
              : "text-gray-300 hover:bg-white/5 hover:text-white"
          }`}
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
            <button
              onClick={() => onNavigate("companyOrders")}
              className={`flex items-center gap-3 w-full px-4 py-2 text-sm rounded-lg transition ${
                activeTab === "companyOrders"
                  ? "bg-white/20 text-white font-semibold"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Company Orders
            </button>
            {showMasterOrders && (
              <button
                onClick={() => onNavigate("masterOrders")}
                className={`flex items-center gap-3 w-full px-4 py-2 text-sm rounded-lg transition ${
                  activeTab === "masterOrders"
                    ? "bg-white/20 text-white font-semibold"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <FileText className="h-4 w-4" />
                Master Orders
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Collapsed mode (icon + popover) ──
  return (
    <div className="relative" ref={ordersRef}>
      <button
        onClick={() => setCollapsedOrdersOpen(!collapsedOrdersOpen)}
        className={`flex items-center justify-center w-full px-2 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 ${
          activeTab === "masterOrders" || activeTab === "companyOrders"
            ? "bg-white/40 text-white shadow-lg"
            : "text-gray-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        <ShoppingBag className="h-5 w-5" />
      </button>

      {collapsedOrdersOpen && (
        <div className="absolute left-full top-0 ml-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
          <button
            onClick={() => {
              onNavigate("companyOrders");
              setCollapsedOrdersOpen(false);
            }}
            className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition ${
              activeTab === "companyOrders"
                ? "bg-indigo-50 text-indigo-700 font-medium"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Building2 className="h-4 w-4 text-gray-500" />
            Company Orders
          </button>
          {showMasterOrders && (
            <button
              onClick={() => {
                onNavigate("masterOrders");
                setCollapsedOrdersOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition ${
                activeTab === "masterOrders"
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FileText className="h-4 w-4 text-gray-500" />
              Master Orders
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// Main Dashboard Component
// ════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);       // mobile drawer
  const [ordersMenuOpen, setOrdersMenuOpen] = useState(false);     // expanded submenu
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapse

  const memberships = user?.memberships || [];
  const hasMembership = memberships.length > 0;
  const isCompanyAdmin = memberships.some((m: any) => m.role === "admin");
  const isCompanyStaff = memberships.some((m: any) => m.role === "staff") && !isCompanyAdmin;
  const isCompanyUser = hasMembership;
  const showMasterOrders = !isCompanyUser;   // only super admin sees Master Orders

  // Helper to navigate to a tab and close mobile sidebar
  const navigate = (tab: Tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":        return <Overview />;
      case "products":        return <CompanyProducts />;
      case "users":           return <CompanyUsers />;
      case "masterOrders":    return <MasterOrders />;
      case "companyOrders":   return <CompanyOrders />;
      case "payments":        return <Payments />;
      case "profile":         return <AdminProfile />;
      case "categories":      return <CategoryManagement />;
      case "subcategories":   return <SubCategoryManagement />;
      case "companies":       return <CompanyManagement />;
      default:                return <Overview />;
    }
  };

  return (
    <div className="flex h-screen font-sans bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative top-0 left-0 h-screen text-white flex flex-col shadow-2xl z-50 transform transition-all duration-300
          bg-gradient-to-b from-purple-900 to-[#6750A4]
          ${sidebarCollapsed ? "w-20" : "w-72"}
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo & title */}
        <div className={`p-8 border-b border-gray-800 flex items-center gap-3 ${sidebarCollapsed ? "justify-center p-4" : ""}`}>
          <div className="bg-white/10 p-1 w-12 h-12 rounded-lg backdrop-blur-sm flex-shrink-0">
            <img
              src="/qinemartethio.jpeg"
              alt="Qine Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1">
              <span className="block text-lg font-bold tracking-wide">
                {!isCompanyUser
                  ? "Super Admin Panel"
                  : isCompanyAdmin
                  ? "Company Admin Panel"
                  : "Company Staff Panel"}
              </span>
              <span className="block text-xs text-indigo-300 mt-0.5">Dashboard</span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden ml-auto text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-6 space-y-1.5 overflow-y-auto scrollbar-thin custom-scrollbar">
          {/* Dashboard */}
          <SidebarItem
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
            active={activeTab === "overview"}
            collapsed={sidebarCollapsed}
            onClick={() => navigate("overview")}
          />

          {/* Platform Admin (super admin only) */}
          {!isCompanyUser && (
            <>
              <div className={`px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-8 ${sidebarCollapsed ? "hidden" : ""}`}>
                Platform Admin
              </div>
              <SidebarItem
                icon={<Layout className="h-5 w-5" />}
                label="Categories"
                active={activeTab === "categories"}
                collapsed={sidebarCollapsed}
                onClick={() => navigate("categories")}
              />
              <SidebarItem
                icon={<Layout className="h-5 w-5" />}
                label="SubCategories"
                active={activeTab === "subcategories"}
                collapsed={sidebarCollapsed}
                onClick={() => navigate("subcategories")}
              />
            </>
          )}

          {/* Companies */}
          <SidebarItem
            icon={<Users className="h-5 w-5" />}
            label="Companies"
            active={activeTab === "companies"}
            collapsed={sidebarCollapsed}
            onClick={() => navigate("companies")}
          />

          <div className={`px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-8 ${sidebarCollapsed ? "hidden" : ""}`}>
            Management
          </div>

          {/* Company Products */}
          <SidebarItem
            icon={<Package className="h-5 w-5" />}
            label="Company Products"
            active={activeTab === "products"}
            collapsed={sidebarCollapsed}
            onClick={() => navigate("products")}
          />

          {/* Company Users – super admin and company admin */}
          {!isCompanyStaff && (
            <SidebarItem
              icon={<Users className="h-5 w-5" />}
              label="Company Users"
              active={activeTab === "users"}
              collapsed={sidebarCollapsed}
              onClick={() => navigate("users")}
            />
          )}

          {/* Orders Dropdown – now a stable external component */}
          <OrdersMenu
            collapsed={sidebarCollapsed}
            activeTab={activeTab}
            onNavigate={navigate}
            showMasterOrders={showMasterOrders}
            ordersMenuOpen={ordersMenuOpen}
            onToggleOrdersMenu={() => setOrdersMenuOpen(!ordersMenuOpen)}
          />

          {/* Payments & Profile */}
          <SidebarItem
            icon={<CreditCard className="h-5 w-5" />}
            label="Payments"
            active={activeTab === "payments"}
            collapsed={sidebarCollapsed}
            onClick={() => navigate("payments")}
          />

          <SidebarItem
            icon={<>👤</>}
            label="Profile"
            active={activeTab === "profile"}
            collapsed={sidebarCollapsed}
            onClick={() => navigate("profile")}
          />

          {/* Account (Divider & Logout) */}
          <div className={`mt-8 px-4 ${sidebarCollapsed ? "hidden" : ""}`}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Account</p>
          </div>
          <button
            onClick={logout}
            className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group text-red-300 hover:bg-red-500/10 hover:text-red-200
              ${sidebarCollapsed ? "justify-center px-2" : ""}
            `}
          >
            <LogOut className="h-5 w-5 text-red-300 group-hover:text-red-200" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </nav>

        {/* Collapse toggle at the bottom right */}
        <div className="p-2 border-t border-gray-800 flex justify-end">
          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="p-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>
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
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                {user?.first_name?.[0] || "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user?.first_name || "Admin"} {user?.last_name}
                </p>
                <p className="text-xs text-gray-700 truncate">{user?.email}</p>
                {isCompanyUser && memberships[0] && (
                  <p className="text-xs text-indigo-600 truncate">
                    {memberships[0].company_name} ({memberships[0].role})
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
    </div>
  );
}

// Reusable SidebarItem – respects collapse state
function SidebarItem({
  icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group
        ${active ? "bg-white/40 text-white shadow-lg" : "text-gray-300 hover:bg-white/5 hover:text-white"}
        ${collapsed ? "justify-center px-2" : ""}
      `}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </button>
  );
}