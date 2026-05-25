import React, { useState, useEffect, useRef, } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  X,
  Search,
  LayoutDashboard,
  Activity,
  Image as ImageIcon,
  Globe,
  AlertTriangle,
  Upload,
  ChevronLeft,
  ChevronRight,
  MegaphoneOff,
  CircleCheck,
  CircleAlert,
  Info,
} from "lucide-react";
import { useReadOnly } from "./AdminDashboard";


// ----------------------------------------------------------------------
// Types – matches the system’s expected ad structure
// ----------------------------------------------------------------------
interface Ad {
  id: number;
  title: string;
  image: string;
  target_link?: string;
  target_pages: string[];
  is_active: boolean;
}

type ToastType = "success" | "error" | "info";

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

// ----------------------------------------------------------------------
// Toast System (self-contained)
// ----------------------------------------------------------------------
const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "info",
    visible: false,
  });
  let timeoutId: ReturnType<typeof setTimeout>;

  const showToast = (type: ToastType, message: string, duration = 3000) => {
    if (timeoutId) clearTimeout(timeoutId);
    setToast({ message, type, visible: true });
    timeoutId = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, duration);
  };

  const hideToast = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setToast((prev) => ({ ...prev, visible: false }));
  };

  return { toast, showToast, hideToast };
};

const Toast = ({
  toast,
  onHide,
}: {
  toast: ToastState;
  onHide: () => void;
}) => {
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => onHide(), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible, onHide]);

  if (!toast.visible) return null;

  const icons = {
    success: <CircleCheck className="w-5 h-5 text-emerald-500" />,
    error: <CircleAlert className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: "bg-white border-emerald-200",
    error: "bg-white border-red-200",
    info: "bg-white border-blue-200",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border ${bgColors[toast.type]} backdrop-blur-sm bg-white/90`}
    >
      {icons[toast.type]}
      <span className="text-sm font-medium text-gray-800">{toast.message}</span>
      <button
        onClick={onHide}
        className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

// ----------------------------------------------------------------------
// API Integration
// ----------------------------------------------------------------------
import { getAds, createAd, updateAd, deleteAd } from "../../services/api";

// ----------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------

const ITEMS_PER_PAGE = 6;

// ----------------------------------------------------------------------
// Reusable UI Components (inline, uses dashboard color #6750A4)
// ----------------------------------------------------------------------
const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  className?: string;
  disabled?: boolean;
}> = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled = false,
}) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";
    const variants = {
      primary:
        "bg-[#6750A4] text-white shadow-md hover:shadow-lg focus:ring-[#6750A4]",
      secondary:
        "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500",
      outline:
        "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
      ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-500",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-base",
    };
    return (
      <button
        type={type}
        onClick={onClick}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  };

const Input: React.FC<{
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}> = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  error,
}) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-2.5 border rounded-xl bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6750A4] transition-all ${error ? "border-red-300 focus:ring-red-500" : "border-gray-200"
          }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

const Badge: React.FC<{
  children: React.ReactNode;
  variant?: "active" | "inactive" | "info";
}> = ({ children, variant = "info" }) => {
  const styles = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-gray-100 text-gray-600",
    info: "bg-blue-100 text-blue-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
};

// ----------------------------------------------------------------------
// Stat Card
// ----------------------------------------------------------------------
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}> = ({ title, value, icon: Icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover:-translate-y-0.5"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-sm`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
);



