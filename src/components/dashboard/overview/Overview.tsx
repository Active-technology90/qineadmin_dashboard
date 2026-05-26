// src/components/admin/overview/Overview.tsx
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Package,
  Users,
  ShoppingBag,
  Building2,
  DollarSign,
} from "lucide-react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   LineChart,
//   Line,
// } from "recharts";
import { getAdminAnalyticsOverview } from "../../../services/api";
import type { AnalyticsOverviewResponse } from "../../../types";
// import { useReadOnly } from "./AdminDashboard";
import { useAuth } from "../../../hooks/useAuth";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { CompanySelect } from "./dropdowncompanyselector";
import ChartsSection from "./ChartsSection";
import OrdersTable from "./OrdersTable";
import { SummaryCard } from "./SummaryCard";
import { SkeletonCard } from "./LoadingStates";
import {
  formatCurrency,
  getStatusColor,
  CHART_COLORS,
} from "./uiHelpers";

const EMPTY_ANALYTICS: AnalyticsOverviewResponse = {
  scope: "company",
  selected_company: null,
  available_companies: [],
  summary: {
    company_total_count: 0,
    company_active_count: 0,
    products: 0,
    users: 0,
    orders: 0,
    payments_total: 0,
    avg_order_value: 0,
    success_rate: 0,
    active_categories: 0,
  },
  revenue_series: [],
  order_status: [],
  top_products: [],
  product_sales_trend: [],
  recent_orders: [],
};

type Period = "week" | "month" | "year";
export type DashboardTab = "products" | "masterOrders" | "companyOrders" | "payments" | "companies" | "allOrders" | "companyUser";

