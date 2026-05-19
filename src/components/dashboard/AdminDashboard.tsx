import { useState, useRef, useEffect, createContext, useContext } from "react";
import { RefreshButton } from "../ui/RefreshButton";
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
  ListOrdered,
  Proportions,
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

import MasterOrders from "./masterOrders/MasterOrders";
import AdminProfile from "./AdminProfile";
import CompanyManagement from "./CompanyManagement/CompanyManagement";
import SuperAdminUsers from "./UserManagement/SuperAdminUsers";
import AdManagement from "./AdManagement";

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
  | "profile"
  | "add advertisment"
  | "superUsers";

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
  // If user only has Company Orders (no Master Orders), show simple single button without dropdown
  if (!showMasterOrders) {
    if (!collapsed) {
      return (
        <button
          onClick={() => onNavigate("companyOrders")}
          className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group ${activeTab === "companyOrders"
            ? "bg-white/40 text-white shadow-lg"
            : "text-gray-300 hover:bg-white/5 hover:text-white"
            }`}
        >
          <ShoppingBag className="h-5 w-5" />
          <span>All Orders</span>
        </button>
      );
    } else {
      return (
        <button
          onClick={() => onNavigate("companyOrders")}
          className={`flex items-center justify-center w-full px-2 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 ${activeTab === "companyOrders"
            ? "bg-white/40 text-white shadow-lg"
            : "text-gray-300 hover:bg-white/5 hover:text-white"
            }`}
        >
          <ShoppingBag className="h-5 w-5" />
        </button>
      );
    }
  }
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
          className={`flex items-center justify-between w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive
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
            {showMasterOrders && (
              <button
                onClick={() => onNavigate("masterOrders")}
                className={`flex items-center gap-3 w-full px-4 py-2 text-sm rounded-lg transition ${activeTab === "masterOrders"
                  ? "bg-white/20 text-white font-semibold"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <FileText className="h-4 w-4" />
                Master Orders
              </button>
            )}
            <button
              onClick={() => onNavigate("companyOrders")}
              className={`flex items-center gap-3 w-full px-4 py-2 text-sm rounded-lg transition ${activeTab === "companyOrders"
                ? "bg-white/20 text-white font-semibold"
                : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
            >
              <ListOrdered className="h-4 w-4" />
              All Orders
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ordersRef}>
      <button
        onClick={() => setCollapsedOrdersOpen(!collapsedOrdersOpen)}
        className={`flex items-center justify-center w-full px-2 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 ${activeTab === "masterOrders" || activeTab === "companyOrders"
          ? "bg-white/40 text-white shadow-lg"
          : "text-gray-300 hover:bg-white/5 hover:text-white"
          }`}
      >
        <ShoppingBag className="h-5 w-5" />
      </button>

      {collapsedOrdersOpen && (
        <div className="absolute left-full top-0 ml-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
          {showMasterOrders && (
            <button
              onClick={() => {
                onNavigate("masterOrders");
                setCollapsedOrdersOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition ${activeTab === "masterOrders"
                ? "bg-indigo-50 text-indigo-700 font-medium"
                : "text-gray-700 hover:bg-gray-50"
                }`}
            >
              <FileText className="h-4 w-4 text-gray-500" />
              Master Orders
            </button>
          )}
          <button
            onClick={() => {
              onNavigate("companyOrders");
              setCollapsedOrdersOpen(false);
            }}
            className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition ${activeTab === "companyOrders"
              ? "bg-indigo-50 text-indigo-700 font-medium"
              : "text-gray-700 hover:bg-gray-50"
              }`}
          >
            <Building2 className="h-4 w-4 text-gray-500" />
            Company Orders
          </button>
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companiesList, setCompaniesList] = useState<any[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  //  const mainContentRef = useRef<HTMLDivElement>(null);
  const scrollableRef = useRef<HTMLDivElement>(null);
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
  // Handle refresh data - refresh current tab only
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Increment refreshKey to force re-render of current component
      setRefreshKey(prev => prev + 1);
      // Small delay to show animation
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch companies list to get company logo
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { getCompanies } = await import("../../services/api");
        const response = await getCompanies({ page_size: 100 });
        setCompaniesList(response.data.results || []);
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      }
    };
    fetchCompanies();
  }, []);

  // Update company logo when company changes
  useEffect(() => {
    if (!company?.slug || !companiesList.length) {
      setCompanyLogo(null);
      return;
    }
    const foundCompany = companiesList.find((c: any) => c.slug === company.slug);
    setCompanyLogo(foundCompany?.logo || null);
  }, [company, companiesList]);

  // Handle scroll event for header color change
  useEffect(() => {
    const scrollableElement = scrollableRef.current;
    if (!scrollableElement) return;

    const handleScroll = () => {
      if (scrollableElement.scrollTop > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    scrollableElement.addEventListener("scroll", handleScroll);
    return () => scrollableElement.removeEventListener("scroll", handleScroll);
  }, []);
  const renderContent = () => {
    const companyKey = company?.slug || "super";
    // Create a unique key that changes on refresh to force re-render
    const componentKey = `${companyKey}-${refreshKey}`;

    // Wrap each content component with ReadOnlyContext provider
    const content = (() => {
      switch (activeTab) {
        case "overview":
          return <Overview key={componentKey} onNavigate={navigateFromOverview} />;
        case "products":
          return <CompanyProducts key={componentKey} />;
        case "users":
          return <CompanyUsers key={componentKey} />;
        case "masterOrders":
          return <MasterOrders key={componentKey} />;
        case "companyOrders":
          return <CompanyOrders key={componentKey} />;
        case "payments":
          return <Payments key={componentKey} />;
        case "profile":
          return <AdminProfile key={componentKey} />;
        case "categories":
          return <CategoryManagement key={componentKey} />;
        case "subcategories":
          return <SubCategoryManagement key={componentKey} />;
        case "superUsers":
          return <SuperAdminUsers />;
        case "add advertisment":
          return <AdManagement />;
        case "companies":
          return <CompanyManagement key={componentKey} />;

        default:
          return <Overview key={componentKey} onNavigate={navigateFromOverview} />;
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
          className={`mx-2 mt-2 px-3 py-2 border-b border-gray-800 rounded-2xl ${sidebarCollapsed ? "flex justify-center" : "flex items-center gap-2"}`}
        >
          {/* Logo - Always visible, left side when expanded, centered when collapsed */}
          <div className={`bg-white/10 p-1 rounded-full backdrop-blur-sm flex-shrink-0 ${sidebarCollapsed ? "w-10 h-10" : "w-18 h-18"}`}>
            <img
              src="/qinemartethio.jpeg"
              alt="Qine Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          
          {/* Branding Text - Only visible when sidebar is NOT collapsed */}
          {!sidebarCollapsed && (
            <div className="px-2 py-1 rounded-md bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-1">
                <div className="w-0.5 h-2 rounded-full bg-gradient-to-b from-amber-400 to-amber-600"></div>
                <span className="text-[10px] font-bold text-white/80 tracking-wide whitespace-nowrap">
                  ACTIVE MART
                </span>
                <div className="w-0.5 h-2 rounded-full bg-gradient-to-b from-amber-600 to-amber-400"></div>
              </div>
            </div>
          )}
          
          {/* Close button for mobile - only visible when not collapsed */}
          {!sidebarCollapsed && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white transition ml-auto"
            >
              <X className="h-5 w-5" />
            </button>
          )}
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
                className={`px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-8 ${sidebarCollapsed ? "hidden" : ""
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
                icon={<Proportions className="h-5 w-5" />}
                label="SubCategories"
                active={activeTab === "subcategories"}
                collapsed={sidebarCollapsed}
                onClick={() => navigate("subcategories")}
              />
            </>
          )}

          <SidebarItem
            icon={<Building2 className="h-5 w-5" />}
            label={!user?.memberships?.length ? "Companies" : "Company Detail"}
            active={activeTab === "companies"}
            collapsed={sidebarCollapsed}
            onClick={() => navigate("companies")}
          />
          {showPlatformAdmin && (
            <SidebarItem
              icon={<Users className="h-5 w-5" />}
              label="User Management"
              active={activeTab === "superUsers"}
              collapsed={sidebarCollapsed}
              onClick={() => navigate("superUsers")}
            />
          )}
          {showPlatformAdmin && (
            <SidebarItem
              icon={<Users className="h-5 w-5" />}
              label="Ads Management"
              active={activeTab === "add advertisment"}
              collapsed={sidebarCollapsed}
              onClick={() => navigate("add advertisment")}
            />
          )}

          <div
            className={`px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-8 ${sidebarCollapsed ? "hidden" : ""
              }`}
          >
            Management
          </div>

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
            icon={<Package className="h-5 w-5" />}
            label="All Products"
            active={activeTab === "products"}
            collapsed={sidebarCollapsed}
            onClick={() => navigate("products")}
          />
          {/* Only for super admin (not viewer) */}


          {/* {!hideUsersSidebar && ( */}
          <SidebarItem
            icon={<Users className="h-5 w-5" />}
            label="All Users"
            active={activeTab === "users"}
            collapsed={sidebarCollapsed}
            onClick={() => navigate("users")}
          />
          {/* )} */}

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

        <div
          className="mx-2 mb-2 p-2 flex justify-end"
          style={{
            borderTop: "1px solid rgba(31, 41, 55, 0.5)",
            borderRadius: "16px",
          }}
        >
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
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        <header className={`h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 transition-all duration-500 flex-shrink-0 ${isScrolled
          ? "bg-purple-100/90 shadow-xl border-b border-purple-200"
          : "bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm"
          }`}>
          <div className="flex items-center gap-4 flex-1">
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
                  <div className="w-px h-4 bg-indigo-200 mx-1"></div>
                  <div className="flex items-center">
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shadow-sm">
                      Full Control
                    </span>
                  </div>
                </div>
              </div>
            )}
            {/* Company name – show for non‑super‑admin (including viewer) */}
            {company && !isSuperAdmin && (
              <div className="hidden sm:flex sm:items-center sm:gap-3 group cursor-default">
                <div className="relative flex-shrink-0 group">
                  {/* Outer glow effect */}
                  <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-[#6750A4] via-[#9b87f5] to-[#6750A4] opacity-50 blur-lg group-hover:opacity-100 transition duration-500"></div>
                  {/* Animated gradient border */}
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-[#6750A4] via-[#c4b5fd] to-[#6750A4] animate-spin-slow" style={{ animationDuration: '3s' }}></div>
                  {/* Logo container - Modern Squircle */}
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-white/95 to-gray-100/95 backdrop-blur-sm flex items-center justify-center shadow-2xl border-2 border-[#6750A4]/50 shadow-[0_0_10px_rgba(103,80,164,0.3)] p-1">
                    {companyLogo ? (
                      <img
                        src={companyLogo}
                        alt={company.name}
                        className="w-full h-full rounded-xl object-cover shadow-md"
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#6750A4] to-[#7c63b8] flex items-center justify-center shadow-inner">
                        <Building2 className="w-6 h-6 text-white drop-shadow-sm" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-lg font-black text-indigo-700 truncate max-w-[180px] md:max-w-[240px] lg:max-w-[300px] tracking-tight" title={company.name}>
                      {company.name}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border shadow-sm ${company.role === "admin"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : company.role === "staff"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : company.role === "viewer"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}>
                      {company.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#6750A4]"></div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Active Company
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <RefreshButton
              onRefresh={handleRefresh}
              isLoading={isRefreshing}
            />
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center gap-3 group focus:outline-none cursor-pointer hover:bg-gradient-to-r hover:from-[#6750A4]/5 hover:to-transparent rounded-xl p-4 transition-all duration-300 ${profileDropdownOpen ? "bg-gradient-to-r from-[#6750A4]/10 to-transparent" : ""}`}
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
                <div className="relative">
                  {/* Pulsing ring effect */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#6750A4] to-[#9b87f5] opacity-75 blur-sm animate-pulse"></div>
                  {/* Outer ring - secondary color */}
                  <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#6750A4] to-[#7c63b8] opacity-100"></div>
                  {/* Avatar container */}
                  <div className="relative h-11 w-11 rounded-full bg-gradient-to-br from-white to-gray-50 flex items-center justify-center shadow-xl border-2 border-[#6750A4] p-0.5 group-hover:scale-110 transition-all duration-300">
                    <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-[#6750A4] to-[#7c63b8]">
                      {user?.profile_image ? (
                        <img
                          src={user.profile_image}
                          alt={user?.username || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm uppercase">
                            {user?.username?.[0] || user?.first_name?.[0] || "A"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

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
          </div>
        </header>
        {/* add div and padding - scrollable content area */}

        <div ref={scrollableRef} className="flex-1 overflow-y-auto p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <LogOut className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Sign Out</h3>
              </div>
              <p className="text-gray-500 mt-2 ml-13">
                Are you sure you want to sign out of your account?
              </p>
            </div>

            {/* Modal Body */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl text-sm font-medium hover:from-red-700 hover:to-rose-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
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
      className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group ${active
        ? "bg-white/40 text-white shadow-lg"
        : "text-gray-300 hover:bg-white/5 hover:text-white"
        } ${collapsed ? "justify-center px-2" : ""}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </button>
  );
}
