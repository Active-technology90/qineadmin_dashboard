import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Star, Loader2, AlertCircle } from "lucide-react";
import type { ServiceOfferingImage } from "../../../types";
import {
  uploadServiceOfferingImage,
  deleteServiceOfferingImage,
  updateServiceOfferingImage,
  getServiceOfferingImages,
} from "../../../services/api";
import { normalizeListResponse } from "../../../utils/normalizeListResponse";

interface ServiceOfferingImageGalleryProps {
  companySlug: string;
  offeringId: number;
  onShowToast?: (type: "success" | "error", message: string) => void;
}

export function ServiceOfferingImageGallery({
  companySlug,
  offeringId,
  onShowToast,
}: ServiceOfferingImageGalleryProps) {
  const [images, setImages] = useState<ServiceOfferingImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = async () => {
    setLoading(true);
    try {
      const res = await getServiceOfferingImages(companySlug, offeringId);
      setImages(normalizeListResponse(res.data));
    } catch {
      onShowToast?.("error", "Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug && offeringId) loadImages();
  }, [companySlug, offeringId]);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      onShowToast?.("error", "Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onShowToast?.("error", "Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const isFirst = images.length === 0;
      await uploadServiceOfferingImage(companySlug, offeringId, file, isFirst);
      await loadImages();
      onShowToast?.("success", "Image uploaded");
    } catch {
      onShowToast?.("error", "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    const image = images.find((img) => img.id === imageId);
    if (!image || image.is_primary) return;

    setUpdatingId(imageId);
    try {
      const currentPrimary = images.find((img) => img.is_primary);
      if (currentPrimary && currentPrimary.id !== imageId) {
        await updateServiceOfferingImage(companySlug, offeringId, currentPrimary.id, {
          is_primary: false,
        });
      }
      await updateServiceOfferingImage(companySlug, offeringId, imageId, {
        is_primary: true,
      });
      await loadImages();
      onShowToast?.("success", "Primary image updated");
    } catch {
      onShowToast?.("error", "Failed to set primary image");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (imageId: number) => {
    setDeletingId(imageId);
    try {
      await deleteServiceOfferingImage(companySlug, offeringId, imageId);
      await loadImages();
      onShowToast?.("success", "Image deleted");
    } catch {
      onShowToast?.("error", "Delete failed");
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading images...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <h4 className="text-base font-semibold text-gray-900">Service Images</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Upload photos customers will see when browsing this service. Mark one as primary.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await uploadFile(file);
            e.target.value = "";
          }}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) await uploadFile(file);
          }}
          className={`rounded-xl transition-all ${
            isDragOver ? "ring-2 ring-purple-400 ring-inset bg-purple-50/50" : ""
          }`}
        >
          {images.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition text-center"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
              ) : (
                <>
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click or drag an image here</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP up to 5MB</p>
                </>
              )}
            </button>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className={`relative group rounded-xl overflow-hidden border bg-gray-50 aspect-square ${
                    img.is_primary ? "ring-2 ring-yellow-400" : "border-gray-200"
                  }`}
                >
                  <img
                    src={img.image}
                    alt={img.alt_text || "Service"}
                    className="w-full h-full object-cover"
                  />
                  {img.is_primary && (
                    <span className="absolute top-2 left-2 bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Primary
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    {!img.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(img.id)}
                        disabled={updatingId === img.id}
                        className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 disabled:opacity-50"
                        title="Set as primary"
                      >
                        {updatingId === img.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(img.id)}
                      disabled={deletingId === img.id}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === img.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-gray-50 transition"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span className="text-xs text-gray-500">Add more</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {pendingDeleteId !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Delete image?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              This image will be removed from the service listing.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(pendingDeleteId)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