export default function Overview({
  onNavigate,
}: {
  onNavigate?: (tab: DashboardTab) => void;
}) {
  // const readOnly = useReadOnly();
  const { user } = useAuth();
  const isSuperAdmin = !user?.memberships?.length;
  const [period, setPeriod] = useState<Period>("week");
  const { company, switchCompany } = useCurrentCompany();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [analytics, setAnalytics] = useState<AnalyticsOverviewResponse>(EMPTY_ANALYTICS);
  const [companiesList, setCompaniesList] = useState<any[]>([]);
  // ADDED: Local state for non-super admin "All Companies" selection (does NOT affect global context)
  const [localAllCompaniesSelected, setLocalAllCompaniesSelected] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      setError("");
      try {
        const isAllCompanies = isSuperAdmin ? !company?.slug : localAllCompaniesSelected;

        if (isAllCompanies && isSuperAdmin && analytics.available_companies.length === 0) {
          try {
            const { data } = await getAdminAnalyticsOverview({
              period,
              company_slug: undefined,
            });
            if (data && data.available_companies) {
              setAnalytics(prev => ({
                ...prev,
                available_companies: data.available_companies,
              }));
            } else {
              return;
            }
          } catch (err) {
            console.error("Failed to fetch companies:", err);
            return;
          }
        }

        if (isAllCompanies && analytics.available_companies.length > 0) {
          let aggregated = {
            products: 0,
            users: 0,
            orders: 0,
            payments_total: 0,
            company_total_count: 0,
            revenue_series: [] as any[],
          };

          const fetchPromises = analytics.available_companies.map(async (company) => {
            try {
              const { data } = await getAdminAnalyticsOverview({
                period,
                company_slug: company.slug,
              });
              if (data && data.summary) {
                return {
                  products: data.summary.products || 0,
                  users: data.summary.users || 0,
                  orders: data.summary.orders || 0,
                  payments_total: data.summary.payments_total || 0,
                  success: true,
                };
              }
              return { success: false, products: 0, users: 0, orders: 0, payments_total: 0 };
            } catch (err) {
              console.error(`Failed to fetch data for ${company.slug}:`, err);
              return { success: false, products: 0, users: 0, orders: 0, payments_total: 0 };
            }
          });

          const results = await Promise.all(fetchPromises);

          for (const result of results) {
            if (result.success) {
              aggregated.products += result.products;
              aggregated.users += result.users;
              aggregated.orders += result.orders;
              aggregated.payments_total += result.payments_total;
              aggregated.company_total_count += 1;
            }
          }

          if (!active) return;

          const lastCompanyRes = await getAdminAnalyticsOverview({
            period,
            company_slug: analytics.available_companies[0]?.slug,
          });

          if (lastCompanyRes.data && lastCompanyRes.data.summary) {
            const modifiedAnalytics = { ...lastCompanyRes.data };
            modifiedAnalytics.summary = {
              ...modifiedAnalytics.summary,
              products: aggregated.products,
              users: aggregated.users,
              orders: aggregated.orders,
              payments_total: aggregated.payments_total,
              company_total_count: aggregated.company_total_count,
            };
            setAnalytics(modifiedAnalytics);
          }

        } else {
          let companyParam: string | undefined;
          if (isSuperAdmin) {
            companyParam = company?.slug || undefined;
          } else {
            companyParam = localAllCompaniesSelected ? undefined : (company?.slug || undefined);
          }

          const { data } = await getAdminAnalyticsOverview({
            period,
            company_slug: companyParam,
          });
          if (!active) return;

          if (data && data.summary) {
            setAnalytics(data);
          } else {
            setAnalytics(EMPTY_ANALYTICS);
          }
        }
      } catch (err: unknown) {
        if (!active) return;
        let detail = "Failed to load analytics.";
        if (
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail === "string"
        ) {
          detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail as string;
        }
        setError(detail);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAnalytics();
    return () => {
      active = false;
    };
  }, [period, company, analytics.available_companies.length, localAllCompaniesSelected, isSuperAdmin]);

  // Fetch companies list to get logos
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { getCompanies } = await import("../../../services/api");
        const response = await getCompanies({ page_size: 100 });
        setCompaniesList(response.data.results || []);
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      }
    };
    fetchCompanies();
  }, []);

  // For Super Admin: Fetch available companies when component mounts
  useEffect(() => {
    if (isSuperAdmin && analytics.available_companies.length === 0) {
      const fetchAvailableCompanies = async () => {
        try {
          const { data } = await getAdminAnalyticsOverview({
            period,
            company_slug: undefined,
          });
          if (data && data.available_companies) {
            setAnalytics(prev => ({
              ...prev,
              available_companies: data.available_companies,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch available companies for super admin:", error);
        }
      };
      fetchAvailableCompanies();
    }
  }, [isSuperAdmin, period]);

  // Reset local "All Companies" flag when global company changes (for non-super admin)
  useEffect(() => {
    if (!isSuperAdmin && company?.slug) {
      setLocalAllCompaniesSelected(false);
    }
  }, [company?.slug, isSuperAdmin]);

  // ==================== Memoized derived values ====================
  const currentData = analytics.revenue_series;
  const totalRevenue = useMemo(
    () => currentData?.reduce((s, d) => s + (d?.revenue || 0), 0) || 0,
    [currentData]
  );

  const summaryData = useMemo(() => {
    if (isSuperAdmin) {
      return {
        company_total_count: analytics.summary.company_total_count,
        company_active_count: analytics.summary.company_active_count,
        products: analytics.summary.products,
        users: analytics.summary.users,
        orders: analytics.summary.orders,
        payments: { total: analytics.summary.payments_total, change: 0 },
        avgOrderValue: analytics.summary.avg_order_value,
        conversionRate: analytics.summary.success_rate,
      };
    }
    return {
      company_total_count: 0,
      company_active_count: 0,
      products: analytics.summary.products,
      users: analytics.summary.users,
      orders: analytics.summary.orders,
      payments: { total: analytics.summary.payments_total, change: 0 },
      avgOrderValue: analytics.summary.avg_order_value,
      conversionRate: analytics.summary.success_rate,
    };
  }, [isSuperAdmin, analytics.summary]);

  const orderStatusData = useMemo(
    () =>
      analytics.order_status.map((item) => ({
        ...item,
        color: getStatusColor(item.name),
      })),
    [analytics.order_status]
  );

  const productSalesData = useMemo(
    () =>
      analytics.top_products.map((product, idx) => ({
        ...product,
        color: CHART_COLORS[idx % CHART_COLORS.length],
      })),
    [analytics.top_products]
  );

  const productTrendData = analytics.product_sales_trend;
  const topProductNames = useMemo(
    () =>
      productTrendData.length
        ? Object.keys(productTrendData[0]).filter((key) => key !== "month")
        : [],
    [productTrendData]
  );

  const recentOrders = analytics.recent_orders;

  const getCompanyLogoFromList = useCallback(
    (slug: string) => {
      if (!slug || slug === "") return null;
      const found = companiesList.find((c: any) => c.slug === slug);
      return found?.logo || null;
    },
    [companiesList]
  );

  const scopeOptions = useMemo(
    () => [
      { value: "", label: "All Companies", logo: null },
      ...analytics.available_companies.map((c) => ({
        value: c.slug,
        label: c.name,
        logo: getCompanyLogoFromList(c.slug),
      })),
    ],
    [analytics.available_companies, getCompanyLogoFromList]
  );

  const selectedCompanyName = useMemo(() => {
    if (isSuperAdmin) {
      return company?.name || "All Companies";
    }
    if (localAllCompaniesSelected) return "All Companies";
    return company?.name || (analytics.available_companies[0]?.name || "Select Company");
  }, [isSuperAdmin, company?.name, localAllCompaniesSelected, analytics.available_companies]);

  const selectedCompanyLogo = useMemo(() => {
    if (isSuperAdmin) {
      return company && company?.slug ? getCompanyLogoFromList(company.slug) : null;
    }
    if (localAllCompaniesSelected) return null;
    return company && company?.slug ? getCompanyLogoFromList(company.slug) : null;
  }, [isSuperAdmin, company, localAllCompaniesSelected, getCompanyLogoFromList]);

  const hasRevenueData = useMemo(
    () =>
      currentData.length > 0 &&
      currentData.some((item) => item.revenue > 0 || item.prevRevenue > 0),
    [currentData]
  );
  const hasOrderStatusData = useMemo(
    () =>
      orderStatusData.length > 0 &&
      orderStatusData.some((item) => item.value > 0),
    [orderStatusData]
  );
  const hasProductTrendData = useMemo(
    () =>
      productTrendData.length > 0 &&
      topProductNames.length > 0 &&
      productTrendData.some((row) =>
        topProductNames.some((name) => Number(row[name] ?? 0) > 0)
      ),
    [productTrendData, topProductNames]
  );
  const hasTopProductsData = useMemo(
    () =>
      productSalesData.length > 0 &&
      productSalesData.some((product) => product.sales > 0),
    [productSalesData]
  );

  const shouldShowCompanyDropdown = useMemo(() => {
    if (isSuperAdmin) return true;
    return analytics.available_companies.length >= 2;
  }, [isSuperAdmin, analytics.available_companies.length]);

  const handleCompanyChange = useCallback(
    (selectedSlug: string) => {
      if (selectedSlug === "") {
        if (isSuperAdmin) {
          switchCompany({
            slug: "",
            name: "All Companies",
            role: "",
          });
        } else {
          setLocalAllCompaniesSelected(true);
        }
      } else {
        const selected = analytics.available_companies.find((c) => c.slug === selectedSlug);
        if (selected) {
          const membership = user?.memberships?.find((m: any) => m.company_slug === selectedSlug);
          switchCompany({
            slug: selected.slug,
            name: selected.name,
            role: membership?.role || "viewer",
          });
          if (!isSuperAdmin) {
            setLocalAllCompaniesSelected(false);
          }
        }
      }
    },
    [isSuperAdmin, switchCompany, analytics.available_companies, user?.memberships]
  );

  // Determine skeleton card count
  const skeletonCount = isSuperAdmin && !company?.slug ? 4 : 3;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-4 xs:space-y-6 sm:space-y-8 px-1.5 xs:px-2 sm:px-4">
      {/* Scope selector */}
      {shouldShowCompanyDropdown && (
        <div className="bg-gradient-to-br from-white via-gray-50/50 to-white rounded-xl py-2.5 xs:py-3 px-2 xs:px-3 sm:px-5 shadow-md border border-gray-100/80">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 xs:gap-4">
            {/* Company Info */}
            {isSuperAdmin && (
              <div className="hidden sm:flex items-center gap-2 xs:gap-3 sm:gap-4 min-w-0">
                <div className="relative shrink-0">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary to-[#9b87f5] rounded-full blur opacity-70"></div>
                  <div className="absolute inset-0 rounded-full shadow-inner"></div>
                  {selectedCompanyLogo && company?.slug ? (
                    <div className="relative w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-full bg-white p-0.5 shadow-lg">
                      <img
                        src={selectedCompanyLogo}
                        alt={selectedCompanyName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="relative w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center shadow-lg">
                      <Building2 className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  )}
                </div>
              
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 xs:gap-2">
                    <div className="w-1 h-3 xs:h-4 rounded-full bg-gradient-to-b from-secondary to-[#9b87f5] shrink-0"></div>
                    <p className="text-[9px] xs:text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Currently Viewing
                    </p>
                  </div>
                  <h2 className="text-sm xs:text-lg sm:text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent truncate">
                    {selectedCompanyName}
                  </h2>
                  <div className="flex items-center gap-1 xs:gap-1.5 mt-0.5">
                    <div className="w-1 xs:w-1.5 h-1 xs:h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                    <p className="text-[8px] xs:text-[9px] font-medium text-gray-400 truncate">Active Dashboard</p>
                  </div>
                </div>
              </div>
            )}
            {/* Company selector */}
            <div className="flex items-center gap-2 xs:gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 flex-1 lg:flex-initial min-w-0">
                <span className="items-center gap-1.5 text-[10px] xs:text-xs font-semibold text-secondary uppercase tracking-wider hidden sm:flex shrink-0">
                  <Building2 className="h-3 w-3" />
                  Select Company
                </span>
                <div className="relative flex-1 lg:flex-initial min-w-0 max-w-full">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary hidden sm:block" />
                  <CompanySelect
                    scopeOptions={scopeOptions}
                    company={
                      scopeOptions.find((c: any) => c.value === company?.slug) || scopeOptions[0]
                    }
                    handleCompanyChange={handleCompanyChange}
                  />
                </div>
              </div>
              {/* View Only badge removed */}
            </div>
          </div>
          <div className="mt-2 xs:mt-3">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
          </div>
        </div>
      )}

      {!!error && (
        <div className="bg-red-50 text-red-700 border border-red-100 rounded-xl p-2.5 xs:p-3 text-xs xs:text-sm break-words">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 xs:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2 xs:gap-3 sm:gap-4">
        {loading ? (
          Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            {isSuperAdmin && !company?.slug && (
              <div
                onClick={() => onNavigate?.("companies")}
                className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <SummaryCard
                  title="Total Companies"
                  value={summaryData?.company_total_count?.toString() || "0"}
                  icon={Building2}
                  bgLight="bg-blue-50"
                  textColor="text-blue-600"
                />
              </div>
            )}
            <div
              onClick={() => onNavigate?.("companyOrders")}
              className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <SummaryCard
                title="Total Orders"
                value={summaryData?.orders?.toLocaleString() || "0"}
                icon={ShoppingBag}
                bgLight="bg-purple-50"
                textColor="text-purple-600"
              />
            </div>
            <div
              onClick={() => onNavigate?.("products")}
              className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <SummaryCard
                title="Total Products"
                value={summaryData?.products?.toLocaleString() || "0"}
                icon={Package}
                bgLight="bg-blue-50"
                textColor="text-blue-600"
              />
            </div>
            <div
              onClick={() => onNavigate?.("users")}
              className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <SummaryCard
                title="Company Users"
                value={summaryData?.users?.toLocaleString() || "0"}
                icon={Users}
                bgLight="bg-emerald-50"
                textColor="text-emerald-600"
              />
            </div>
            {!isSuperAdmin && (
              <div
                onClick={() => onNavigate?.("payments")}
                className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <SummaryCard
                  title="Total Payments"
                  value={summaryData?.payments?.total ? formatCurrency(summaryData.payments.total) : formatCurrency(0)}
                  icon={DollarSign}
                  bgLight="bg-amber-50"
                  textColor="text-amber-600"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Charts Section */}
      <ChartsSection
        loading={loading}
        period={period}
        setPeriod={setPeriod}
        totalRevenue={totalRevenue}
        hasRevenueData={hasRevenueData}
        hasOrderStatusData={hasOrderStatusData}
        hasProductTrendData={hasProductTrendData}
        hasTopProductsData={hasTopProductsData}
        currentData={currentData}
        orderStatusData={orderStatusData}
        productSalesData={productSalesData}
        productTrendData={productTrendData}
        topProductNames={topProductNames}
        onNavigate={onNavigate}
      />

      {/* Quick Stats Row (commented out, kept as is) */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> ... </div> */}

      {/* Recent Orders Table */}
      <OrdersTable
        loading={loading}
        recentOrders={recentOrders}
        onNavigate={onNavigate}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}