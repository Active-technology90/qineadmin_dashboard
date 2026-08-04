import React, { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  Search,
  X,
  Plus,
  Minus,
  User,
  Briefcase,
  ArrowRightLeft,
  CheckCircle,
  Layers,
} from "lucide-react";
import {
  fetchProviders,
  fetchServices,
  updateService,
  type ServiceProvider,
  type Service,
} from "../../../mock/serviceApi";
import { Toast } from "../../ui/Toast";
import { useToast } from "../../../hooks/useToast";

export default function ProviderServicesManagement() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [search, setSearch] = useState("");
  const { toast, showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([fetchProviders(), fetchServices()]);
      setProviders(p);
      setServices(s);
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Get services linked to the selected provider
  const linkedServices = useMemo(() => {
    if (!selectedProvider) return [];
    return services.filter(s => s.provider_id === selectedProvider.id);
  }, [selectedProvider, services]);

  // Available services that are not linked to any provider (or linked to another)
  const availableServices = useMemo(() => {
    return services.filter(s => s.provider_id !== selectedProvider?.id);
  }, [selectedProvider, services]);

  const handleAssign = async (service: Service) => {
    try {
      await updateService(service.slug, {
        provider_id: selectedProvider!.id,
        provider_name: selectedProvider!.businessName,
      });
      showToast("success", `${service.title} assigned to ${selectedProvider!.businessName}`);
      loadData(); // refresh
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  const handleUnassign = async (service: Service) => {
    try {
      await updateService(service.slug, {
        provider_id: null,
        provider_name: "",
      });
      showToast("success", `${service.title} unassigned from provider`);
      loadData();
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  const handleBulkAssign = async () => {
    // Example: assign all currently filtered available services (optional)
    // We'll just show a toast for now; you can implement checkbox selection.
    showToast("info", "Bulk assignment not implemented in this demo.");
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Provider Services</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage which services are offered by each provider.
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Provider List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50/80">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Briefcase size={18} /> Providers
              </h3>
            </div>
            <div className="p-2 space-y-1 max-h-[70vh] overflow-y-auto">
              {providers.map(provider => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-left ${
                    selectedProvider?.id === provider.id
                      ? "bg-secondary/10 text-secondary shadow-sm"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="h-9 w-9 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                    {provider.businessName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{provider.businessName}</p>
                    <p className="text-xs text-gray-400">{provider.name}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {services.filter(s => s.provider_id === provider.id).length} services
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Services Panel */}
          <div className="lg:col-span-2 space-y-6">
            {selectedProvider ? (
              <>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-gray-50/80 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Layers size={18} /> Services offered by {selectedProvider.businessName}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {linkedServices.length} linked
                    </span>
                  </div>
                  <div className="p-4 space-y-3 max-h-[40vh] overflow-y-auto">
                    {linkedServices.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No services assigned yet.</p>
                    ) : (
                      linkedServices.map(svc => (
                        <div
                          key={svc.id}
                          className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">{svc.title}</p>
                            <p className="text-xs text-gray-500">{svc.slug}</p>
                          </div>
                          <button
                            onClick={() => handleUnassign(svc)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                            title="Remove"
                          >
                            <Minus size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Services */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-gray-50/80 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Available Services to Assign
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                      />
                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-4 space-y-2 max-h-[40vh] overflow-y-auto">
                    {availableServices
                      .filter(s =>
                        s.title.toLowerCase().includes(search.toLowerCase()) ||
                        s.slug.toLowerCase().includes(search.toLowerCase())
                      )
                      .map(svc => (
                        <div
                          key={svc.id}
                          className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">{svc.title}</p>
                            <p className="text-xs text-gray-500">{svc.slug}</p>
                          </div>
                          <button
                            onClick={() => handleAssign(svc)}
                            className="p-1.5 text-gray-400 hover:text-emerald-500 rounded-lg hover:bg-emerald-50"
                            title="Assign"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ))}
                    {availableServices.length === 0 && (
                      <p className="text-sm text-gray-400 italic">
                        All services are already assigned.
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50">
                <div className="text-center">
                  <User className="h-10 w-10 text-gray-400 mx-auto" />
                  <p className="mt-3 text-sm text-gray-500">
                    Select a provider to manage their services.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}