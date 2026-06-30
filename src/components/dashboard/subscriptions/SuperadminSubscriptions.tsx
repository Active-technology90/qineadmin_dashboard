import React, { useState, useEffect } from "react";
import { Plus, Edit, CheckCircle2, XCircle, CreditCard, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  getAdminSubscriptionPlans,
  getAdminCompanySubscriptions,
  createAdminSubscriptionPlan,
  updateAdminSubscriptionPlan,
} from "../../../services/api";

export default function SuperadminSubscriptions() {
  const [plans, setPlans] = useState<any[]>([]);
  const [companySubscriptions, setCompanySubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    can_ad_company_detail: true,
    can_ad_companies_list: false,
    can_ad_home_page: false,
    max_featured_products: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, subsRes] = await Promise.all([
        getAdminSubscriptionPlans(),
        getAdminCompanySubscriptions(),
      ]);
      setPlans(plansRes.data?.results || plansRes.data || []);
      setCompanySubscriptions(subsRes.data?.results || subsRes.data || []);
    } catch (error) {
      console.error("Error fetching admin subscription data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: parseFloat(plan.price),
      can_ad_company_detail: plan.can_ad_company_detail,
      can_ad_companies_list: plan.can_ad_companies_list,
      can_ad_home_page: plan.can_ad_home_page,
      max_featured_products: plan.max_featured_products,
      is_active: plan.is_active,
    });
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      can_ad_company_detail: true,
      can_ad_companies_list: false,
      can_ad_home_page: false,
      max_featured_products: 0,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await updateAdminSubscriptionPlan(editingPlan.id, formData);
      } else {
        await createAdminSubscriptionPlan(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving plan", error);
      alert("Failed to save plan. Please check the inputs.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-10 max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-10">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-secondary">Subscription Management</h1>
        <p className="text-xs sm:text-sm text-secondary/70 mt-0.5 sm:mt-1 md:mt-2">Manage pricing tiers and view active company subscriptions.</p>
      </div>

      {/* Subscription Plans Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-secondary flex items-center gap-1.5 sm:gap-2">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" /> 
            <span>Subscription Plans</span>
          </h2>
          <button
            onClick={handleCreateClick}
            className="bg-secondary text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-sm font-medium flex items-center gap-1 sm:gap-2 hover:bg-secondary-dark transition-all"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
            New Plan
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] xs:text-xs uppercase tracking-wider">
                <th className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium">Plan Name</th>
                <th className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium">Price</th>
                <th className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium hidden xs:table-cell">Featured Limit</th>
                <th className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium text-center hidden sm:table-cell">Detail Ad</th>
                <th className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium text-center hidden lg:table-cell">List Ad</th>
                <th className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium text-center hidden xl:table-cell">Home Ad</th>
                <th className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium text-center hidden sm:table-cell">Status</th>
                <th className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-bold text-gray-900">{plan.name}</td>
                  <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium">{plan.price}</td>
                  <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 hidden xs:table-cell">{plan.max_featured_products === -1 ? 'Unlimited' : plan.max_featured_products}</td>
                  <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center hidden sm:table-cell">
                    {plan.can_ad_company_detail ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />}
                  </td>
                  <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center hidden lg:table-cell">
                    {plan.can_ad_companies_list ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />}
                  </td>
                  <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center hidden xl:table-cell">
                    {plan.can_ad_home_page ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />}
                  </td>
                  <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center hidden sm:table-cell">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${plan.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-right">
                    <button
                      onClick={() => handleEditClick(plan)}
                      className="p-1 xs:p-1.5 text-gray-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Company Subscriptions Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-3 sm:p-4 md:p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-secondary flex items-center gap-1.5 sm:gap-2">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" /> 
            <span>Active Company Subscriptions</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] xs:text-xs uppercase tracking-wider">
                <th className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium">Company</th>
                <th className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium">Plan</th>
                <th className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium">Start Date</th>
                <th className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium">End Date</th>
                <th className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium">Featured Override</th>
                <th className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {companySubscriptions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No active subscriptions found.</td>
                </tr>
              )}
              {companySubscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-bold text-gray-900 text-xs sm:text-sm truncate max-w-[60px] xs:max-w-[80px] sm:max-w-none">{sub.company_name}</td>
                  <td className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium">
                    <span className="bg-indigo-100 text-indigo-700 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md text-[9px] xs:text-xs font-semibold">{sub.plan.name}</span>
                  </td>
                  <td className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-gray-500 text-[10px] xs:text-xs sm:text-sm">{new Date(sub.start_date).toLocaleDateString()}</td>
                  <td className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-gray-500 text-[10px] xs:text-xs sm:text-sm">{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : 'Lifetime'}</td>
                  <td className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-xs sm:text-sm">{sub.custom_max_featured_products !== null ? sub.custom_max_featured_products : '-'}</td>
                  <td className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3">
                    <span className={`px-1.5 xs:px-2 py-0.5 xs:py-1 text-[8px] xs:text-[10px] font-bold rounded-full uppercase tracking-wider ${sub.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {sub.is_active ? 'Active' : 'Expired'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-secondary">
                {editingPlan ? 'Edit Subscription Plan' : 'New Subscription Plan'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="plan-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-secondary/80 mb-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
                    placeholder="e.g. Professional"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-secondary/80 mb-1">Price (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-secondary/80 mb-1">Max Featured Products</label>
                  <input
                    type="number"
                    required
                    value={formData.max_featured_products}
                    onChange={(e) => setFormData({ ...formData, max_featured_products: parseInt(e.target.value, 10) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
                    help-text="Use -1 for unlimited"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use 0 for none, -1 for unlimited.</p>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs sm:text-sm font-medium text-secondary/80 mb-2 border-b pb-1">Ad Placements Allowed</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.can_ad_company_detail}
                      onChange={(e) => setFormData({ ...formData, can_ad_company_detail: e.target.checked })}
                      className="w-4 h-4 text-secondary rounded border-gray-300 focus:ring-secondary"
                    />
                    <span className="text-xs sm:text-sm text-secondary/70">Company Detail Page</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.can_ad_companies_list}
                      onChange={(e) => setFormData({ ...formData, can_ad_companies_list: e.target.checked })}
                      className="w-4 h-4 text-secondary rounded border-gray-300 focus:ring-secondary"
                    />
                    <span className="text-sm">Companies List Page</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.can_ad_home_page}
                      onChange={(e) => setFormData({ ...formData, can_ad_home_page: e.target.checked })}
                      className="w-4 h-4 text-secondary rounded border-gray-300 focus:ring-secondary"
                    />
                    <span className="text-sm">Home Page</span>
                  </label>
                </div>

                <div className="pt-4 border-t mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-secondary rounded border-gray-300 focus:ring-secondary"
                    />
                    <span className="text-xs sm:text-sm font-bold text-secondary">Plan is Active</span>
                  </label>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="plan-form"
                className="px-6 py-2.5 rounded-xl bg-secondary text-white font-medium hover:bg-secondary-dark shadow-sm transition-colors"
              >
                Save Plan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
