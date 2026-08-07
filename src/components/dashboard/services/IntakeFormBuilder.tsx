import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import type { IntakeFormField } from "../../../types";

// ---------------------------------------------------------------------------
//  Extended field type – adds an internal unique id that we never strip
// ---------------------------------------------------------------------------
type FieldWithId = IntakeFormField & { _id: number };

// ---------------------------------------------------------------------------
//  Auto‑incrementing ID counter (preserved across renders)
// ---------------------------------------------------------------------------
let nextId = 1;

// ---------------------------------------------------------------------------
//  Icons & labels
// ---------------------------------------------------------------------------
const FIELD_TYPE_ICONS: Record<IntakeFormField["type"], React.ReactNode> = {
  text: <AlignLeft className="h-3.5 w-3.5" />,
  textarea: <AlignJustify className="h-3.5 w-3.5" />,
  select: <ChevronDown className="h-3.5 w-3.5" />,
  number: <Hash className="h-3.5 w-3.5" />,
  date: <Calendar className="h-3.5 w-3.5" />,
  checkbox: <CheckSquare className="h-3.5 w-3.5" />,
};

const FIELD_TYPES: IntakeFormField["type"][] = [
  "text",
  "textarea",
  "select",
  "number",
  "date",
  "checkbox",
];

const FIELD_TYPE_LABELS: Record<IntakeFormField["type"], string> = {
  text: "Text",
  textarea: "Textarea",
  select: "Select",
  number: "Number",
  date: "Date",
  checkbox: "Checkbox",
};

