import React, { useMemo, useState } from 'react';
import { BookOpen, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  DifficultyLevel,
  Question,
  QuestionMarks,
  QuestionType,
} from '../../types';
import {
  ConfirmDialog,
  DifficultyText,
  EmptyState,
  Modal,
} from '../ui/CommonUI';

interface QuestionFormState {
  subjectId: string;
  unitId: string;
  marks: QuestionMarks;
  difficulty: DifficultyLevel;
  type: QuestionType;
  text: string;
  answer: string;
  options: [string, string, string, string];
}

export const QuestionBankPage: React.FC = () => {
  const {
    subjects,
    units,
    questions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
  } = useApp();

  // Filters
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');
  const [filterMarks, setFilterMarks] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const defaultSubjectId = subjects[0]?.id ?? '';
  const defaultUnitId =
    units.find((u) => u.subjectId === defaultSubjectId)?.id ?? '';

  const [form, setForm] = useState<QuestionFormState>({
    subjectId: defaultSubjectId,
    unitId: defaultUnitId,
    marks: 2,
    difficulty: 'Easy',
    type: 'Short',
    text: '',
    answer: '',
    options: ['', '', '', ''],
  });

  const subjectMap = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );
  const unitMap = useMemo(() => new Map(units.map((u) => [u.id, u])), [units]);

  const filterUnits = useMemo(() => {
    const list =
      filterSubject === 'all'
        ? units
        : units.filter((u) => u.subjectId === filterSubject);
    return [...list].sort((a, b) => a.unitNumber - b.unitNumber);
  }, [filterSubject, units]);

  const formUnits = useMemo(
    () =>
      units
        .filter((u) => u.subjectId === form.subjectId)
        .sort((a, b) => a.unitNumber - b.unitNumber),
    [form.subjectId, units],
  );

  const filteredQuestions = useMemo(() => {
    const qLower = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (filterSubject !== 'all' && q.subjectId !== filterSubject) return false;
      if (filterUnit !== 'all' && q.unitId !== filterUnit) return false;
      if (filterMarks !== 'all' && q.marks !== Number(filterMarks)) return false;
      if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty)
        return false;
      if (filterType !== 'all' && q.type !== filterType) return false;
      if (
        qLower &&
        !q.text.toLowerCase().includes(qLower) &&
        !q.answer.toLowerCase().includes(qLower)
      ) {
        return false;
      }
      return true;
    });
  }, [
    filterDifficulty,
    filterMarks,
    filterSubject,
    filterType,
    filterUnit,
    questions,
    search,
  ]);

  const openAddModal = () => {
    const sId =
      filterSubject !== 'all' ? filterSubject : (subjects[0]?.id ?? '');
    const uId =
      units
        .filter((u) => u.subjectId === sId)
        .sort((a, b) => a.unitNumber - b.unitNumber)[0]?.id ?? '';
    setEditingQuestion(null);
    setFormError(null);
    setForm({
      subjectId: sId,
      unitId: uId,
      marks: 2,
      difficulty: 'Easy',
      type: 'Short',
      text: '',
      answer: '',
      options: ['', '', '', ''],
    });
    setFormOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setFormError(null);
    setForm({
      subjectId: q.subjectId,
      unitId: q.unitId,
      marks: q.marks,
      difficulty: q.difficulty,
      type: q.type,
      text: q.text,
      answer: q.answer,
      options: [
        q.options?.[0] ?? '',
        q.options?.[1] ?? '',
        q.options?.[2] ?? '',
        q.options?.[3] ?? '',
      ],
    });
    setFormOpen(true);
  };

  const handleSubjectChangeInForm = (newSubjectId: string) => {
    const firstUnit = units
      .filter((u) => u.subjectId === newSubjectId)
      .sort((a, b) => a.unitNumber - b.unitNumber)[0];
    setForm((prev) => ({
      ...prev,
      subjectId: newSubjectId,
      unitId: firstUnit?.id ?? '',
    }));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.subjectId || !form.unitId) {
      setFormError('Please select both a subject and a syllabus unit.');
      return;
    }
    if (form.text.trim().length < 8) {
      setFormError('Question text must be at least 8 characters long.');
      return;
    }
    if (form.answer.trim().length < 2) {
      setFormError('Please provide a model answer or marking scheme.');
      return;
    }

    let cleanedOptions: string[] | undefined;
    if (form.type === 'MCQ') {
      cleanedOptions = form.options.map((o) => o.trim());
      if (cleanedOptions.some((o) => o.length === 0)) {
        setFormError('All four MCQ options (a, b, c, d) are required.');
        return;
      }
    }

    const payload = {
      subjectId: form.subjectId,
      unitId: form.unitId,
      marks: form.marks,
      difficulty: form.difficulty,
      type: form.type,
      text: form.text.trim(),
      answer: form.answer.trim(),
      options: cleanedOptions,
    };

    if (editingQuestion) {
      updateQuestion(editingQuestion.id, payload);
    } else {
      addQuestion(payload);
    }

    setFormOpen(false);
  };

  const resetFilters = () => {
    setSearch('');
    setFilterSubject('all');
    setFilterUnit('all');
    setFilterMarks('all');
    setFilterDifficulty('all');
    setFilterType('all');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Question Bank
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage curriculum-mapped questions across subjects, units, marks,
            and difficulty tiers.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Question</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search question or answer text..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="Filter by subject"
              value={filterSubject}
              onChange={(e) => {
                setFilterSubject(e.target.value);
                setFilterUnit('all');
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Filter by unit"
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Units</option>
              {filterUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  Unit {u.unitNumber}: {u.title}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <select
              aria-label="Filter by marks"
              value={filterMarks}
              onChange={(e) => setFilterMarks(e.target.value)}
              className="w-full px-2.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Marks</option>
              <option value="2">2M</option>
              <option value="5">5M</option>
              <option value="10">10M</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <select
              aria-label="Filter by difficulty"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full px-2.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Level</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <select
              aria-label="Filter by type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-2.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Type</option>
              <option value="Short">Short</option>
              <option value="Long">Long</option>
              <option value="MCQ">MCQ</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono tabular-nums">
            Showing {filteredQuestions.length} of {questions.length} questions
          </span>
          {(search ||
            filterSubject !== 'all' ||
            filterUnit !== 'all' ||
            filterMarks !== 'all' ||
            filterDifficulty !== 'all' ||
            filterType !== 'all') && (
            <button
              type="button"
              onClick={resetFilters}
              className="font-medium text-blue-700 hover:text-blue-800"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredQuestions.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-5 h-5" />}
          title="No matching questions found"
          description="Try clearing active filters or add a new question to expand your examination bank."
          actionLabel="Add Question"
          onAction={openAddModal}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Question &amp; Curriculum</th>
                  <th className="py-3 px-4 whitespace-nowrap">Marks</th>
                  <th className="py-3 px-4 whitespace-nowrap">Difficulty</th>
                  <th className="py-3 px-4 whitespace-nowrap">Type</th>
                  <th className="py-3 px-4 whitespace-nowrap">Last Used</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredQuestions.map((q) => {
                  const sub = subjectMap.get(q.subjectId);
                  const unit = unitMap.get(q.unitId);
                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 max-w-xl">
                        <p className="font-medium text-slate-900 line-clamp-2">
                          {q.text}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {sub ? `${sub.code} · ${sub.name}` : 'Unknown'}{' '}
                          {unit ? `· Unit ${unit.unitNumber}: ${unit.title}` : ''}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-800 whitespace-nowrap">
                        {q.marks}M
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <DifficultyText difficulty={q.difficulty} />
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap">
                        {q.type}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {q.lastUsedDate
                          ? new Date(q.lastUsedDate).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingQuestion(q)}
                            title="View Answer"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(q)}
                            title="Edit Question"
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(q)}
                            title="Delete Question"
                            className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Question Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingQuestion ? 'Edit Question' : 'Add Question to Bank'}
        subtitle="Provide accurate syllabus mapping, marks, and a clear model answer."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Subject
              </label>
              <select
                value={form.subjectId}
                onChange={(e) => handleSubjectChangeInForm(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Syllabus Unit
              </label>
              <select
                value={form.unitId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, unitId: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {formUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    Unit {u.unitNumber}: {u.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Marks
              </label>
              <select
                value={form.marks}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    marks: Number(e.target.value) as QuestionMarks,
                  }))
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value={2}>2 Marks</option>
                <option value={5}>5 Marks</option>
                <option value={10}>10 Marks</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Difficulty
              </label>
              <select
                value={form.difficulty}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    difficulty: e.target.value as DifficultyLevel,
                  }))
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Question Type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    type: e.target.value as QuestionType,
                  }))
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Short">Short</option>
                <option value="Long">Long</option>
                <option value="MCQ">MCQ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Question Text
            </label>
            <textarea
              rows={3}
              value={form.text}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, text: e.target.value }))
              }
              placeholder="Enter the exact question prompt as it should appear on the exam paper..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {form.type === 'MCQ' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Multiple Choice Options
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {form.options.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const next = [...form.options] as [
                        string,
                        string,
                        string,
                        string,
                      ];
                      next[idx] = e.target.value;
                      setForm((prev) => ({ ...prev, options: next }));
                    }}
                    placeholder={`Option (${String.fromCharCode(97 + idx)})`}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Model Answer / Marking Key
            </label>
            <textarea
              rows={3}
              value={form.answer}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, answer: e.target.value }))
              }
              placeholder="Enter the expected answer for the Answer Key PDF..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
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
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
            >
              {editingQuestion ? 'Save Changes' : 'Add Question'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Question Details Modal */}
      <Modal
        open={Boolean(viewingQuestion)}
        onClose={() => setViewingQuestion(null)}
        title="Question Details & Model Answer"
        maxWidth="max-w-xl"
      >
        {viewingQuestion && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-medium text-slate-900">
                {subjectMap.get(viewingQuestion.subjectId)?.name}
              </span>
              <span>&middot;</span>
              <span>
                Unit {unitMap.get(viewingQuestion.unitId)?.unitNumber}:{' '}
                {unitMap.get(viewingQuestion.unitId)?.title}
              </span>
              <span>&middot;</span>
              <span className="font-mono">{viewingQuestion.marks} Marks</span>
              <span>&middot;</span>
              <DifficultyText difficulty={viewingQuestion.difficulty} />
              <span>&middot;</span>
              <span>{viewingQuestion.type}</span>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Question
              </p>
              <p className="text-sm text-slate-900 leading-relaxed">
                {viewingQuestion.text}
              </p>
              {viewingQuestion.type === 'MCQ' && viewingQuestion.options && (
                <ul className="mt-3 space-y-1 text-sm text-slate-700">
                  {viewingQuestion.options.map((opt, idx) => (
                    <li key={idx}>
                      <span className="font-mono text-xs text-slate-500 mr-1.5">
                        ({String.fromCharCode(97 + idx)})
                      </span>
                      {opt}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 rounded-lg bg-white border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Model Answer
              </p>
              <p className="text-sm text-slate-800 leading-relaxed">
                {viewingQuestion.answer}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Question"
        message="Are you sure you want to permanently remove this question from the bank? Existing generated papers will not retain its text."
        onConfirm={() => {
          if (deleteTarget) deleteQuestion(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
