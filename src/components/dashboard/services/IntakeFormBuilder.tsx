import { useState, useCallback, useEffect, memo, useRef } from "react";
import {
  GripVertical,
  AlignLeft,
  AlignJustify,
  ChevronDown,
  Hash,
  Calendar,
  CheckSquare,
  Copy,
  Trash2,
  Plus,
  ClipboardList,
  ChevronUp,
  Mail,
  Phone,
  Clock,
  CalendarClock,
  List,
  CircleDot,
  Upload,
  Eye,
  X,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import type { IntakeFormField } from "../../../types";

/* -------------------------------------------------------------------------- */
/*  Extended types to support field‑specific configuration                   */
/* -------------------------------------------------------------------------- */
interface ExtendedIntakeFormField extends IntakeFormField {
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  min_date?: string;
  max_date?: string;
  accept?: string;
  max_size?: number;
  max_files?: number;
  description?: string;
}

type FieldWithId = ExtendedIntakeFormField & { _id: string };

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
const FIELD_ICONS: Record<IntakeFormField["type"], React.ReactNode> = {
  text: <AlignLeft className="h-3.5 w-3.5" />,
  textarea: <AlignJustify className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  phone: <Phone className="h-3.5 w-3.5" />,
  number: <Hash className="h-3.5 w-3.5" />,
  date: <Calendar className="h-3.5 w-3.5" />,
  time: <Clock className="h-3.5 w-3.5" />,
  datetime: <CalendarClock className="h-3.5 w-3.5" />,
  select: <ChevronDown className="h-3.5 w-3.5" />,
  multiselect: <List className="h-3.5 w-3.5" />,
  radio: <CircleDot className="h-3.5 w-3.5" />,
  checkbox: <CheckSquare className="h-3.5 w-3.5" />,
  file: <Upload className="h-3.5 w-3.5" />,
  url: <AlignLeft className="h-3.5 w-3.5" />,
};

const FIELD_LABELS: Record<IntakeFormField["type"], string> = {
  text: "Text",
  textarea: "Textarea",
  email: "Email",
  phone: "Phone",
  number: "Number",
  date: "Date",
  time: "Time",
  datetime: "Date & Time",
  select: "Select",
  multiselect: "Multi Select",
  radio: "Radio",
  checkbox: "Checkbox",
  file: "File Upload",
  url: "Website URL",
};

const FIELD_TYPES: IntakeFormField["type"][] = [
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "date",
  "time",
  "datetime",
  "select",
  "multiselect",
  "radio",
  "checkbox",
  "file",
  "url",
];

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateFieldName(label: string, existingNames: Set<string>): string {
  let base = label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "")
    .replace(/_+/g, "_");
  if (!base || /^\d/.test(base)) base = "field";
  let candidate = base;
  let counter = 1;
  while (existingNames.has(candidate)) {
    candidate = `${base}_${counter}`;
    counter++;
  }
  return candidate;
}

