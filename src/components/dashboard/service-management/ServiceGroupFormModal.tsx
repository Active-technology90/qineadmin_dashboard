// src/components/admin/service-management/ServiceGroupFormModal.tsx
import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import type { ServiceGroup } from "../../../mock/serviceApi";

interface ServiceGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: ServiceGroup | null; // null for create (not used here)
  onSave: (data: Partial<ServiceGroup>) => Promise<void>;
}

export default function ServiceGroupFormModal({
  isOpen,
  onClose,
  group,
  onSave,
}: ServiceGroupFormModalProps) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    image: "",
    category: "",
    is_active: true,
    display_order: 0,
    tags: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (group) {
      setForm({
        name: group.name,
        slug: group.slug,
        description: group.description,
        icon: group.icon,
        image: group.image,
        category: group.category,
        is_active: group.is_active,
        display_order: group.display_order,
        tags: group.tags,
      });
    } else {
      setForm({
        name: "",
        slug: "",
        description: "",
        icon: "",
        image: "",
        category: "",
        is_active: true,
        display_order: 0,
        tags: [],
      });
    }
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        tags: form.tags.length > 0 ? form.tags : [],
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Edit Group</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={e => setForm({ ...form, slug: e.target.value })}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Icon URL</label>
              <input
                type="text"
                value={form.icon}
                onChange={e => setForm({ ...form, icon: e.target.value })}
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Image URL</label>
              <input
                type="text"
                value={form.image}
                onChange={e => setForm({ ...form, image: e.target.value })}
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary-dark disabled:opacity-70">
              {saving ? "Saving..." : <><Save size={16} /> Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}