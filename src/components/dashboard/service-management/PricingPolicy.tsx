// src/components/admin/service-management/PricingPolicy.tsx
import React, { useEffect, useState } from "react";
import {
  Save,
  RefreshCw,
  RotateCcw,
  TrendingUp,
  DollarSign,
  Percent,
  ShoppingCart,
} from "lucide-react";
import {
  fetchPricingPolicy,
  updatePricingPolicy,
  type PricingPolicy,
} from "../../../mock/serviceApi";
import { Toast } from "../../ui/Toast";
import { useToast } from "../../../hooks/useToast";

const defaultPolicy: PricingPolicy = {
  commissionRate: 12,
  minServicePrice: 50,
  maxDiscount: 20,
  taxRate: 15,
};

export default function PricingPolicySettings({
  readOnly,
}: {
  readOnly?: boolean;
}) {
  const [policy, setPolicy] = useState<PricingPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast, showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchPricingPolicy();
      setPolicy(data);
      setHasChanges(false);
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (field: keyof PricingPolicy, value: string) => {
    if (!policy) return;
    const num = Number(value);
    if (isNaN(num)) return;
    setPolicy({ ...policy, [field]: num });
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    setPolicy({ ...defaultPolicy });
    setHasChanges(true);
  };

  const save = async () => {
    if (!policy) return;
    setSaving(true);
    try {
      await updatePricingPolicy(policy);
      showToast("success", "Pricing policy updated");
      setHasChanges(false);
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !policy) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl bg-white p-5 shadow-sm border border-gray-100"
            >
              <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
              <div className="h-8 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100">
              <Percent className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Commission</p>
              <p className="text-xl font-bold text-secondary">
                {policy.commissionRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Min Price</p>
              <p className="text-xl font-bold text-secondary">
                ETB {policy.minServicePrice}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Max Discount</p>
              <p className="text-xl font-bold text-secondary">
                {policy.maxDiscount}%
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-100">
              <ShoppingCart className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tax Rate</p>
              <p className="text-xl font-bold text-secondary">
                {policy.taxRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Edit Policy Settings
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Adjust global pricing rules that affect all services.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetToDefaults}
              disabled={readOnly}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              title="Reset to defaults"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={load}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Commission Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Percent size={16} className="text-purple-500" />
                Commission Rate
              </label>
              <span className="text-xs text-gray-500">
                {policy.commissionRate}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={policy.commissionRate}
              disabled={readOnly}
              onChange={(e) => handleChange("commissionRate", e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
            />
            <input
              type="number"
              disabled={readOnly}
              value={policy.commissionRate}
              onChange={(e) => handleChange("commissionRate", e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
            <p className="text-xs text-gray-400">
              The platform’s fee charged per completed order.
            </p>
          </div>

          {/* Min Service Price */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <DollarSign size={16} className="text-blue-500" />
                Minimum Service Price
              </label>
              <span className="text-xs text-gray-500">
                ETB {policy.minServicePrice}
              </span>
            </div>
            <input
              type="number"
              disabled={readOnly}
              value={policy.minServicePrice}
              onChange={(e) => handleChange("minServicePrice", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
            <p className="text-xs text-gray-400">
              Providers cannot list services below this amount.
            </p>
          </div>

          {/* Max Discount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <TrendingUp size={16} className="text-amber-500" />
                Maximum Discount Allowed
              </label>
              <span className="text-xs text-gray-500">
                {policy.maxDiscount}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              value={policy.maxDiscount}
              disabled={readOnly}
              onChange={(e) => handleChange("maxDiscount", e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
            />
            <input
              type="number"
              disabled={readOnly}
              value={policy.maxDiscount}
              onChange={(e) => handleChange("maxDiscount", e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400">
              Promotions and coupons cannot exceed this discount percentage.
            </p>
          </div>

          {/* Tax Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <ShoppingCart size={16} className="text-green-500" />
                Tax Rate
              </label>
              <span className="text-xs text-gray-500">
                {policy.taxRate}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={policy.taxRate}
              disabled={readOnly}
              onChange={(e) => handleChange("taxRate", e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
            />
            <input
              type="number"
              disabled={readOnly}
              value={policy.taxRate}
              onChange={(e) => handleChange("taxRate", e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400">
              Applied on top of the service price before checkout.
            </p>
          </div>
        </div>

        {!readOnly && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={save}
              disabled={!hasChanges || saving}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                hasChanges
                  ? "bg-secondary text-white hover:bg-secondary-dark shadow-md"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}