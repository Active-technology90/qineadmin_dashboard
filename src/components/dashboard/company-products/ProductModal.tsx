import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, AlertCircle, ChevronRight, ChevronLeft, Image as ImageIcon, CheckCircle } from 'lucide-react';
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
  onSave: (data: ProductFormData) => Promise<any>;
  onProductUpdated?: () => void;
}

export function ProductModal({
  isOpen,
  editingProduct,
  companySlug,
  onClose,
  onSave,
  onProductUpdated,
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
    defaultValues: { sku: '', title: '', price: 0, stock: 0, unit: 'pc' },
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
      reset({ sku: '', title: '', price: 0, stock: 0, unit: 'pc' });
      setSavedProductId(null);
      setStep('details');
    }
  }, [editingProduct, reset]);

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

  const handleImagesChange = async () => {
    if (savedProductId && companySlug) {
      try {
        const res = await getCompanyProductDetail(companySlug, savedProductId);
        setImages(res.data.images || []);
        if (onProductUpdated) onProductUpdated();
      } catch (err) {
        console.error('Failed to refresh images:', err);
      }
    }
  };

  const onSubmitDetails = async (data: ProductFormData) => {
    try {
      const saved = await onSave(data);
      const productId = saved?.id || editingProduct?.id;
      if (!productId) throw new Error('No product ID returned');
      setSavedProductId(productId);
      setStep('gallery');
    } catch (err) {
      console.error(err);
    }
  };

  const handleBackToDetails = () => setStep('details');

  if (!isOpen) return null;

  const stepProgress = step === 'details' ? 50 : 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {editingProduct ? 'Edit Product' : 'New Product'}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {step === 'details' ? 'Enter product details' : 'Manage product images'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Stepper */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                  step === 'details' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {step === 'details' ? '1' : <CheckCircle className="h-4 w-4" />}
                </div>
                <span className={`text-sm font-medium ${step === 'details' ? 'text-indigo-600' : 'text-gray-500'}`}>
                  Details
                </span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                  style={{ width: `${stepProgress}%` }}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                  step === 'gallery' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step === 'gallery' ? '2' : <CheckCircle className="h-4 w-4" />}
                </div>
                <span className={`text-sm font-medium ${step === 'gallery' ? 'text-indigo-600' : 'text-gray-400'}`}>
                  Images
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="transition-all duration-300 ease-out">
            {step === 'details' ? (
              <form id="product-details-form" onSubmit={handleSubmit(onSubmitDetails)} className="space-y-5">
                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('sku')}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.sku
                        ? 'border-red-500 focus:ring-red-100'
                        : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                    } transition-all outline-none`}
                    placeholder="e.g., FLR-001"
                    disabled={isSubmitting}
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                    placeholder="Product name"
                    disabled={isSubmitting}
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
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                      placeholder="0.00"
                      disabled={isSubmitting}
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
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                      placeholder="0"
                      disabled={isSubmitting}
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                    disabled={isSubmitting}
                  >
                    <option value="pc">Piece (pc)</option>
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
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <p className="text-sm text-gray-500 mt-3">Loading images...</p>
                  </div>
                ) : (
                  <ImageGallery
                    images={images}
                    productId={savedProductId!}
                    companySlug={companySlug}
                    onImagesChange={handleImagesChange}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
          {step === 'details' ? (
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
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Continue to Images <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={handleBackToDetails}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Back to Details
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition shadow-sm"
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