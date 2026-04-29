import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Upload, Trash2, Star, Loader2, GripVertical, Download } from 'lucide-react';
import type { ProductImage } from '../../../types';
import { uploadProductImage, deleteProductImage, updateProductImage } from '../../../services/api';

interface ImageGalleryProps {
  images: ProductImage[];
  productId: number;
  companySlug: string;
  onImagesChange: () => void;
  onError?: (message: string) => void;
  readOnly?: boolean;
}

// ------------------------------------------------------------------
// Sortable image item with improved hover effects and visual hierarchy
// ------------------------------------------------------------------
function SortableImageItem({
  image,
  isUpdating,
  onSetPrimary,
  onDelete,
  isDeleting,
}: {
  image: ProductImage;
  isUpdating: boolean;
  onSetPrimary: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group border rounded-xl overflow-hidden bg-gray-50 shadow-sm hover:shadow-lg transition-all duration-300 ${
        image.is_primary ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
      }`}
    >
      {/* Image with zoom on hover */}
      <div className="aspect-square w-full overflow-hidden">
        <img
          src={image.image}
          alt="Product"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Overlay – actions grouped at bottom + drag separated */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-between p-2">
        {/* Top: drag handle (separated) */}
        <div className="flex justify-end">
          <div
            {...attributes}
            {...listeners}
            className="p-1.5 bg-gray-800 text-white rounded-lg cursor-grab active:cursor-grabbing hover:bg-gray-700 transition"
            title="Drag to reorder"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Bottom: action buttons (grouped) */}
        <div className="flex justify-center gap-2">
          {!image.is_primary && (
            <button
              onClick={() => onSetPrimary(image.id)}
              disabled={isUpdating}
              className="p-1.5 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition disabled:opacity-50 shadow-md"
              title="Set as primary"
            >
              <Star className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => onDelete(image.id)}
            disabled={isDeleting}
            className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition disabled:opacity-50 shadow-md"
            title="Delete image"
          >
            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Primary badge – more visible */}
      {image.is_primary && (
        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg z-10">
          ★ Primary
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Main ImageGallery component
// ------------------------------------------------------------------
export function ImageGallery({ images, productId, companySlug, onImagesChange, onError }: ImageGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localImages, setLocalImages] = useState<ProductImage[]>(images);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local images when prop changes (avoid infinite loop)
  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Upload file with progress simulation
  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError?.('Please upload an image file');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError?.('Image size must be less than 5MB');
      return false;
    }

    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 20, 90));
    }, 200);

    try {
      const isFirstImage = localImages.length === 0;
      await uploadProductImage(companySlug, productId, file, isFirstImage);
      await onImagesChange(); // refetch from API
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 500);
      return true;
    } catch (err: any) {
      const msg = err.response?.status === 404
        ? 'Image upload endpoint not available. Please contact support.'
        : 'Upload failed. Please try again.';
      onError?.(msg);
      return false;
    } finally {
      clearInterval(interval);
      setUploading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await uploadFile(file);
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm('Delete this image?')) return;
    setDeletingId(imageId);
    try {
      await deleteProductImage(companySlug, productId, imageId);
      await onImagesChange();
    } catch {
      onError?.('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    const image = localImages.find(img => img.id === imageId);
    if (image?.is_primary) return;

    setUpdatingId(imageId);
    try {
      const currentPrimary = localImages.find(img => img.is_primary);
      if (currentPrimary && currentPrimary.id !== imageId) {
        await updateProductImage(companySlug, productId, currentPrimary.id, { is_primary: false });
      }
      await updateProductImage(companySlug, productId, imageId, { is_primary: true });
      await onImagesChange();
    } catch {
      onError?.('Failed to set primary');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = localImages.findIndex((img) => img.id === active.id);
      const newIndex = localImages.findIndex((img) => img.id === over.id);
      const newOrder = arrayMove(localImages, oldIndex, newIndex);

      // Optimistic UI update
      setLocalImages(newOrder);

      try {
        for (let i = 0; i < newOrder.length; i++) {
          await updateProductImage(companySlug, productId, newOrder[i].id, { order: i });
        }
        await onImagesChange(); // final sync
      } catch (err) {
        onError?.('Failed to reorder images');
        await onImagesChange(); // revert
      }
    },
    [localImages, companySlug, productId, onImagesChange, onError]
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-gray-900">Product Images</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Drag to reorder • First image will be shown in listings
          </p>
        </div>
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span className="text-sm font-medium">{uploading ? 'Uploading...' : 'Upload Image'}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Progress bar */}
      {uploading && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Drop zone + image grid */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-xl transition-all duration-200 ${
          isDragOver ? 'bg-indigo-50 ring-2 ring-indigo-400 ring-inset scale-[1.02]' : ''
        }`}
      >
        {localImages.length === 0 && !uploading ? (
          // Empty state drop zone (with scale on hover/drag)
          <div
            className={`text-center py-12 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
              isDragOver
                ? 'border-indigo-400 bg-indigo-50 scale-[1.02]'
                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:scale-[1.01]'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Download className="h-12 w-12 text-gray-400 mx-auto mb-3 transition-transform duration-200 group-hover:scale-110" />
            <p className="text-sm text-gray-500">
              {isDragOver ? 'Drop image here' : 'Drag & drop an image here or click to upload'}
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP up to 5MB</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localImages.map((img) => img.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {localImages.map((img) => (
                  <SortableImageItem
                    key={img.id}
                    image={img}
                    isUpdating={updatingId === img.id}
                    isDeleting={deletingId === img.id}
                    onSetPrimary={handleSetPrimary}
                    onDelete={handleDelete}
                  />
                ))}
                {/* "Add more" tile – subtle scale on hover */}
                <div
                  className="relative border-2 border-dashed rounded-xl bg-gray-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-all duration-200 hover:scale-[1.02] aspect-square"
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) await uploadFile(file);
                  }}
                >
                  <Upload className="h-6 w-6 text-gray-400 transition-transform duration-200 group-hover:scale-110" />
                  <span className="text-xs text-gray-500">Add more</span>
                </div>
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}