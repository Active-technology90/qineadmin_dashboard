import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Settings as SettingsIcon,
  BarChart3,
  Building2,
  CreditCard,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { RefreshButton } from "../ui/RefreshButton";
import NotificationBell from "./notifications/NotificationBell";
import { NotificationsProvider } from "../../context/NotificationsContext";
import NotificationsPage from "./notifications/NotificationsPage";
import MarketingDashboard from "../../pages/MarketingDashboard";
import MarketerToggle from "../MarketerToggle";
import BillingPage from "./subscriptions/BillingPage";
import AdminProfile from "./AdminProfile";  
import SettingsPage from "./settings/Settings";  

type Tab = "marketing" | "profile" | "settings" | "billing";

export default function MarketerDashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("marketing");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const scrollableRef = React.useRef<HTMLDivElement>(null);

  const navigateTo = (tab: Tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
    setProfileDropdownOpen(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setRefreshKey((prev) => prev + 1);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogoutClick = () => {
    setProfileDropdownOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

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
    switch (activeTab) {
      case "marketing":
        return <MarketingDashboard key={refreshKey} />;
      case "profile":
        return <AdminProfile key={refreshKey} />;
      case "settings":
        return <SettingsPage key={refreshKey} />;
      case "billing":
        return <BillingPage key={refreshKey} />;
      default:
        return <MarketingDashboard key={refreshKey} />;
    }
  };

 return (
  <NotificationsProvider>
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
          bg-sidebar-gradient
          ${sidebarCollapsed ? "w-20" : "w-72"}
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo & title */}
        <div
          className={`mx-2 mt-2 px-3 py-2 border-b border-gray-800 rounded-2xl ${sidebarCollapsed ? "flex justify-center" : "flex items-center gap-2"}`}
        >
          <div
            className={`bg-white/10 p-1 rounded-full backdrop-blur-sm flex-shrink-0 ${sidebarCollapsed ? "w-10 h-10" : "w-18 h-18"}`}
          >
            <img
              src="/qinemartethio.jpeg"
              alt="Qine Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

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
          {/* Dashboard */}
          <SidebarItem
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="My Registrations"
            active={activeTab === "marketing"}
            collapsed={sidebarCollapsed}
            onClick={() => navigateTo("marketing")}
          />

          <div
            className={`px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-8 ${sidebarCollapsed ? "hidden" : ""
              }`}
          >
            Quick Actions
          </div>

          {/* Register New Company */}
          <SidebarItem
            icon={<Building2 className="h-5 w-5" />}
            label="Register Company"
            active={false}
            collapsed={sidebarCollapsed}
            onClick={() => navigate("/register-company")}
          />

          <div
            className={`px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-8 ${sidebarCollapsed ? "hidden" : ""
              }`}
          >
            Account
          </div>

          <SidebarItem
            icon={<Bell className="h-5 w-5" />}
            label="Notifications"
            active={activeTab === "notifications"}
            collapsed={sidebarCollapsed}
            onClick={() => navigateTo("notifications")}
          />

          <SidebarItem
            icon={<CreditCard className="h-5 w-5" />}
            label="Billing"
            active={activeTab === "billing"}
            collapsed={sidebarCollapsed}
            onClick={() => navigateTo("billing")}
          />

          <SidebarItem
            icon={<Users className="h-5 w-5" />}
            label="Profile"
            active={activeTab === "profile"}
            collapsed={sidebarCollapsed}
            onClick={() => navigateTo("profile")}
          />

          <SidebarItem
            icon={<SettingsIcon className="h-5 w-5" />}
            label="Settings"
            active={activeTab === "settings"}
            collapsed={sidebarCollapsed}
            onClick={() => navigateTo("settings")}
          />

          <button
            onClick={handleLogoutClick}
            className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group text-red-300 hover:bg-red-500/10 hover:text-red-200 ${
              sidebarCollapsed ? "justify-center px-2" : ""
            }`}
          >
            <LogOut className="h-5 w-5 text-red-300 group-hover:text-red-200" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
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
        <header
          className={`h-14 md:h-20 flex items-center justify-between px-0 md:px-6 lg:px-10 sticky top-0 z-30 transition-all duration-500 flex-shrink-0 ${isScrolled
              ? "bg-secondary/10 shadow-xl border-b border-secondary/20"
              : "bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm"
            }`}
        >
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  Role:
                </span>
                <span className="text-sm font-black bg-gradient-to-r from-purple-600 to-secondary bg-clip-text text-transparent">
                  Marketer
                </span>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shadow-sm">
                  Registration Mode
                </span>
              </div>
            </div>
          </div>

{/* Right side buttons */}
<div className="flex items-center gap-3">
  {/* Marketer Mode Toggle - Switch back to Admin Mode */}
  <MarketerToggle />  {/* ADDED: Import and use MarketerToggle */}
  {/* <NotificationBell onViewAll={() => navigateTo("notifications")} /> */}
  <RefreshButton onRefresh={handleRefresh} isLoading={isRefreshing} />
  {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center gap-3 group focus:outline-none cursor-pointer hover:bg-gradient-to-r hover:from-secondary/5 hover:to-transparent rounded-xl p-4 transition-all duration-300 ${profileDropdownOpen ? "bg-gradient-to-r from-secondary/10 to-transparent" : ""}`}
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
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-secondary to-indigo-500 opacity-75 blur-sm animate-pulse"></div>
                  <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-secondary to-secondary-dark opacity-100"></div>
                  <div className="relative h-11 w-11 rounded-full bg-gradient-to-br from-white to-gray-50 flex items-center justify-center shadow-xl border-2 border-secondary p-0.5 group-hover:scale-110 transition-all duration-300">
                    <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-secondary to-secondary-dark">
                      {user?.profile_image ? (
                        <img
                          src={user.profile_image}
                          alt={user?.username || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm uppercase">
                            {user?.username?.[0] ||
                              user?.first_name?.[0] ||
                              "A"}
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
                    </div>

                    <button
                      onClick={() => navigateTo("profile")}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group cursor-pointer"
                    >
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                        <Users className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">My Profile</p>
                      </div>
                    </button>

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

        <div ref={scrollableRef} className="flex-1 overflow-y-auto p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
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
  </NotificationsProvider>
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