// ----------------------------------------------------------------------
// Image Uploader with drag & drop and preview
// ----------------------------------------------------------------------
const ImageUploader: React.FC<{
  onFileChange: (file: File | null) => void;
  previewUrl?: string | null;
  existingImage?: string;
}> = ({ onFileChange, previewUrl, existingImage }) => {
  const [preview, setPreview] = useState<string | null>(
    previewUrl ||
      (existingImage
        ? existingImage.startsWith("http") || existingImage.startsWith("blob:")
          ? existingImage
          : existingImage.startsWith("/")
          ? `https://backend-qine.activetechet.com${existingImage}`
          : `https://backend-qine.activetechet.com/media/${existingImage}`
        : null)
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (previewUrl) {
      setPreview(previewUrl);
    } else if (existingImage) {
      if (existingImage.startsWith("http") || existingImage.startsWith("blob:")) {
        setPreview(existingImage);
      } else if (existingImage.startsWith("/")) {
        setPreview(`https://backend-qine.activetechet.com${existingImage}`);
      } else {
        setPreview(`https://backend-qine.activetechet.com/media/${existingImage}`);
      }
    } else {
      setPreview(null);
    }
  }, [previewUrl, existingImage]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    onFileChange(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const clearImage = () => {
    onFileChange(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Advertisement Image
      </label>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative w-full rounded-xl overflow-hidden transition-all duration-200 ${isDragging ? "ring-2 ring-[#6750A4] ring-offset-2 bg-[#6750A4]/5" : ""
          }`}
      >
        {!preview ? (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-gray-50 ${isDragging
                ? "border-[#6750A4] bg-[#6750A4]/5"
                : "border-gray-200"
              }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Drag & drop an image here, or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files?.[0] && handleFile(e.target.files[0])
              }
              className="hidden"
            />
          </div>
        ) : (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-56 object-cover rounded-xl shadow-sm"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/90 p-2 rounded-full text-gray-800 hover:bg-white"
              >
                Replace
              </button>
              <button
                onClick={clearImage}
                className="bg-white/90 p-2 rounded-full text-red-600 hover:bg-white"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Ad Card Component
// ----------------------------------------------------------------------
const AdCard: React.FC<{
  ad: Ad;
  onEdit: (ad: Ad) => void;
  onDelete: (ad: Ad) => void;
  getImageUrl: (url: string) => string;
  isReadOnly: boolean;
}> = ({ ad, onEdit, onDelete, getImageUrl, isReadOnly }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={getImageUrl(ad.image)}
          alt={ad.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4">
          <Badge variant={ad.is_active ? "active" : "inactive"}>
            {ad.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        {/* <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm text-gray-800 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          <Target className="w-3 h-3" />
          <span className="font-medium">
            {isAllPages
              ? "All Pages"
              : pageCount === 0
              ? "No Pages"
              : `${pageCount} page${pageCount > 1 ? "s" : ""}`}
          </span>
        </div> */}
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-xl text-gray-900 mb-1 truncate">
          {ad.title}
        </h3>
        {ad.target_link && (
          <a
            href={ad.target_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-[#6750A4] hover:underline gap-1 mb-4"
          >
            <Globe className="w-3.5 h-3.5" />{" "}
            {ad.target_link.replace(/^https?:\/\//, "")}
          </a>
        )}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(ad)}
            disabled={isReadOnly}
          >
            <Pencil className="w-4 h-4 mr-1" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(ad)}
            className="text-red-600 hover:bg-red-50"
            disabled={isReadOnly}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ----------------------------------------------------------------------
// Delete Confirmation Modal
// ----------------------------------------------------------------------
const DeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}> = ({ isOpen, onClose, onConfirm, title }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Delete Advertisement</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold">"{title}"</span>? This action cannot
            be undone.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirm}>
              Delete
            </Button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// ----------------------------------------------------------------------
// Create/Edit Modal
// ----------------------------------------------------------------------
const FormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  title: string;
  children: React.ReactNode;
  isSubmitting: boolean;
}> = ({ isOpen, onClose, onSubmit, title, children, isSubmitting }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl z-50"
        >
          <form onSubmit={onSubmit}>
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">{children}</div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Save
              </Button>
            </div>
          </form>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// ----------------------------------------------------------------------
// Search & Filter Bar
// ----------------------------------------------------------------------
const SearchFilterBar: React.FC<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: "all" | "active" | "inactive";
  onFilterChange: (status: "all" | "active" | "inactive") => void;
}> = ({ searchQuery, onSearchChange, filterStatus, onFilterChange }) => (
  <div className="sticky top-20 z-10 bg-gray-50/80 backdrop-blur-sm py-4 -mt-2 mb-4 rounded-2xl">
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search Ads by title..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6750A4] focus:border-transparent transition-all"
        />
      </div>
      <div className="flex gap-2">
        {(["all", "active", "inactive"] as const).map((status) => (
          <motion.button
            key={status}
            whileTap={{ scale: 0.97 }}
            onClick={() => onFilterChange(status)}
            className={`px-5 py-2 rounded-full capitalize text-sm font-medium transition-all ${filterStatus === status
                ? "bg-[#6750A4] text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
          >
            {status === "all"
              ? "All"
              : status === "active"
                ? "Active"
                : "Inactive"}
          </motion.button>
        ))}
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Pagination
// ----------------------------------------------------------------------
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-3 mt-10">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4" /> Previous
      </Button>
      <span className="text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

// ----------------------------------------------------------------------
// Empty State
// ----------------------------------------------------------------------
const EmptyState: React.FC<{ onCreateNew: () => void; isReadOnly: boolean }> = ({
  onCreateNew,
  isReadOnly,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200"
  >
    <MegaphoneOff className="mx-auto h-14 w-14 text-gray-300" />
    <h3 className="mt-4 text-base font-semibold text-gray-900">
      No advertisements yet
    </h3>
    <p className="mt-1 text-sm text-gray-500">
      Launch your first Advertisement to reach more customers.
    </p>
    {!isReadOnly && (
      <div className="mt-6">
        <Button onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-2" /> Create Advertisement
        </Button>
      </div>
    )}
  </motion.div>
);

// ----------------------------------------------------------------------
// Loading Skeleton
// ----------------------------------------------------------------------
const LoadingSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse"
      >
        <div className="h-52 bg-gray-200" />
        <div className="p-5 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="flex justify-end gap-2 pt-4">
            <div className="h-8 w-16 bg-gray-200 rounded-lg" />
            <div className="h-8 w-16 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export default function AdManagement() {
  const isReadOnly = useReadOnly(); // respects viewer mode from dashboard
  const { toast, showToast, hideToast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [targetLink, setTargetLink] = useState("");
  const [targetPages, setTargetPages] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    image?: string;
  }>({});

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<Ad | null>(null);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      setIsLoading(true);
      const response = await getAds();
      const adsList = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];
      
      console.log("--- Ads Fetched Successfully ---");
      console.table(
        adsList.map((ad: Ad) => ({
          ID: ad.id,
          Title: ad.title,
          "Raw Image Path": ad.image,
          "Resolved Image URL": ad.image
            ? ad.image.startsWith("http") || ad.image.startsWith("blob:")
              ? ad.image
              : ad.image.startsWith("/")
              ? `https://backend-qine.activetechet.com${ad.image}`
              : `https://backend-qine.activetechet.com/media/${ad.image}`
            : "",
        }))
      );

      setAds(adsList);
    } catch (error) {
      showToast("error", "Failed to load advertisements");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (ad: Ad) => {
    if (isReadOnly) return;
    setAdToDelete(ad);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (adToDelete && !isReadOnly) {
      try {
        await deleteAd(adToDelete.id);
        setAds(ads.filter((ad) => ad.id !== adToDelete.id));
        showToast("success", "Advertisement deleted successfully");
      } catch (error) {
        showToast("error", "Failed to delete Advertisement");
      } finally {
        setDeleteModalOpen(false);
        setAdToDelete(null);
      }
    }
  };

  const openCreateModal = () => {
    if (isReadOnly) return;
    setEditingId(null);
    setTitle("");
    setTargetLink("");
    setTargetPages([]);
    setIsActive(true);
    setImageFile(null);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (ad: Ad) => {
    if (isReadOnly) return;
    setEditingId(ad.id);
    setTitle(ad.title);
    setTargetLink(ad.target_link || "");
    setTargetPages(ad.target_pages);
    setIsActive(ad.is_active);
    setImageFile(null);
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errors: { title?: string; image?: string } = {};
    if (!title.trim()) errors.title = "Advertisement title is required";
    if (!editingId && !imageFile)
      errors.image = "Please select an image for new Advertisement";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!validateForm()) return;
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("is_active", String(isActive));
    if (imageFile) formData.append("image", imageFile);
    formData.append("target_pages", JSON.stringify(targetPages));
    formData.append("target_link", targetLink || "");

    try {
      if (editingId) {
        await updateAd(editingId, formData);
        showToast("success", "Advertisement updated successfully");
      } else {
        await createAd(formData);
        showToast("success", "New Advertisement created");
      }
      setModalOpen(false);
      fetchAds();
    } catch (error: any) {
      showToast("error", error.message || "Failed to save Advertisement");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering & Pagination
  const filteredAds = ads.filter((ad) => {
    const matchesSearch = ad.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "active"
          ? ad.is_active
          : !ad.is_active;
    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.ceil(filteredAds.length / ITEMS_PER_PAGE);
  const paginatedAds = filteredAds.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalCount = ads.length;
  const activeCount = ads.filter((ad) => ad.is_active).length;

  const getImageUrl = (image: string) => {
    if (!image) return "";
    if (image.startsWith("http") || image.startsWith("blob:")) return image;
    if (image.startsWith("/")) {
      return `https://backend-qine.activetechet.com${image}`;
    }
    return `https://backend-qine.activetechet.com/media/${image}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Sticky Header */}
       <motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  className="
    sticky top-0 z-20
    bg-white/80 backdrop-blur-md
    rounded-2xl
    -mt-2 pt-3 sm:pt-4 pb-3 px-3 sm:px-4
    border-b border-gray-100
    w-full
    overflow-hidden
  "
>
  <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 min-w-0 w-full">
    
    {/* Left Section */}
    <div className="min-w-0 flex-1 overflow-hidden">
      <h1 className="
        text-[20px] xs:text-2xl sm:text-3xl
        font-bold
        bg-gradient-to-r from-gray-900 to-gray-600
        bg-clip-text text-transparent
        truncate leading-tight
      ">
        Advertisments
      </h1>

      <p className="
        text-gray-500
        text-[11px] xs:text-xs sm:text-sm
        mt-0.5
        truncate
      ">
        Manage placements across your platform
      </p>
    </div>

    {/* Right Section */}
    {!isReadOnly && (
      <div className="shrink-0">
        <Button
          onClick={openCreateModal}
          size="lg"
          className="
            shadow-sm
            inline-flex items-center justify-center
            gap-1.5 sm:gap-2
            px-2.5 xs:px-3 sm:px-4
            py-2 sm:py-2.5
            text-xs sm:text-sm
            whitespace-nowrap
            min-h-[28px] sm:min-h-[40px]
            max-w-[140px] xs:max-w-none
            overflow-hidden
          "
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className="truncate">New Ads</span>
        </Button>
      </div>
    )}
  </div>
</motion.div>
        {/* Stats Grid */}
        <div className=" hidden xs:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Ads"
            value={totalCount}
            icon={LayoutDashboard}
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            title="Active Ads"
            value={activeCount}
            icon={Activity}
            color="from-emerald-500 to-emerald-600"
          />
          <StatCard
            title="Inactive Ads"
            value={totalCount - activeCount}
            icon={ImageIcon}
            color="from-gray-500 to-gray-600"
          />
          {/* <StatCard
            title="Pages Targeted"
            value={totalPagesTargeted}
            icon={Target}
            color="from-indigo-500 to-indigo-600"
          /> */}
        </div>

        {/* Search & Filter */}
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
        />

        {/* Content Area */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : paginatedAds.length === 0 ? (
          <EmptyState onCreateNew={openCreateModal} isReadOnly={isReadOnly} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedAds.map((ad) => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  onEdit={openEditModal}
                  onDelete={handleDeleteClick}
                  getImageUrl={getImageUrl}
                  isReadOnly={isReadOnly}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}

        {/* Floating Mobile Action Button (only if not read-only) */}
        {!isReadOnly && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={openCreateModal}
            className="fixed bottom-6 right-6 md:hidden w-14 h-14 rounded-full bg-[#6750A4] text-white shadow-xl flex items-center justify-center z-40"
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        )}

        {/* Modals */}
        <DeleteModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title={adToDelete?.title || ""}
        />

        <FormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          title={editingId ? "Edit Advertisment" : "Create New Advertisment"}
          isSubmitting={isSubmitting}
        >
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summer Sale 2025"
            required
            error={formErrors.title}
          />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-[#6750A4] rounded border-gray-300 focus:ring-[#6750A4]"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700"
              >
                Active (visible to users)
              </label>
            </div>
          </div>
          {/* <Input
              label="Target Link (optional)"
              type="url"
              value={targetLink}
              onChange={(e) => setTargetLink(e.target.value)}
              placeholder="https://example.com/offer"
            />
            <MultiSelectPages value={targetPages} onChange={setTargetPages} /> */}
          <ImageUploader
            onFileChange={setImageFile}
            previewUrl={imageFile ? URL.createObjectURL(imageFile) : null}
            existingImage={
              editingId ? ads.find((a) => a.id === editingId)?.image : undefined
            }
          />
          {formErrors.image && (
            <p className="text-sm text-red-500 -mt-2">{formErrors.image}</p>
          )}
        </FormModal>
      </div>
      <Toast toast={toast} onHide={hideToast} />
    </div>
  );
}