// ---------------------------------------------------------------------------
//  Toggle
// ---------------------------------------------------------------------------
function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#6750A4]/30 ${
        enabled ? "bg-[#6750A4]" : "bg-gray-200"
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition ${
          enabled ? "translate-x-[18px]" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
//  Portal‑based field type dropdown (avoids clipping)
// ---------------------------------------------------------------------------
function FieldTypeSelect({
  value,
  onChange,
}: {
  value: IntakeFormField["type"];
  onChange: (type: IntakeFormField["type"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null); // NEW ref for the dropdown container
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
      // Ignore clicks inside the trigger or inside the dropdown
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      console.log("[FieldTypeSelect] Outside click, closing dropdown");
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleOptionClick = (type: IntakeFormField["type"]) => {
    console.log("[FieldTypeSelect] Option clicked:", type);
    onChange(type);
    setOpen(false);
  };

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          console.log("[FieldTypeSelect] Trigger clicked, open:", !open);
          setOpen(!open);
        }}
        className="flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 hover:bg-white transition w-full focus:outline-none focus:ring-2 focus:ring-[#6750A4]/20"
      >
        <span className="text-gray-500">{FIELD_TYPE_ICONS[value]}</span>
        <span className="flex-1 text-left">{FIELD_TYPE_LABELS[value]}</span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>
      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-white border border-gray-200 rounded-xl shadow-xl py-1"
          >
            {FIELD_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOptionClick(type);
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 transition ${
                  value === type ? "bg-[#6750A4]/5 text-[#6750A4]" : "text-gray-700"
                }`}
              >
                <span className="text-gray-500">{FIELD_TYPE_ICONS[type]}</span>
                {FIELD_TYPE_LABELS[type]}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Delete confirmation popover
// ---------------------------------------------------------------------------
function DeletePopover({ onDelete }: { onDelete: () => void }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
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
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-30 w-56">
          <p className="text-sm text-gray-700 mb-2">Delete this field?</p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShow(false)}
              className="px-3 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { onDelete(); setShow(false); }}
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

// ---------------------------------------------------------------------------
//  Props
// ---------------------------------------------------------------------------
interface IntakeFormBuilderProps {
  fields: IntakeFormField[];
  onChange: (fields: IntakeFormField[]) => void;
}

// ---------------------------------------------------------------------------
//  Main builder component
// ---------------------------------------------------------------------------
export function IntakeFormBuilder({
  fields,
  onChange,
}: IntakeFormBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // -----------------------------------------------------------------------
  //  Stable internal IDs – we never strip _id, so parent state carries them.
  //  On first render, missing _id fields get a new one.
  // -----------------------------------------------------------------------
  const fieldsWithId: FieldWithId[] = fields.map((f) => ({
    ...f,
    _id: (f as FieldWithId)._id ?? nextId++,
  }));

  console.log("[IntakeFormBuilder] fieldsWithId:", fieldsWithId);

  const addField = useCallback(() => {
    const newField: FieldWithId = {
      name: `field_${nextId}`,
      type: "text",
      label: "New Field",
      required: false,
      placeholder: "",
      description: "",
      _id: nextId++,
    };
    console.log("[IntakeFormBuilder] Adding field:", newField);
    onChange([...fieldsWithId, newField]);
  }, [fieldsWithId, onChange]);

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
      console.log("[IntakeFormBuilder] Reordered fields:", reordered);
      onChange(reordered);
    },
    [fieldsWithId, onChange]
  );

  const updateField = useCallback(
    (id: number, patch: Partial<IntakeFormField>) => {
      const next = fieldsWithId.map((f) =>
        f._id === id ? { ...f, ...patch } : f
      );
      console.log("[IntakeFormBuilder] Updating field:", id, patch, next);
      onChange(next);
    },
    [fieldsWithId, onChange]
  );

  const removeField = useCallback(
    (id: number) => {
      console.log("[IntakeFormBuilder] Removing field:", id);
      onChange(fieldsWithId.filter((f) => f._id !== id));
    },
    [fieldsWithId, onChange]
  );

  const duplicateField = useCallback(
    (id: number) => {
      const idx = fieldsWithId.findIndex((f) => f._id === id);
      if (idx === -1) return;
      const original = fieldsWithId[idx];
      const copy: FieldWithId = {
        ...original,
        name: `${original.name}_copy`,
        label: `${original.label} (copy)`,
        _id: nextId++,
      };
      const next = [...fieldsWithId];
      next.splice(idx + 1, 0, copy);
      console.log("[IntakeFormBuilder] Duplicating field:", id, next);
      onChange(next);
    },
    [fieldsWithId, onChange]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Customer Intake Form</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Collect additional booking information.
          </p>
        </div>
        <button
          type="button"
          onClick={addField}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#6750A4] px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#5B46A0] transition"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Field
        </button>
      </div>

      {fieldsWithId.length === 0 ? (
        <EmptyState onAdd={addField} />
      ) : (
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
              <AnimatePresence>
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
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
//  FieldCard
// ---------------------------------------------------------------------------
function FieldCard({
  field,
  updateField,
  removeField,
  duplicateField,
}: {
  field: FieldWithId;
  updateField: (patch: Partial<IntakeFormField>) => void;
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
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <span className="text-gray-500 shrink-0">{FIELD_TYPE_ICONS[field.type]}</span>
        <span className="text-sm font-medium text-gray-900 truncate flex-1 min-w-0">
          {field.label || "Untitled"}
        </span>

        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 text-xs text-gray-600 shrink-0">
          {FIELD_TYPE_LABELS[field.type]}
        </span>

        {field.required && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#6750A4] shrink-0" title="Required" />
        )}

        <button
          type="button"
          onClick={duplicateField}
          title="Duplicate"
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>

        <DeletePopover onDelete={removeField} />

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0"
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
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
                      updateField({
                        label,
                        name: label.toLowerCase().replace(/\s+/g, "_").replace(/[^\w]/g, ""),
                      });
                    }}
                    placeholder="e.g. Customer name"
                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm placeholder:text-gray-400 focus:border-[#6750A4] focus:bg-white focus:ring-2 focus:ring-[#6750A4]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Field Type</label>
                  <FieldTypeSelect
                    value={field.type}
                    onChange={(type) => updateField({ type })}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Toggle enabled={field.required} onChange={(v) => updateField({ required: v })} />
                    <span className="text-xs font-medium text-gray-600">Required</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={field.placeholder || ""}
                    onChange={(e) => updateField({ placeholder: e.target.value })}
                    placeholder="Placeholder text"
                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm placeholder:text-gray-400 focus:border-[#6750A4] focus:bg-white focus:ring-2 focus:ring-[#6750A4]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Help Text</label>
                  <input
                    type="text"
                    value={field.description || ""}
                    onChange={(e) => updateField({ description: e.target.value })}
                    placeholder="Short description"
                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm placeholder:text-gray-400 focus:border-[#6750A4] focus:bg-white focus:ring-2 focus:ring-[#6750A4]/20 outline-none"
                  />
                </div>
              </div>

              {field.type === "select" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={(field.options || []).join(", ")}
                    onChange={(e) =>
                      updateField({
                        options: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="e.g. Small, Medium, Large"
                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm placeholder:text-gray-400 focus:border-[#6750A4] focus:bg-white focus:ring-2 focus:ring-[#6750A4]/20 outline-none"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

// ---------------------------------------------------------------------------
//  Empty state
// ---------------------------------------------------------------------------
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-10 px-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6750A4]/10">
        <ClipboardList className="h-6 w-6 text-[#6750A4]" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-gray-900">No intake fields</h3>
      <p className="mt-1 text-xs text-gray-500">Add custom questions to collect more information.</p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#6750A4] px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#5B46A0] transition"
      >
        <Plus className="h-3.5 w-3.5" />
        Add First Field
      </button>
    </div>
  );
}