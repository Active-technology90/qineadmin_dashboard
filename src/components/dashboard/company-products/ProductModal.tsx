import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, AlertCircle, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { ImageGallery } from './ImageGallery';
import { getCompanyProductDetail } from '../../../services/api';
import type { ProductImage } from '../../../types';

interface ProductFormData {
  sku: string;
  title: string;
  price: number;
  stock: number;
  unit: string;
}

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  title: z.string().min(1, 'Title is required'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
});

interface ProductModalProps {
  isOpen: boolean;
  editingProduct: {
    id: number;
    sku: string;
    title: string;
    price: number;
    stock: number;
    unit: string;
  } | null;
  companySlug: string;
  onClose: () => void;
  onSave: (data: ProductFormData, existingProductId?: number) => Promise<any>;
  onProductUpdated?: () => void;
  /** If false, disables SKU, title, unit, and image management */
  canEditBasic?: boolean;
  /** 
   * If false, disables price and stock fields unconditionally. 
   * Use this for admin‑only pricing. For staff that should only 
   * restrict on edit, use `isStaff` instead.
   */
  canEditPricing?: boolean;
  /** 
   * Set to `true` for staff users. When true, price & stock are disabled 
   * ONLY when editing an existing product (i.e., `editingProduct` is not null).
   * In create mode, price & stock remain editable.
   */
  isStaff?: boolean;
  /** Callback to show toast notifications from parent */
  onShowToast?: (type: "success" | "error", message: string) => void;
}

