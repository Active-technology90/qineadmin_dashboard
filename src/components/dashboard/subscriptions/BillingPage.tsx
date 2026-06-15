import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, Zap, Package, XCircle } from "lucide-react";
import { getSubscriptionPlans, getMySubscription } from "../../../services/api";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: string;
  can_ad_company_detail: boolean;
  can_ad_companies_list: boolean;
  can_ad_home_page: boolean;
  max_featured_products: number;
}

interface ActiveSubscription {
  id: number;
  plan: SubscriptionPlan;
  start_date: string;
  end_date: string;
  is_active: boolean;
  allowed_max_featured_products: number;
  current_featured_products?: number;
}

export default function BillingPage() {
  const { company } = useCurrentCompany();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [company?.slug]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [plansRes, subRes] = await Promise.all([
        getSubscriptionPlans(),
        getMySubscription(company?.slug),
      ]);
      setPlans(plansRes.data?.results || plansRes.data || []);
      setActiveSub(subRes.data);
    } catch (error) {
      console.error("Failed to load billing data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = (planId: number) => {
    alert(`Chapa Payment Integration for plan ${planId} coming soon!`);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-500 mt-2">Manage your company's active plan and limits.</p>
      </div>

      {/* Current Subscription Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 p-16 bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-bl-[100px] -z-0"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-1">
              Current Plan
            </h2>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black bg-gradient-to-r from-secondary to-indigo-600 bg-clip-text text-transparent">
                {activeSub?.plan?.name ? activeSub.plan.name : "Free / Starter"}
              </span>
              {activeSub && (
                <span className="mb-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                  Active until {new Date(activeSub.end_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 min-w-[250px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Package className="w-4 h-4" /> Featured Products
              </span>
              <span className="text-sm font-bold text-gray-900">
                {activeSub?.current_featured_products || 0} / {activeSub?.allowed_max_featured_products || 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full ${
                  (activeSub?.current_featured_products || 0) >= (activeSub?.allowed_max_featured_products || 0) 
                    ? 'bg-red-500' 
                    : 'bg-secondary'
                }`}
                style={{ 
                  width: `${Math.min(100, ((activeSub?.current_featured_products || 0) / Math.max(1, activeSub?.allowed_max_featured_products || 1)) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Plans Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500" /> Upgrade Your Plan
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -8 }}
              className={`bg-white rounded-3xl p-8 border-2 transition-all shadow-sm hover:shadow-xl relative flex flex-col ${
                activeSub?.plan?.id === plan.id ? "border-secondary ring-4 ring-secondary/10" : "border-gray-100"
              }`}
            >
              {activeSub?.plan?.id === plan.id && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                  CURRENT PLAN
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-gray-500 text-sm mt-2 min-h-[40px]">{plan.description}</p>
              
              <div className="my-6">
                <span className="text-4xl font-black text-gray-900">{parseFloat(plan.price) === 0 ? "Free" : `${plan.price} ETB`}</span>
                {parseFloat(plan.price) > 0 && <span className="text-gray-500">/mo</span>}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Can feature up to {plan.max_featured_products} products</span>
                </li>
                <li className="flex items-start gap-3">
                  {plan.can_ad_company_detail ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${plan.can_ad_company_detail ? "text-gray-700" : "text-gray-400 line-through"}`}>
                    Ads on Company Detail Page
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  {plan.can_ad_companies_list ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${plan.can_ad_companies_list ? "text-gray-700" : "text-gray-400 line-through"}`}>
                    Ads on Companies List Page
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  {plan.can_ad_home_page ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${plan.can_ad_home_page ? "text-gray-700" : "text-gray-400 line-through"}`}>
                    Premium Homepage Ads
                  </span>
                </li>
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={activeSub?.plan?.id === plan.id}
                className={`w-full py-3.5 rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${
                  activeSub?.plan?.id === plan.id
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-secondary to-indigo-600 text-white hover:shadow-lg hover:from-secondary-dark hover:to-indigo-700"
                }`}
              >
                <CreditCard className="w-5 h-5" />
                {activeSub?.plan?.id === plan.id ? "Current Plan" : "Subscribe Now"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
