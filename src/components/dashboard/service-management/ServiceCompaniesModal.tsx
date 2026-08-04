import React, { useState, useEffect } from "react";
import { FormModal } from "../../ui/FormModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  allCompanies: { id: number; name: string }[];
  assignedIds: number[];
  onSave: (slug: string, companyIds: number[]) => Promise<void>;
}

const ServiceCompaniesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  slug,
  allCompanies,
  assignedIds,
  onSave,
}) => {
  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(assignedIds || []);
  }, [assignedIds]);

  const toggleCompany = (id: number) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave(slug, selected);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Companies to Service"
      onSubmit={handleSubmit}
      submitting={saving}
      maxWidth="sm"
    >
      <div className="space-y-3">
        {allCompanies.map(company => (
          <label key={company.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(company.id)}
              onChange={() => toggleCompany(company.id)}
            />
            {company.name}
          </label>
        ))}
      </div>
    </FormModal>
  );
};

export default ServiceCompaniesModal;