export function ProductModal({
  isOpen,
  editingProduct,
  companySlug,
  onClose,
  onSave,
  onProductUpdated,
  canEditBasic = true,
  canEditPricing = true,
  isStaff = false,
  onShowToast,
}: ProductModalProps) {
  const [step, setStep] = useState<'details' | 'gallery'>('details');
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [savedProductId, setSavedProductId] = useState<number | null>(null);
  

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { sku: '', title: '', price: 0, stock: 0, unit: 'pcs' },
  });

   // Reset form and step when editing product changes
  useEffect(() => {
    if (editingProduct) {
      reset({
        sku: editingProduct.sku,
        title: editingProduct.title,
        price: editingProduct.price,
        stock: editingProduct.stock,
        unit: editingProduct.unit,
      });
      setSavedProductId(editingProduct.id);
      setStep('details');
    } else {
      // Only reset form if we're not coming back from gallery with a saved product
      // AND the modal is open (to prevent reset while modal is closed)
      if (!savedProductId && isOpen) {
        reset({ sku: '', title: '', price: 0, stock: 0, unit: 'pcs' });
        setSavedProductId(null);
        setStep('details');
      }
    }
  }, [editingProduct, reset, savedProductId, isOpen]);

  // Fetch images when on gallery step
  useEffect(() => {
    if (step === 'gallery' && savedProductId && companySlug && isOpen) {
      setLoadingImages(true);
      getCompanyProductDetail(companySlug, savedProductId)
        .then((res) => setImages(res.data.images || []))
        .catch((err) => console.error('Failed to load images:', err))
        .finally(() => setLoadingImages(false));
    } else {
      setImages([]);
    }
  }, [step, savedProductId, companySlug, isOpen]);

  // ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Reset modal state when closing and reopening for a new product
  useEffect(() => {
    if (!isOpen) {
      // When modal closes, reset all state for next time
      setStep('details');
      setSavedProductId(null);
      if (!editingProduct) {
        reset({ sku: '', title: '', price: 0, stock: 0, unit: 'pcs' });
      }
    }
  }, [isOpen, editingProduct, reset]);

  const handleBackToDetails = () => {
    // When going back from gallery to details for a newly created product,
    // we need to treat it as an editing product to prevent duplicate creation
    if (step === 'gallery' && savedProductId && !editingProduct) {
      // The product was created but we're going back to edit details
      // We'll keep the savedProductId and let the form handle updates
      setStep('details');
    } else {
      setStep('details');
    }
  };

  const onSubmitDetails = async (data: ProductFormData) => {
    // Allow submission only if basic editing is allowed (creates/updates product)
    if (!canEditBasic) return;
    try {
      let productId = savedProductId;
      
      // If we have a savedProductId (product was created before), update it instead of creating new
      if (savedProductId && !editingProduct) {
        // This is a product that was created but we're going back to edit details
        // We need to update the existing product - pass the savedProductId to onSave
        await onSave(data, savedProductId);
        productId = savedProductId;
      } else {
        // New product creation
        const saved = await onSave(data);
        productId = saved?.id || editingProduct?.id;
      }
      
      if (!productId) throw new Error('No product ID returned');
      setSavedProductId(productId);
      setStep('gallery');
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const stepProgress = step === 'details' ? 50 : 100;
  const isReadOnlyBasic = !canEditBasic;
  
  // PRICE & STOCK DISABLE LOGIC:
  // 1. If canEditPricing === false → always disabled (admin override)
  // 2. Else if isStaff === true and editingProduct exists → disabled (staff edit mode)
  // 3. Otherwise → enabled
  const isPricingDisabled = !canEditPricing || (isStaff && !!editingProduct);
  
  // For UI label clarity
  const isEditMode = !!editingProduct;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#6750A4]/20 backdrop-blur-sm border-b border-[#6750A4]/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-[#6750A4] to-[#8B6BB5] bg-clip-text text-transparent">
                {editingProduct ? 'Product Details' : 'New Product'}
                {isReadOnlyBasic && <span className="ml-2 text-sm font-normal text-amber-600">(View only)</span>}
                {!isReadOnlyBasic && isPricingDisabled && isEditMode && (
                  <span className="ml-2 text-sm font-normal text-blue-600">(Price/Stock read only)</span>
                )}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {step === 'details' 
                  ? (isReadOnlyBasic ? 'Product information' : 'Enter product details') 
                  : 'Manage product images'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-[#6750A4] hover:bg-[#6750A4]/10 transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Stepper – hide if completely read-only */}
          {!isReadOnlyBasic && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                    step === 'details' ? 'bg-secondary text-white' : 'bg-secondary/10 text-secondary'
                  }`}>
                    {step === 'details' ? '1' : <CheckCircle className="h-4 w-4" />}
                  </div>
                  <span className={`text-sm font-medium ${step === 'details' ? 'text-secondary' : 'text-gray-500'}`}>
                    Details
                  </span>
                </div>
                <div className="flex-1 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary transition-all duration-300 ease-out"
                    style={{ width: `${stepProgress}%` }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                    step === 'gallery' ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step === 'gallery' ? '2' : <CheckCircle className="h-4 w-4" />}
                  </div>
                  <span className={`text-sm font-medium ${step === 'gallery' ? 'text-secondary' : 'text-gray-400'}`}>
                    Images
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="transition-all duration-300 ease-out">
            {step === 'details' ? (
              <form id="product-details-form" onSubmit={handleSubmit(onSubmitDetails)} className="space-y-5">
                {/* SKU – disabled when editing or basic read-only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('sku')}
                    disabled={isSubmitting || !!editingProduct || isReadOnlyBasic}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.sku
                        ? 'border-red-500 focus:ring-red-100'
                        : 'border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                    } transition-all outline-none ${
                      (!!editingProduct || isReadOnlyBasic) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    placeholder="e.g., FLR-001"
                  />
                  {errors.sku && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.sku.message}
                    </p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('title')}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.title
                        ? 'border-red-500 focus:ring-red-100'
                        : 'border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                    } transition-all outline-none ${isReadOnlyBasic ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                    placeholder="Product name"
                    disabled={isSubmitting || isReadOnlyBasic}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                {/* Price & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (ETB) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('price', { valueAsNumber: true })}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        errors.price
                          ? 'border-red-500 focus:ring-red-100'
                          : 'border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                      } transition-all outline-none ${
                        isPricingDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                      }`}
                      placeholder="0.00"
                      disabled={isSubmitting || isPricingDisabled}
                    />
                    {errors.price && (
                      <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register('stock', { valueAsNumber: true })}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        errors.stock
                          ? 'border-red-500 focus:ring-red-100'
                          : 'border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                      } transition-all outline-none ${
                        isPricingDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                      }`}
                      placeholder="0"
                      disabled={isSubmitting || isPricingDisabled}
                    />
                    {errors.stock && (
                      <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
                    )}
                  </div>
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('unit')}
                    className={`w-full px-4 py-2 rounded-lg border border-gray-200 bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all outline-none ${
                      isReadOnlyBasic ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    disabled={isSubmitting || isReadOnlyBasic}
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (l)</option>
                    <option value="m">Meter (m)</option>
                  </select>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                {loadingImages ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                    <p className="text-sm text-gray-500 mt-3">Loading images...</p>
                  </div>
                ) : (
                   <ImageGallery
                    images={images}
                    productId={savedProductId!}
                    companySlug={companySlug}
                    onImagesChange={async () => {
                      if (savedProductId && companySlug) {
                        try {
                          const res = await getCompanyProductDetail(companySlug, savedProductId);
                          setImages(res.data.images || []);
                          if (onProductUpdated) onProductUpdated();
                        } catch (err) {
                          console.error('Failed to refresh images:', err);
                        }
                      }
                    }}
                    readOnly={isReadOnlyBasic}
                    onError={(message) => {
                      // Show toast notification for image errors
                      if (onShowToast) {
                        onShowToast('error', message);
                      }
                      console.error('Image error:', message);
                    }}
                    onShowToast={onShowToast}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
          {step === 'details' ? (
            isReadOnlyBasic ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="product-details-form"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#6750A4] text-white font-medium hover:bg-[#5a448c] transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Continue to Images <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )
          ) : (
            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={handleBackToDetails}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition flex items-center gap-2"
                disabled={isReadOnlyBasic}
              >
                <ChevronLeft className="h-4 w-4" /> Back to Details
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#6750A4] text-white font-medium hover:bg-[#5a448c] transition shadow-sm"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}