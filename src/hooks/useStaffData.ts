import { useState, useCallback, useEffect, useMemo } from "react";
import { getManageStaff, deleteStaff, updateStaff, getManageServiceOfferings } from "../services/api";
import type { ServiceStaff, ServiceOffering } from "../types";
import { extractErrorMessage } from "../utils/extractErrorMessage";
// import { extractErrorMessage } from "../../../utils/extractErrorMessage";

export const useStaffData = (companySlug: string | null) => {
  const [staff, setStaff] = useState<ServiceStaff[]>([]);
  const [offerings, setOfferings] = useState<ServiceOffering[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [editingStaff, setEditingStaff] = useState<ServiceStaff | null>(null);

  // Pagination & filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterService, setFilterService] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = useCallback(async () => {
    if (!companySlug) return;
    setLoading(true);
    try {
      const [staffRes, offeringsRes] = await Promise.allSettled([
        getManageStaff(companySlug),
        getManageServiceOfferings(companySlug),
      ]);
      if (staffRes.status === "fulfilled") {
        const raw = staffRes.value.data || [];
        const fixed = raw.map((s: ServiceStaff) => ({
          ...s,
          working_days: Array.isArray(s.working_days)
            ? s.working_days
            : typeof s.working_days === "number"
            ? [s.working_days]
            : [],
        }));
        setStaff(fixed);
      } else {
        setToast({ type: "error", message: "Failed to load staff" });
      }
      if (offeringsRes.status === "fulfilled") {
        setOfferings(offeringsRes.value.data || []);
      }
    } catch (err: any) {
      setToast({ type: "error", message: extractErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [companySlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = useCallback(async (id: number) => {
    if (!companySlug) return;
    try {
      await deleteStaff(companySlug, id);
      setToast({ type: "success", message: "Specialist removed." });
      fetchData();
    } catch (err: any) {
      setToast({ type: "error", message: extractErrorMessage(err) });
    }
  }, [companySlug, fetchData]);

  const handleEditStart = (member: ServiceStaff) => setEditingStaff(member);
  const handleEditCancel = () => setEditingStaff(null);
  const handleEditSuccess = () => {
    setEditingStaff(null);
    fetchData();
  };

  // Bulk actions
  const handleBulkAction = async (action: "activate" | "deactivate" | "delete", ids: number[]) => {
    if (!companySlug) return;
    try {
      if (action === "delete") {
        await Promise.all(ids.map((id) => deleteStaff(companySlug, id)));
        setToast({ type: "success", message: "Selected staff deleted." });
      } else {
        const isActive = action === "activate";
        await Promise.all(ids.map((id) => updateStaff(companySlug, id, { is_active: isActive })));
        setToast({ type: "success", message: `Staff ${isActive ? "activated" : "deactivated"}.` });
      }
      fetchData();
    } catch (err: any) {
      setToast({ type: "error", message: extractErrorMessage(err) });
    }
  };

  // Filter & paginate
  const filteredStaff = useMemo(() => {
    let list = staff;
    if (search) list = list.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
    if (filterStatus === "active") list = list.filter((s) => s.is_active);
    else if (filterStatus === "offline") list = list.filter((s) => !s.is_online && s.is_active);
    else if (filterStatus === "online") list = list.filter((s) => s.is_online);
    if (filterService) {
      const svcId = Number(filterService);
      list = list.filter((s) => !s.assigned_service_ids?.length || s.assigned_service_ids.includes(svcId));
    }
    return list;
  }, [staff, search, filterStatus, filterService]);

  const totalItems = filteredStaff.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, currentPage, pageSize]);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [search, filterStatus, filterService, pageSize]);

  // KPI calculations (using full staff)
  const today = new Date().getDay();
  const availableToday = staff.filter((s) => s.working_days?.includes(today) && s.is_online !== false).length;
  const offlineStaff = staff.filter((s) => s.is_online === false).length;
  const avgRating = staff.length > 0 ? staff.reduce((acc, s) => acc + (Number(s.average_rating) || 0), 0) / staff.length : 0;
  const totalAssignments = staff.reduce((sum, s) => sum + (s.assigned_service_ids?.length || 0), 0);
  const workingToday = staff.filter((s) => s.working_days?.includes(today)).length;

  return {
    staff: paginatedStaff,
    offerings,
    loading,
    toast,
    editingStaff,
    setEditingStaff,
    fetchData,
    handleDelete,
    handleEditStart,
    handleEditCancel,
    handleEditSuccess,
    handleBulkAction,
    availableToday,
    offlineStaff,
    avgRating,
    totalAssignments,
    workingToday,
    paginatedStaff,
    currentPage,
    totalPages,
    setCurrentPage,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterService,
    setFilterService,
    pageSize,
    setPageSize,
  };
};