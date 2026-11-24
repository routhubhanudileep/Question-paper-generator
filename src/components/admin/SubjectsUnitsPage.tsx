import React, { useMemo, useState } from 'react';
import { BookMarked, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Subject, Unit } from '../../types';
import { ConfirmDialog, EmptyState, Modal } from '../ui/CommonUI';

export const SubjectsUnitsPage: React.FC = () => {
  const {
    subjects,
    units,
    questions,
    addSubject,
    updateSubject,
    deleteSubject,
    addUnit,
    updateUnit,
    deleteUnit,
  } = useApp();

  // Subject Modal
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subject | null>(null);
  const [subForm, setSubForm] = useState({
    code: '',
    name: '',
    department: 'Computer Science & Engineering',
  });
  const [subError, setSubError] = useState<string | null>(null);

  // Unit Modal
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitForm, setUnitForm] = useState({
    subjectId: '',
    unitNumber: 1,
    title: '',
    description: '',
  });
  const [unitError, setUnitError] = useState<string | null>(null);

  // Delete Targets
  const [deleteSubTarget, setDeleteSubTarget] = useState<Subject | null>(null);
  const [deleteUnitTarget, setDeleteUnitTarget] = useState<Unit | null>(null);

  const unitsBySubject = useMemo(() => {
    const map = new Map<string, Unit[]>();
    for (const s of subjects) {
      map.set(
        s.id,
        units
          .filter((u) => u.subjectId === s.id)
          .sort((a, b) => a.unitNumber - b.unitNumber),
      );
    }
    return map;
  }, [subjects, units]);

  const openAddSubject = () => {
    setEditingSub(null);
    setSubError(null);
    setSubForm({
      code: '',
      name: '',
      department: 'Computer Science & Engineering',
    });
    setSubModalOpen(true);
  };

  const openEditSubject = (sub: Subject) => {
    setEditingSub(sub);
    setSubError(null);
    setSubForm({
      code: sub.code,
      name: sub.name,
      department: sub.department,
    });
    setSubModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    setSubError(null);
    if (!subForm.code.trim() || !subForm.name.trim()) {
      setSubError('Subject code and name are required.');
      return;
    }
    const payload = {
      code: subForm.code.trim().toUpperCase(),
      name: subForm.name.trim(),
      department: subForm.department.trim() || 'General',
    };
    if (editingSub) {
      updateSubject(editingSub.id, payload);
    } else {
      addSubject(payload);
    }
    setSubModalOpen(false);
  };

  const openAddUnit = (subjectId: string) => {
    const existing = unitsBySubject.get(subjectId) ?? [];
    const nextNum =
      existing.length > 0
        ? Math.max(...existing.map((u) => u.unitNumber)) + 1
        : 1;
    setEditingUnit(null);
    setUnitError(null);
    setUnitForm({
      subjectId,
      unitNumber: nextNum,
      title: '',
      description: '',
    });
    setUnitModalOpen(true);
  };

  const openEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitError(null);
    setUnitForm({
      subjectId: unit.subjectId,
      unitNumber: unit.unitNumber,
      title: unit.title,
      description: unit.description,
    });
    setUnitModalOpen(true);
  };

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    setUnitError(null);
    if (!unitForm.title.trim()) {
      setUnitError('Unit title is required.');
      return;
    }
    if (unitForm.unitNumber < 1) {
      setUnitError('Unit number must be 1 or greater.');
      return;
    }
    const payload = {
      subjectId: unitForm.subjectId,
      unitNumber: unitForm.unitNumber,
      title: unitForm.title.trim(),
      description: unitForm.description.trim(),
    };
    if (editingUnit) {
      updateUnit(editingUnit.id, payload);
    } else {
      addUnit(payload);
    }
    setUnitModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Subjects &amp; Syllabus Units
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure academic courses and break each syllabus down into
            numbered units.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddSubject}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon={<BookMarked className="w-5 h-5" />}
          title="No subjects configured"
          description="Create your first subject and add syllabus units for faculty to populate questions."
          actionLabel="Add Subject"
          onAction={openAddSubject}
        />
      ) : (
        <div className="space-y-5">
          {subjects.map((sub) => {
            const subUnits = unitsBySubject.get(sub.id) ?? [];
            const qCount = questions.filter((q) => q.subjectId === sub.id).length;

            return (
              <div
                key={sub.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-700">
                        {sub.code}
                      </span>
                      <span className="text-slate-300" aria-hidden="true">
                        &middot;
                      </span>
                      <h2 className="text-base font-semibold text-slate-900">
                        {sub.name}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {sub.department} ·{' '}
                      <span className="font-mono tabular-nums">
                        {subUnits.length} units
                      </span>{' '}
                      ·{' '}
                      <span className="font-mono tabular-nums">
                        {qCount} questions
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openAddUnit(sub.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Unit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditSubject(sub)}
                      title="Edit Subject"
                      className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteSubTarget(sub)}
                      title="Delete Subject"
                      className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {subUnits.length === 0 ? (
                  <div className="px-6 py-6 text-xs text-slate-500">
                    No syllabus units added yet for {sub.name}.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {subUnits.map((unit) => {
                      const unitQs = questions.filter(
                        (q) => q.unitId === unit.id,
                      ).length;
                      return (
                        <div
                          key={unit.id}
                          className="px-6 py-3.5 flex items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                              <span className="font-mono text-xs text-slate-500 mr-2">
                                Unit {unit.unitNumber}
                              </span>
                              {unit.title}
                            </p>
                            {unit.description && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {unit.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-mono text-slate-500 tabular-nums">
                              {unitQs} Qs
                            </span>
                            <button
                              type="button"
                              onClick={() => openEditUnit(unit)}
                              title="Edit Unit"
                              className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteUnitTarget(unit)}
                              title="Delete Unit"
                              className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Subject Modal */}
      <Modal
        open={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        title={editingSub ? 'Edit Subject' : 'Add Subject'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Course Code
            </label>
            <input
              type="text"
              value={subForm.code}
              onChange={(e) =>
                setSubForm((prev) => ({ ...prev, code: e.target.value }))
              }
              placeholder="e.g. CS304"
              className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Subject Name
            </label>
            <input
              type="text"
              value={subForm.name}
              onChange={(e) =>
                setSubForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Operating Systems"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Department
            </label>
            <input
              type="text"
              value={subForm.department}
              onChange={(e) =>
                setSubForm((prev) => ({ ...prev, department: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
          {subError && (
            <p className="text-xs font-medium text-red-700">{subError}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSubModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
            >
              {editingSub ? 'Save Subject' : 'Create Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Unit Modal */}
      <Modal
        open={unitModalOpen}
        onClose={() => setUnitModalOpen(false)}
        title={editingUnit ? 'Edit Syllabus Unit' : 'Add Syllabus Unit'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveUnit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Unit Number
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={unitForm.unitNumber}
              onChange={(e) =>
                setUnitForm((prev) => ({
                  ...prev,
                  unitNumber: Number(e.target.value) || 1,
                }))
              }
              className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Unit Title
            </label>
            <input
              type="text"
              value={unitForm.title}
              onChange={(e) =>
                setUnitForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g. Process Synchronization"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Topics Covered
            </label>
            <textarea
              rows={2}
              value={unitForm.description}
              onChange={(e) =>
                setUnitForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Brief syllabus outline..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
          {unitError && (
            <p className="text-xs font-medium text-red-700">{unitError}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setUnitModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
            >
              {editingUnit ? 'Save Unit' : 'Add Unit'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteSubTarget)}
        title="Delete Subject"
        message={`Deleting "${deleteSubTarget?.name}" will also remove its syllabus units and bank questions. Continue?`}
        onConfirm={() => {
          if (deleteSubTarget) deleteSubject(deleteSubTarget.id);
          setDeleteSubTarget(null);
        }}
        onCancel={() => setDeleteSubTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteUnitTarget)}
        title="Delete Unit"
        message={`Delete "Unit ${deleteUnitTarget?.unitNumber}: ${deleteUnitTarget?.title}" and its unit questions?`}
        onConfirm={() => {
          if (deleteUnitTarget) deleteUnit(deleteUnitTarget.id);
          setDeleteUnitTarget(null);
        }}
        onCancel={() => setDeleteUnitTarget(null)}
      />
    </div>
  );
};
