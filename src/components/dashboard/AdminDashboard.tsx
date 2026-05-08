import { useState, useRef, useEffect, createContext, useContext } from "react";
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
  User,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useCurrentCompany } from "../../context/CurrentCompanyContext";

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

// ─────────────────────────────────────────────────────────────
// Read‑only Context – tells child components if they are in viewer mode
// ─────────────────────────────────────────────────────────────
const ReadOnlyContext = createContext<boolean>(false);
export const useReadOnly = () => useContext(ReadOnlyContext);

// ════════════════════════════════════════════════════════════
// OrdersMenu (unchanged)
// ════════════════════════════════════════════════════════════
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
      if (
        ordersRef.current &&
        !ordersRef.current.contains(event.target as Node)
      ) {
        setCollapsedOrdersOpen(false);
      }
    };
    if (collapsedOrdersOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [collapsedOrdersOpen]);

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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { company } = useCurrentCompany();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ── Core identity flags ────────────────────────────────
  const isSuperAdmin = !user?.memberships?.length;
  const isViewer = !isSuperAdmin && company?.role === "viewer";

  // For viewers: show everything like super admin but read‑only
  const showPlatformAdmin = isSuperAdmin || isViewer;
  const showMasterOrders = isSuperAdmin;

  // Hide "Company Users" only for staff (not for viewers)
  // const hideUsersSidebar = !isSuperAdmin && company?.role === "staff";

  const navigate = (tab: Tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
    setProfileDropdownOpen(false);
  };

  const navigateFromOverview = (
    tab: "products" | "masterOrders" | "companyOrders",
  ) => navigate(tab);

  // Handle logout with confirmation
  const handleLogoutClick = () => {
    setProfileDropdownOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const renderContent = () => {
    const companyKey = company?.slug || "super";

    // Wrap each content component with ReadOnlyContext provider
    const content = (() => {
      switch (activeTab) {
        case "overview":
          return <Overview onNavigate={navigateFromOverview} />;
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
    })();

    return (
      <ReadOnlyContext.Provider key={companyKey} value={isViewer}>
        {content}
      </ReadOnlyContext.Provider>
    );
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
        <div
          className={`mx-2 mt-2 p-6 border-b border-gray-800 flex items-center gap-3 rounded-2xl ${sidebarCollapsed ? "justify-center p-4" : ""}`}
        >
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
                {isSuperAdmin
                  ? "Super Admin Panel"
                  : isViewer
                    ? "Viewer Panel (Read‑Only)"
                    : company?.role === "admin"
                      ? "Company Admin Panel"
                      : "Company Staff Panel"}
              </span>
              <span className="block text-xs text-indigo-300 mt-0.5">
                Dashboard
              </span>
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
          <SidebarItem
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
            active={activeTab === "overview"}
            collapsed={sidebarCollapsed}
            onClick={() => navigate("overview")}
          />

          {/* Platform Admin section – shown for super admin AND viewer */}
          {showPlatformAdmin && (
            <>
              <div
                className={`px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-8 ${
                  sidebarCollapsed ? "hidden" : ""
                }`}
              >
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

          <SidebarItem
            icon={<Users className="h-5 w-5" />}
            label={!user?.memberships?.length ? "Companies" : "Company Profile"}
            active={activeTab === "companies"}
            collapsed={sidebarCollapsed}
            onClick={() => navigate("companies")}
          />

          <div
            className={`px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-8 ${
              sidebarCollapsed ? "hidden" : ""
            }`}
          >
            Management
          </div>

          <SidebarItem
            icon={<Package className="h-5 w-5" />}
            label="Company Products"
            active={activeTab === "products"}
            collapsed={sidebarCollapsed}
            onClick={() => navigate("products")}
          />

          {/* {!hideUsersSidebar && ( */}
          <SidebarItem
            icon={<Users className="h-5 w-5" />}
            label="Company Users"
            active={activeTab === "users"}
            collapsed={sidebarCollapsed}
            onClick={() => navigate("users")}
          />
          {/* )} */}

          <OrdersMenu
            collapsed={sidebarCollapsed}
            activeTab={activeTab}
            onNavigate={navigate}
            showMasterOrders={showMasterOrders}
            ordersMenuOpen={ordersMenuOpen}
            onToggleOrdersMenu={() => setOrdersMenuOpen(!ordersMenuOpen)}
          />

          <SidebarItem
            icon={<CreditCard className="h-5 w-5" />}
            label="Payments"
            active={activeTab === "payments"}
            collapsed={sidebarCollapsed}
            onClick={() => navigate("payments")}
          />
          <SidebarItem
            icon={<User className="h-5 w-5" />}
            label="Profile"
            active={activeTab === "profile"}
            collapsed={sidebarCollapsed}
            onClick={() => navigate("profile")}
          />

          {/* <div className={`mt-8 px-4 ${sidebarCollapsed ? "hidden" : ""}`}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Account
            </p>
          </div>
          <button
            onClick={logout}
            className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group text-red-300 hover:bg-red-500/10 hover:text-red-200 ${
              sidebarCollapsed ? "justify-center px-2" : ""
            }`}
          >
            <LogOut className="h-5 w-5 text-red-300 group-hover:text-red-200" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button> */}
        </nav>

        <div className="mx-2 mb-2 p-2 flex justify-end"
                  style={{
            borderTop: '1px solid rgba(31, 41, 55, 0.5)',
            borderRadius: '16px',
          }}>
          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="p-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button> 
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white ">
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Role display - Modern badge design for Super Admin */}
            {isSuperAdmin && (
              <div className="hidden sm:block">
                <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-full border border-indigo-200 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                    Role:
                  </span>
                  <span className="text-sm font-black bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
                    {user?.role === "super_admin"
                      ? "Super Administrator"
                      : user?.role || "Super Admin"}
                  </span>
                </div>
              </div>
            )}
            {/* Company name – show for non‑super‑admin (including viewer) */}
            {company && !isSuperAdmin && (
              <div className="hidden sm:block">
                <p className="text-sm font-black text-indigo-700">
                  {company.name}{" "}
                  <span className="text-indigo-500 font-bold">
                    ({company.role})
                  </span>
                </p>
              </div>
            )}
           
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-3 group focus:outline-none cursor-pointer"
            >
              <div className="text-right hidden md:block">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                    Welcome,
                  </span>
                  <p className="text-base font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
                    {user?.username || user?.email?.split("@")[0] || "User"}
                  </p>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white/30 group-hover:scale-110 group-hover:ring-4 group-hover:ring-indigo-300 transition-all duration-300">
                {user?.first_name?.[0] || "A"}
              </div>
            </button>

            {profileDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-transparent">
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    {company && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                        <p className="text-xs font-medium text-indigo-700">
                          Role: {company.role}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => navigate("profile")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <Users className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">My Profile</p>
                    </div>
                  </button>

                  {/* Switch Back – always visible when a company is selected */}
                  {/* {company && !isSuperAdmin && (
                    <button
                      onClick={() => {
                        clearCompany();
                        setProfileDropdownOpen(false);
                        navigate("overview");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-amber-600 hover:bg-amber-50 transition-colors group border-t border-gray-100 cursor-pointer"
                    >
                      <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                        <Building2 className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Switch Back</p>
                        <p className="text-xs text-gray-400">to default</p>
                      </div>
                    </button>
                  )} */}

                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors group border-t border-gray-100 mt-1 cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                      <LogOut className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Sign Out</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        {/* add div and padding */}

        <div className="p-6 lg:p-8">{renderContent()}</div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Sign Out
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable SidebarItem (unchanged)
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
        active
          ? "bg-white/40 text-white shadow-lg"
          : "text-gray-300 hover:bg-white/5 hover:text-white"
      } ${collapsed ? "justify-center px-2" : ""}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </button>
  );
}