/* -------------------------------------------------------------------------- */
/*  Options Editor                                                            */
/* -------------------------------------------------------------------------- */
function OptionsEditor({
  options,
  onChange,
}: {
  options?: string[];
  onChange: (options: string[]) => void;
}) {
  const safeOptions = options ?? [];
  const [newOption, setNewOption] = useState("");

  const addOption = () => {
    const trimmed = newOption.trim();
    if (!trimmed || safeOptions.includes(trimmed)) return;
    onChange([...safeOptions, trimmed]);
    setNewOption("");
  };

  const removeOption = (index: number) => {
    onChange(safeOptions.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...safeOptions];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-600">Options</label>
      <ul className="space-y-1">
        {safeOptions.map((opt, idx) => (
          <li key={idx} className="flex items-center gap-1">
            <input
              type="text"
              value={opt}
              onChange={(e) => updateOption(idx, e.target.value)}
              className="flex-1 h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20 outline-none"
            />
            <button
              type="button"
              onClick={() => removeOption(idx)}
              className="p-1 text-gray-400 hover:text-red-500"
              aria-label="Remove option"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          type="text"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && (e.preventDefault(), addOption())
          }
          placeholder="New option"
          className="flex-1 h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20 outline-none"
        />
        <button
          type="button"
          onClick={addOption}
          className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"
        >
          Add
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field Type Select (portal‑based)                                          */
/* -------------------------------------------------------------------------- */
function FieldTypeSelect({
  value,
  onChange,
}: {
  value: IntakeFormField["type"];
  onChange: (type: IntakeFormField["type"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        left: rect.left,
        top: rect.bottom + 4,
        width: rect.width,
        zIndex: 99999,
      });
    }
  };

  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 hover:bg-white transition w-full focus:outline-none focus:ring-2 focus:ring-[#6750A4]/20"
      >
        <span className="text-gray-500">{FIELD_ICONS[value]}</span>
        <span className="flex-1 text-left">{FIELD_LABELS[value]}</span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>
      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-white border border-gray-200 rounded-xl shadow-xl py-1 overflow-y-auto max-h-56"
          >
            {FIELD_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onChange(type);
                  setOpen(false);
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 ${
                  value === type
                    ? "bg-[#6750A4]/5 text-[#6750A4]"
                    : "text-gray-700"
                }`}
              >
                <span className="text-gray-500">{FIELD_ICONS[type]}</span>
                {FIELD_LABELS[type]}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Delete Popover                                                            */
/* -------------------------------------------------------------------------- */
function DeletePopover({
  onDelete,
  fieldLabel,
}: {
  onDelete: () => void;
  fieldLabel: string;
}) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (show) cancelRef.current?.focus();
  }, [show]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setShow(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setShow(true)}
        title="Delete field"
        className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {show && (
        <div
          className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-30 w-56"
          role="dialog"
          aria-label="Delete confirmation"
        >
          <p className="text-sm text-gray-700 mb-2">
            Delete “{fieldLabel}”?<br />
            This field will be permanently removed.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => setShow(false)}
              className="px-3 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete();
                setShow(false);
              }}
              className="px-3 py-1 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field Card                                                                */
/* -------------------------------------------------------------------------- */
const FieldCard = memo(function FieldCard({
  field,
  updateField,
  removeField,
  duplicateField,
}: {
  field: FieldWithId;
  updateField: (patch: Partial<ExtendedIntakeFormField>) => void;
  removeField: () => void;
  duplicateField: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasOptions = ["select", "multiselect", "radio"].includes(field.type);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-white shadow-sm transition ${
        isDragging
          ? "border-[#6750A4] shadow-lg ring-2 ring-[#6750A4]/10 z-50"
          : "border-gray-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-center px-4 py-3 gap-2">
        <button
          type="button"
          className="cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing shrink-0"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-gray-500 shrink-0">{FIELD_ICONS[field.type]}</span>
        <span className="text-sm font-medium text-gray-900 truncate flex-1 min-w-0">
          {field.label || "Untitled"}
        </span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 text-xs text-gray-600 shrink-0">
          {FIELD_LABELS[field.type]}
        </span>
        {field.required && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#6750A4] shrink-0"
            title="Required"
          />
        )}
        <button
          type="button"
          onClick={duplicateField}
          title="Duplicate"
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <DeletePopover onDelete={removeField} fieldLabel={field.label || "Untitled"} />
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0"
          aria-label={collapsed ? "Expand field" : "Collapse field"}
        >
          {collapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      updateField({ label });
                    }}
                    placeholder="e.g. Customer name"
                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm placeholder:text-gray-400 focus:border-[#6750A4] focus:bg-white focus:ring-2 focus:ring-[#6750A4]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Field Type
                  </label>
                  <FieldTypeSelect
                    value={field.type}
                    onChange={(type) => updateField({ type })}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField({ required: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-[#6750A4] focus:ring-[#6750A4]"
                    />
                    <span className="text-xs font-medium text-gray-600">
                      Required
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Field Name (unique)
                  </label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField({ name: e.target.value })}
                    placeholder="e.g. customer_email"
                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm placeholder:text-gray-400 focus:border-[#6750A4] focus:bg-white focus:ring-2 focus:ring-[#6750A4]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Placeholder
                  </label>
                  <input
                    type="text"
                    value={field.placeholder || ""}
                    onChange={(e) => updateField({ placeholder: e.target.value })}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm placeholder:text-gray-400 focus:border-[#6750A4] focus:bg-white focus:ring-2 focus:ring-[#6750A4]/20 outline-none"
                  />
                </div>
              </div>

              {/* Type‑specific configs — now supported via extended type */}
              {field.type === "file" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Accepted Types
                    </label>
                    <input
                      type="text"
                      value={field.accept ?? ""}
                      onChange={(e) => updateField({ accept: e.target.value })}
                      placeholder=".pdf,.jpg,.png"
                      className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Max Size (MB)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={field.max_size ?? ""}
                      onChange={(e) =>
                        updateField({
                          max_size: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Max Files
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={field.max_files ?? ""}
                      onChange={(e) =>
                        updateField({
                          max_files: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm"
                    />
                  </div>
                </div>
              )}

              {hasOptions && (
                <OptionsEditor
                  options={field.options}
                  onChange={(options) => updateField({ options })}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
});

/* -------------------------------------------------------------------------- */
/*  Main Builder                                                             */
/* -------------------------------------------------------------------------- */
export function IntakeFormBuilder({
  fields,
  onChange,
}: {
  fields: IntakeFormField[];
  onChange: (fields: IntakeFormField[]) => void;
}) {
  const [preview, setPreview] = useState(false);

  // Transform incoming plain fields into the extended internal representation
  const createFieldWithId = (field: IntakeFormField): FieldWithId => ({
    ...field,
    _id: generateId(),
  });

  const [fieldsWithId, setFieldsWithId] = useState<FieldWithId[]>(() =>
    fields.map(createFieldWithId)
  );

  useEffect(() => {
    setFieldsWithId((current) =>
      fields.map((field, index) => ({
        ...field,
        _id: current[index]?._id ?? generateId(),
      }))
    );
  }, [fields]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIdx = fieldsWithId.findIndex((f) => f._id === active.id);
      const newIdx = fieldsWithId.findIndex((f) => f._id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;
      const reordered = [...fieldsWithId];
      const [moved] = reordered.splice(oldIdx, 1);
      reordered.splice(newIdx, 0, moved);
      // Emit only plain IntakeFormField (strip _id)
      onChange(reordered.map(({ _id, ...rest }) => rest as IntakeFormField));
    },
    [fieldsWithId, onChange]
  );

  const addField = useCallback(() => {
    const newField: FieldWithId = {
      name: "",
      type: "text",
      label: "New Field",
      required: false,
      placeholder: "",
      options: undefined,
      _id: generateId(),
    };
    const existingNames = new Set(fieldsWithId.map((f) => f.name));
    newField.name = generateFieldName(newField.label, existingNames);
    const updated = [...fieldsWithId, newField];
    onChange(updated.map(({ _id, ...rest }) => rest as IntakeFormField));
  }, [fieldsWithId, onChange]);

  const updateField = useCallback(
    (id: string, patch: Partial<ExtendedIntakeFormField>) => {
      const next = fieldsWithId.map((f) =>
        f._id === id ? { ...f, ...patch } : f
      );
      onChange(next.map(({ _id, ...rest }) => rest as IntakeFormField));
    },
    [fieldsWithId, onChange]
  );

  const removeField = useCallback(
    (id: string) => {
      const filtered = fieldsWithId.filter((f) => f._id !== id);
      onChange(filtered.map(({ _id, ...rest }) => rest as IntakeFormField));
    },
    [fieldsWithId, onChange]
  );

  const duplicateField = useCallback(
    (id: string) => {
      const idx = fieldsWithId.findIndex((f) => f._id === id);
      if (idx === -1) return;
      const original = fieldsWithId[idx];
      const existingNames = new Set(fieldsWithId.map((f) => f.name));
      const copy: FieldWithId = {
        ...original,
        _id: generateId(),
        name: generateFieldName(original.label + " copy", existingNames),
        label: original.label + " (copy)",
      };
      const next = [...fieldsWithId];
      next.splice(idx + 1, 0, copy);
      onChange(next.map(({ _id, ...rest }) => rest as IntakeFormField));
    },
    [fieldsWithId, onChange]
  );

  const fieldCount = fieldsWithId.length;
  const requiredCount = fieldsWithId.filter((f) => f.required).length;

  /* ── Preview mode ────────────────────────────────────────────────────────── */
  if (preview) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Form Preview</h3>
          <button
            type="button"
            onClick={() => setPreview(false)}
            className="text-sm text-[#6750A4] hover:underline"
          >
            Back to Editor
          </button>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto p-4 border border-gray-200 rounded-xl bg-white">
          {fieldsWithId.map((field) => {
            const {
              type,
              label,
              required,
              placeholder,
              options,
              description,
            } = field;
            const id = `preview-${field._id}`;
            return (
              <div key={field._id}>
                <label
                  htmlFor={id}
                  className="block text-sm font-medium text-gray-700"
                >
                  {label}{" "}
                  {required && <span className="text-red-500">*</span>}
                </label>
                {type === "text" && (
                  <input
                    id={id}
                    type="text"
                    placeholder={placeholder}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                )}
                {type === "textarea" && (
                  <textarea
                    id={id}
                    rows={3}
                    placeholder={placeholder}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                )}
                {type === "email" && (
                  <input
                    id={id}
                    type="email"
                    placeholder={placeholder}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                )}
                {type === "phone" && (
                  <input
                    id={id}
                    type="tel"
                    placeholder={placeholder}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                )}
                {type === "number" && (
                  <input
                    id={id}
                    type="number"
                    placeholder={placeholder}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                )}
                {type === "date" && (
                  <input
                    id={id}
                    type="date"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                )}
                {type === "time" && (
                  <input
                    id={id}
                    type="time"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                )}
                {type === "datetime" && (
                  <input
                    id={id}
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                )}
                {type === "select" && (
                  <select
                    id={id}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="">{placeholder || "Select..."}</option>
                    {(options || []).map((opt, i) => (
                      <option key={i}>{opt}</option>
                    ))}
                  </select>
                )}
                {type === "multiselect" && (
                  <div className="mt-1 space-y-1">
                    {(options || []).map((opt, i) => (
                      <label key={i} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-[#6750A4]"
                        />
                        <span className="text-sm text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                {type === "radio" && (
                  <div className="mt-1 space-y-1">
                    {(options || []).map((opt, i) => (
                      <label key={i} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`radio-${field._id}`}
                          className="h-4 w-4 text-[#6750A4]"
                        />
                        <span className="text-sm text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                {type === "checkbox" && (
                  <div className="mt-1">
                    <label className="flex items-center gap-2">
                      <input
                        id={id}
                        type="checkbox"
                        className="h-4 w-4 text-[#6750A4]"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  </div>
                )}
                {type === "file" && (
                  <input
                    id={id}
                    type="file"
                    className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#6750A4] file:text-white hover:file:bg-[#5B46A0]"
                  />
                )}
                {type === "url" && (
                  <input
                    id={id}
                    type="url"
                    placeholder={placeholder}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                )}
                {description && (
                  <p className="text-xs text-gray-400 mt-1">{description}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Editor ──────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Customer Intake Form
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {fieldCount > 0
              ? `${fieldCount} field${fieldCount > 1 ? "s" : ""} · ${requiredCount} required`
              : "Collect additional booking information."}
          </p>
        </div>
        <div className="flex gap-2">
          {fieldsWithId.length > 0 && (
            <button
              type="button"
              onClick={() => setPreview(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
          )}
        </div>
      </div>

      {fieldsWithId.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-10 px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6750A4]/10">
            <ClipboardList className="h-6 w-6 text-[#6750A4]" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-gray-900">
            No intake fields yet
          </h3>
          <p className="mt-1 max-w-sm text-center text-xs text-gray-500">
            Collect additional information from customers before processing
            their request.
          </p>
          <button
            type="button"
            onClick={addField}
            className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#6750A4] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#5B46A0] focus:outline-none focus:ring-2 focus:ring-[#6750A4]/30 focus:ring-offset-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add your first field
          </button>
        </div>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fieldsWithId.map((f) => f._id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {fieldsWithId.map((field) => (
                    <FieldCard
                      key={field._id}
                      field={field}
                      updateField={(patch) => updateField(field._id, patch)}
                      removeField={() => removeField(field._id)}
                      duplicateField={() => duplicateField(field._id)}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </SortableContext>
          </DndContext>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={addField}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#6750A4] px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#5B46A0] transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Field
            </button>
          </div>
        </>
      )}
    </div>
  );
}