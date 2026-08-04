import { Plus, Trash2 } from "lucide-react";
import type { IntakeFormField } from "../../../types";

const FIELD_TYPES: IntakeFormField["type"][] = [
  "text",
  "textarea",
  "select",
  "number",
  "date",
  "checkbox",
];

interface IntakeFormBuilderProps {
  fields: IntakeFormField[];
  onChange: (fields: IntakeFormField[]) => void;
}

export function IntakeFormBuilder({ fields, onChange }: IntakeFormBuilderProps) {
  const addField = () => {
    onChange([
      ...fields,
      {
        name: `field_${fields.length + 1}`,
        type: "text",
        label: "New Field",
        required: false,
      },
    ]);
  };

  const updateField = (index: number, patch: Partial<IntakeFormField>) => {
    const next = fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
    onChange(next);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Customer Intake Form</p>
        <button
          type="button"
          onClick={addField}
          className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 hover:text-purple-900"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Field
        </button>
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-gray-400 italic">
          No custom fields yet. Add fields to collect info from customers when they book.
        </p>
      ) : (
        fields.map((field, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold text-purple-600">
                Field {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeField(index)}
                className="text-red-400 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={field.label}
                onChange={(e) => {
                  const label = e.target.value;
                  updateField(index, {
                    label,
                    name: label.toLowerCase().replace(/\s+/g, "_").replace(/[^\w]/g, ""),
                  });
                }}
                placeholder="Field label"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <select
                value={field.type}
                onChange={(e) =>
                  updateField(index, { type: e.target.value as IntakeFormField["type"] })
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {field.type === "select" && (
              <input
                type="text"
                value={(field.options || []).join(", ")}
                onChange={(e) =>
                  updateField(index, {
                    options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="Options (comma separated): Short, Medium, Long"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            )}

            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={!!field.required}
                onChange={(e) => updateField(index, { required: e.target.checked })}
                className="rounded"
              />
              Required field
            </label>
          </div>
        ))
      )}
    </div>
  );
}
