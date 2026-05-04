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
import { CurrentCompanyContext } from "../../context/CurrentCompanyContext";
import type { CurrentCompany } from "../../context/CurrentCompanyContext";
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
// OrdersMenu (unchanged)
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
  const [collapsedOrdersOpen, setCollapsedOrdersOpen] = useState(false);
  const ordersRef = useRef<HTMLDivElement>(null);

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

  if (!collapsed) {
    const isActive = activeTab === "masterOrders" || activeTab === "companyOrders";
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
          {ordersMenuOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
// Main Dashboard
// ════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ordersMenuOpen, setOrdersMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<any | null>(null);

  // On mount, load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("selectedMembership");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSelectedMembership(parsed);
      } catch (e) {
        console.error("Failed to parse stored membership", e);
      }
    }
  }, []);

  const memberships = user?.memberships || [];
  const effectiveMembership = selectedMembership || memberships[0] || null;

  // Derive current company object for context
  const currentCompany: CurrentCompany | null = effectiveMembership
    ? {
        slug: effectiveMembership.company_slug || effectiveMembership.company_id || "",
        name: effectiveMembership.company_name,
        role: effectiveMembership.role,
      }
    : null;

  const isSuperAdmin = !user?.memberships || user.memberships.length === 0;
  const isCompanyUser = !isSuperAdmin && !!effectiveMembership;
  const isCompanyAdmin = isCompanyUser && effectiveMembership?.role === "admin";
  const isCompanyStaff = isCompanyUser && effectiveMembership?.role === "staff";
  const showMasterOrders = isSuperAdmin && !selectedMembership;

  const navigate = (tab: Tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  // Context functions
  const switchCompany = (membership: CurrentCompany) => {
    localStorage.setItem("selectedMembership", JSON.stringify(membership));
    setSelectedMembership(membership);
    setActiveTab("overview"); // go to overview after switch
  };

  const clearCompany = () => {
    localStorage.removeItem("selectedMembership");
    setSelectedMembership(null);
    setActiveTab("overview");
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
            <img src="/qinemartethio.jpeg" alt="Qine Logo" className="w-full h-full object-cover rounded-full" />
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
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-6 space-y-1.5 overflow-y-auto">
          <SidebarItem
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
            active={activeTab === "overview"}
            collapsed={sidebarCollapsed}
            onClick={() => navigate("overview")}
          />

          {!isCompanyUser && (
            <>
              <div className={`px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-8 ${sidebarCollapsed ? "hidden" : ""}`}>
                Platform Admin
              </div>
              <SidebarItem icon={<Layout className="h-5 w-5" />} label="Categories" active={activeTab === "categories"} collapsed={sidebarCollapsed} onClick={() => navigate("categories")} />
              <SidebarItem icon={<Layout className="h-5 w-5" />} label="SubCategories" active={activeTab === "subcategories"} collapsed={sidebarCollapsed} onClick={() => navigate("subcategories")} />
            </>
          )}

          <SidebarItem icon={<Users className="h-5 w-5" />} label="Companies" active={activeTab === "companies"} collapsed={sidebarCollapsed} onClick={() => navigate("companies")} />

          <div className={`px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-8 ${sidebarCollapsed ? "hidden" : ""}`}>
            Management
          </div>

          <SidebarItem icon={<Package className="h-5 w-5" />} label="Company Products" active={activeTab === "products"} collapsed={sidebarCollapsed} onClick={() => navigate("products")} />

          {!isCompanyStaff && (
            <SidebarItem icon={<Users className="h-5 w-5" />} label="Company Users" active={activeTab === "users"} collapsed={sidebarCollapsed} onClick={() => navigate("users")} />
          )}

          <OrdersMenu
            collapsed={sidebarCollapsed}
            activeTab={activeTab}
            onNavigate={navigate}
            showMasterOrders={showMasterOrders}
            ordersMenuOpen={ordersMenuOpen}
            onToggleOrdersMenu={() => setOrdersMenuOpen(!ordersMenuOpen)}
          />

          <SidebarItem icon={<CreditCard className="h-5 w-5" />} label="Payments" active={activeTab === "payments"} collapsed={sidebarCollapsed} onClick={() => navigate("payments")} />
          <SidebarItem icon={<>👤</>} label="Profile" active={activeTab === "profile"} collapsed={sidebarCollapsed} onClick={() => navigate("profile")} />

          <div className={`mt-8 px-4 ${sidebarCollapsed ? "hidden" : ""}`}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Account</p>
          </div>
          <button
            onClick={logout}
            className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group text-red-300 hover:bg-red-500/10 hover:text-red-200 ${
              sidebarCollapsed ? "justify-center px-2" : ""
            }`}
          >
            <LogOut className="h-5 w-5 text-red-300 group-hover:text-red-200" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </nav>

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
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.first_name?.[0] || "A"}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user?.first_name || "Admin"} {user?.last_name}
                </p>
                <p className="text-xs text-gray-700 truncate">{user?.email}</p>
                {isCompanyUser && currentCompany && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-indigo-600 font-medium">
                      {currentCompany.name} ({currentCompany.role})
                    </span>
                    {selectedMembership && (
                      <button
                        onClick={clearCompany}
                        className="text-xs text-red-500 hover:text-red-700 underline"
                      >
                        (switch back)
                      </button>
                    )}
                  </div>
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

        <CurrentCompanyContext.Provider value={{ company: currentCompany, switchCompany, clearCompany }}>
          <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderContent()}
          </div>
        </CurrentCompanyContext.Provider>
      </main>
    </div>
  );
}

// Reusable SidebarItem
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
      className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group ${
        active ? "bg-white/40 text-white shadow-lg" : "text-gray-300 hover:bg-white/5 hover:text-white"
      } ${collapsed ? "justify-center px-2" : ""}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </button>
  );
}