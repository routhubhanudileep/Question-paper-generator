import React, { useState } from 'react';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  DifficultyLevel,
  PaperPattern,
  PatternSection,
  QuestionMarks,
} from '../../types';
import { createId } from '../../utils/storage';
import { ConfirmDialog, EmptyState, Modal } from '../ui/CommonUI';

interface PatternFormState {
  name: string;
  description: string;
  durationMinutes: number;
  sections: PatternSection[];
}

const createEmptySection = (index: number): PatternSection => ({
  id: createId('sec'),
  name: `Section ${String.fromCharCode(65 + index)}`,
  questionCount: 5,
  marksPerQuestion: 2,
  difficulty: 'Easy',
});

export const PatternsPage: React.FC = () => {
  const { patterns, addPattern, updatePattern, deletePattern } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<PaperPattern | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<PaperPattern | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState<PatternFormState>({
    name: '',
    description: '',
    durationMinutes: 90,
    sections: [createEmptySection(0)],
  });

  const computedTotalMarks = form.sections.reduce(
    (sum, s) => sum + s.questionCount * s.marksPerQuestion,
    0,
  );

  const openCreateModal = () => {
    setEditingPattern(null);
    setFormError(null);
    setForm({
      name: '',
      description: '',
      durationMinutes: 90,
      sections: [
        {
          id: createId('sec'),
          name: 'Section A — Short Questions',
          questionCount: 5,
          marksPerQuestion: 2,
          difficulty: 'Easy',
        },
        {
          id: createId('sec'),
          name: 'Section B — Medium Questions',
          questionCount: 4,
          marksPerQuestion: 5,
          difficulty: 'Medium',
        },
        {
          id: createId('sec'),
          name: 'Section C — Long Questions',
          questionCount: 2,
          marksPerQuestion: 10,
          difficulty: 'Hard',
        },
      ],
    });
    setModalOpen(true);
  };

  const openEditModal = (pattern: PaperPattern) => {
    setEditingPattern(pattern);
    setFormError(null);
    setForm({
      name: pattern.name,
      description: pattern.description,
      durationMinutes: pattern.durationMinutes,
      sections: pattern.sections.map((s) => ({ ...s })),
    });
    setModalOpen(true);
  };

  const addSectionRow = () => {
    setForm((prev) => ({
      ...prev,
      sections: [...prev.sections, createEmptySection(prev.sections.length)],
    }));
  };

  const removeSectionRow = (id: string) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id),
    }));
  };

  const updateSectionRow = (id: string, patch: Partial<PatternSection>) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (form.name.trim().length < 3) {
      setFormError('Pattern name must be at least 3 characters.');
      return;
    }
    if (form.durationMinutes < 15) {
      setFormError('Duration must be at least 15 minutes.');
      return;
    }
    if (form.sections.length === 0) {
      setFormError('Add at least one section to the pattern blueprint.');
      return;
    }
    for (const sec of form.sections) {
      if (!sec.name.trim() || sec.questionCount < 1) {
        setFormError(
          'Every section must have a title and at least 1 question.',
        );
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      durationMinutes: form.durationMinutes,
      totalMarks: computedTotalMarks,
      sections: form.sections.map((s) => ({ ...s, name: s.name.trim() })),
    };

    if (editingPattern) {
      updatePattern(editingPattern.id, payload);
    } else {
      addPattern(payload);
    }

    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Examination Paper Patterns
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Define official exam blueprints specifying section counts, mark
            weights, difficulty tiers, and duration.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Pattern</span>
        </button>
      </div>

      {patterns.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-5 h-5" />}
          title="No paper patterns defined"
          description="Create your first examination blueprint so faculty can generate standardized question papers."
          actionLabel="Create Pattern"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {patterns.map((pattern) => (
            <div
              key={pattern.id}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      {pattern.name}
                    </h2>
                    <p className="mt-1 text-xs font-mono text-slate-600 tabular-nums">
                      Total: {pattern.totalMarks} Marks · Duration:{' '}
                      {pattern.durationMinutes} mins · {pattern.sections.length}{' '}
                      sections
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(pattern)}
                      title="Edit Pattern"
                      className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(pattern)}
                      title="Delete Pattern"
                      className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {pattern.description && (
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    {pattern.description}
                  </p>
                )}

                <div className="mt-4 divide-y divide-slate-200 border border-slate-200 rounded-lg">
                  {pattern.sections.map((sec) => (
                    <div
                      key={sec.id}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="font-medium text-slate-900 truncate">
                        {sec.name}
                      </span>
                      <span className="font-mono text-slate-600 tabular-nums shrink-0">
                        {sec.questionCount} &times; {sec.marksPerQuestion}M ·{' '}
                        {sec.difficulty} (
                        {sec.questionCount * sec.marksPerQuestion}M)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pattern Builder Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPattern ? 'Edit Paper Pattern' : 'Create Paper Pattern'}
        subtitle="Total marks are calculated automatically from section counts and marks per question."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Pattern Title
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Mid-Term Examination (50 Marks)"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min={15}
                max={360}
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    durationMinutes: Number(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Brief guideline for faculty generating papers with this blueprint"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Blueprint Sections
              </span>
              <button
                type="button"
                onClick={addSectionRow}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Section</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {form.sections.map((sec) => (
                <div
                  key={sec.id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
                >
                  <div className="sm:col-span-5">
                    <label className="block text-xs text-slate-600 mb-1">
                      Section Name
                    </label>
                    <input
                      type="text"
                      value={sec.name}
                      onChange={(e) =>
                        updateSectionRow(sec.id, { name: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-600 mb-1">
                      Count
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={sec.questionCount}
                      onChange={(e) =>
                        updateSectionRow(sec.id, {
                          questionCount: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-600 mb-1">
                      Marks
                    </label>
                    <select
                      value={sec.marksPerQuestion}
                      onChange={(e) =>
                        updateSectionRow(sec.id, {
                          marksPerQuestion: Number(
                            e.target.value,
                          ) as QuestionMarks,
                        })
                      }
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900"
                    >
                      <option value={2}>2M</option>
                      <option value={5}>5M</option>
                      <option value={10}>10M</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-600 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={sec.difficulty}
                      onChange={(e) =>
                        updateSectionRow(sec.id, {
                          difficulty: e.target.value as DifficultyLevel,
                        })
                      }
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      disabled={form.sections.length <= 1}
                      onClick={() => removeSectionRow(sec.id)}
                      title="Remove Section"
                      className="p-1.5 text-slate-400 hover:text-red-700 disabled:opacity-30 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 text-sm font-medium text-slate-800">
              <span>Computed Blueprint Total</span>
              <span className="font-mono tabular-nums text-blue-700 font-semibold">
                {computedTotalMarks} Marks
              </span>
            </div>
          </div>

          {formError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700"
            >
              {formError}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
            >
              {editingPattern ? 'Save Pattern' : 'Create Pattern'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Pattern"
        message={`Delete "${deleteTarget?.name}"? Existing generated papers using this pattern will remain intact.`}
        onConfirm={() => {
          if (deleteTarget) deletePattern(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
