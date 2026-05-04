// src/components/ui/DragDropImageUpload.tsx
import React, { useCallback, useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface DragDropImageUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  previewUrl?: string | null;
  label?: string;
  required?: boolean;
  accept?: string;
  maxSizeMB?: number;
}

export const DragDropImageUpload: React.FC<DragDropImageUploadProps> = ({
  onChange,
  previewUrl: externalPreview,
  label = 'Upload Image',
  required = false,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  maxSizeMB = 5,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [internalPreview, setInternalPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const preview = externalPreview ?? internalPreview;

  const handleFile = (file: File | null) => {
    if (!file) {
      onChange(null);
      if (internalPreview) {
        URL.revokeObjectURL(internalPreview);
        setInternalPreview(null);
      }
      return;
    }

    // Validate file type
   const acceptedTypes = accept.split(',');

const isValidType = acceptedTypes.some((type) => {
  const trimmed = type.trim();

  // Handle wildcard (image/*)
  if (trimmed.endsWith('/*')) {
    const baseType = trimmed.split('/')[0];
    return file.type.startsWith(baseType + '/');
  }

  // Exact match
  return file.type === trimmed;
});

if (!isValidType) {
  alert(`Invalid file type. Allowed types: ${acceptedTypes.join(', ')}`);
  return;
}
    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File too large. Max size: ${maxSizeMB}MB`);
      return;
    }

    // Create preview
    if (internalPreview) URL.revokeObjectURL(internalPreview);
    const url = URL.createObjectURL(file);
    setInternalPreview(url);
    onChange(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) handleFile(files[0]);
  }, []);

  const clearImage = () => handleFile(null);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${
          dragActive ? 'border-[#6750A4] bg-indigo-50' : 'border-gray-300 bg-gray-50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />
        {preview ? (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview"
              className="max-h-32 mx-auto object-contain rounded"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearImage(); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-500 mt-1">Click or drag to upload</p>
            <p className="text-xs text-gray-400 mt-1">
              {accept.split(',').map(t => t.split('/')[1]).join(', ')} up to {maxSizeMB}MB
            </p>
          </>
        )}
      </div>
    </div>
  );
};