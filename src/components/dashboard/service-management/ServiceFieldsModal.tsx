import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { FormModal } from "../../ui/FormModal";

interface Field {
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
  name?: string;      // <-- added; auto‑generated from label
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  initialFields: Field[];
  onSave: (slug: string, fields: Field[]) => Promise<void>;
}

const fieldTypes = ["text", "textarea", "phone", "email", "date", "time", "select", "radio", "checkbox", "number"];

const ServiceFieldsModal: React.FC<Props> = ({ isOpen, onClose, slug, initialFields, onSave }) => {
  const [fields, setFields] = useState<Field[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFields(initialFields || []);
  }, [initialFields]);

  // Helper: generate a slug from a label
  const generateName = (label: string) =>
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

  const addField = () => {
    setFields([...fields, { type: "text", label: "", required: false }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: string, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    // If label changes, update name automatically if name is empty or matches old label
    if (key === "label") {
      const oldName = updated[index].name;
      const newLabel = value;
      // auto‑generate name only if it was previously auto‑generated or empty
      if (!oldName || oldName === generateName(updated[index].label)) {
        updated[index].name = generateName(newLabel);
      }
    }
    setFields(updated);
  };

  const handleSubmit = async () => {
    // Validate: each field must have a label
    const invalid = fields.some(f => !f.label.trim());
    if (invalid) {
      alert("All fields must have a label.");
      return;
    }
    // Ensure each field has a name (if missing, generate from label)
    const validated = fields.map(f => ({
      ...f,
      name: f.name || generateName(f.label),
    }));
    setSaving(true);
    try {
      await onSave(slug, validated);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Booking Form Fields"
      onSubmit={handleSubmit}
      submitting={saving}
      maxWidth="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Define the fields customers must complete when booking "{slug}".
        </p>
        {fields.map((field, idx) => (
          <div key={idx} className="flex gap-3 items-start border-b pb-3">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium">Type</label>
                <select
                  value={field.type}
                  onChange={e => updateField(idx, "type", e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  {fieldTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Label</label>
                <input
                  value={field.label}
                  onChange={e => updateField(idx, "label", e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                  placeholder="e.g. Hair Length"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Name will be: {field.name || generateName(field.label) || "…"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={field.required || false}
                    onChange={e => updateField(idx, "required", e.target.checked)}
                  />
                  Required
                </label>
                {field.type === "select" && (
                  <input
                    type="text"
                    placeholder="Options (comma separated)"
                    value={field.options?.join(", ") || ""}
                    onChange={e =>
                      updateField(
                        idx,
                        "options",
                        e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                      )
                    }
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                )}
              </div>
            </div>
            <button onClick={() => removeField(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          onClick={addField}
          className="flex items-center gap-1 text-sm text-secondary hover:underline"
        >
          <Plus size={14} /> Add Field
        </button>
      </div>
    </FormModal>
  );
};

export default ServiceFieldsModal;