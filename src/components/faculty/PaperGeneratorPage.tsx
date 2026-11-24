import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  Send,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GeneratedSection } from '../../types';
import {
  checkBankAvailability,
  generatePaperSections,
  replaceSingleQuestion,
} from '../../utils/paperGenerator';
import { FormalPaperPreview } from '../papers/FormalPaperPreview';

interface PaperGeneratorPageProps {
  onPaperSaved: () => void;
}

export const PaperGeneratorPage: React.FC<PaperGeneratorPageProps> = ({
  onPaperSaved,
}) => {
  const {
    subjects,
    units,
    questions,
    patterns,
    savePaper,
    notify,
  } = useApp();

  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id ?? '');
  const [patternId, setPatternId] = useState<string>(patterns[0]?.id ?? '');
  const [examName, setExamName] = useState<string>('Mid-Term Examination — 2026');
  const [instructions, setInstructions] = useState<string>(
    'Answer all questions. Figures to the right indicate full marks. Draw neat, labeled diagrams wherever necessary.',
  );
  const [releaseDateTime, setReleaseDateTime] = useState<string>('');
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

  const [generatedSections, setGeneratedSections] = useState<
    GeneratedSection[] | null
  >(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState<boolean>(false);

  const subjectUnits = useMemo(
    () =>
      units
        .filter((u) => u.subjectId === subjectId)
        .sort((a, b) => a.unitNumber - b.unitNumber),
    [subjectId, units],
  );

  // Auto-select all units whenever subject changes
  useEffect(() => {
    setSelectedUnitIds(subjectUnits.map((u) => u.id));
    setGeneratedSections(null);
    setGenerationError(null);
  }, [subjectUnits]);

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === subjectId),
    [subjectId, subjects],
  );

  const selectedPattern = useMemo(
    () => patterns.find((p) => p.id === patternId),
    [patternId, patterns],
  );

  const questionsMap = useMemo(
    () => new Map(questions.map((q) => [q.id, q])),
    [questions],
  );

  const liveShortages = useMemo(() => {
    if (!selectedPattern || !subjectId) return [];
    return checkBankAvailability({
      subjectId,
      pattern: selectedPattern,
      selectedUnitIds,
      allQuestions: questions,
    });
  }, [questions, selectedPattern, selectedUnitIds, subjectId]);

  const toggleUnit = (unitId: string) => {
    setSelectedUnitIds((prev) =>
      prev.includes(unitId)
        ? prev.filter((id) => id !== unitId)
        : [...prev, unitId],
    );
  };

  const handleGenerate = () => {
    setGenerationError(null);
    if (!examName.trim()) {
      setGenerationError('Please enter an Examination Name before generating.');
      return;
    }
    if (!selectedPattern) {
      setGenerationError('Please select a valid Paper Pattern.');
      return;
    }
    if (selectedUnitIds.length === 0) {
      setGenerationError('Select at least one syllabus unit to cover.');
      return;
    }

    const result = generatePaperSections({
      subjectId,
      pattern: selectedPattern,
      selectedUnitIds,
      allQuestions: questions,
    });

    if (!result.success || !result.sections) {
      setGeneratedSections(null);
      setGenerationError(
        result.errorMessage ?? 'Unable to generate paper from current bank.',
      );
      notify('error', 'Insufficient questions', result.errorMessage);
      return;
    }

    setGeneratedSections(result.sections);
    notify(
      'success',
      'Question paper generated',
      `${result.calculatedMarks} marks assembled across ${result.sections.length} sections.`,
    );
  };

  const handleReplaceQuestion = (sectionId: string, questionId: string) => {
    if (!generatedSections) return;
    const currentQ = questionsMap.get(questionId);
    if (!currentQ) return;

    const result = replaceSingleQuestion(
      { subjectId, sections: generatedSections },
      currentQ,
      questions,
    );

    if (!result.success || !result.replacementQuestion) {
      notify('warning', 'Cannot replace question', result.errorMessage);
      return;
    }

    const replacement = result.replacementQuestion;
    setGeneratedSections((prev) =>
      prev
        ? prev.map((sec) =>
            sec.sectionId === sectionId
              ? {
                  ...sec,
                  questionIds: sec.questionIds.map((id) =>
                    id === questionId ? replacement.id : id,
                  ),
                }
              : sec,
          )
        : prev,
    );

    notify(
      'success',
      'Question replaced',
      result.note ??
        `Swapped with another ${replacement.marks}-mark question from the same unit.`,
    );
  };

  const handlePersistPaper = (status: 'Draft' | 'Pending') => {
    if (!generatedSections || !selectedPattern) return;
    if (!examName.trim()) {
      notify('error', 'Exam name required', 'Please provide an exam title.');
      return;
    }

    savePaper({
      examName: examName.trim(),
      subjectId,
      patternId: selectedPattern.id,
      patternName: selectedPattern.name,
      selectedUnitIds,
      totalMarks: selectedPattern.totalMarks,
      durationMinutes: selectedPattern.durationMinutes,
      instructions: instructions.trim(),
      sections: generatedSections,
      status,
      releaseDateTime: releaseDateTime || undefined,
    });

    notify(
      'success',
      status === 'Pending'
        ? 'Submitted for HOD Approval'
        : 'Saved as Draft',
    );
    onPaperSaved();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Paper Generator
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Select a subject, pattern blueprint, and syllabus units to assemble a
          non-repeating examination paper.
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label
              htmlFor="gen-subject"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Subject
            </label>
            <select
              id="gen-subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
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
            <label
              htmlFor="gen-exam-name"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Examination Name
            </label>
            <input
              id="gen-exam-name"
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g. Mid-Term Examination — Fall 2026"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="gen-pattern"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Paper Pattern Blueprint
            </label>
            <select
              id="gen-pattern"
              value={patternId}
              onChange={(e) => {
                setPatternId(e.target.value);
                setGeneratedSections(null);
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {patterns.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.totalMarks}M · {p.durationMinutes} mins)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Pattern Summary */}
        {selectedPattern && (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-700">
                Blueprint Breakdown: {selectedPattern.name}
              </span>
              <span className="text-xs font-mono text-slate-600 tabular-nums">
                Total: {selectedPattern.totalMarks} Marks ·{' '}
                {selectedPattern.durationMinutes} Minutes
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
              {selectedPattern.sections.map((sec) => (
                <div
                  key={sec.id}
                  className="bg-white border border-slate-200 rounded-md px-3 py-2"
                >
                  <p className="font-medium text-slate-900 truncate">
                    {sec.name}
                  </p>
                  <p className="mt-0.5 font-mono tabular-nums text-slate-500">
                    {sec.questionCount} &times; {sec.marksPerQuestion}M (
                    {sec.difficulty}) ={' '}
                    {sec.questionCount * sec.marksPerQuestion}M
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Units Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-700">
              Syllabus Units to Cover
            </span>
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() =>
                  setSelectedUnitIds(subjectUnits.map((u) => u.id))
                }
                className="font-medium text-blue-700 hover:text-blue-800"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setSelectedUnitIds([])}
                className="font-medium text-slate-500 hover:text-slate-700"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {subjectUnits.map((unit) => {
              const checked = selectedUnitIds.includes(unit.id);
              const unitQCount = questions.filter(
                (q) => q.unitId === unit.id,
              ).length;
              return (
                <label
                  key={unit.id}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checked
                      ? 'bg-blue-50/50 border-blue-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleUnit(unit.id)}
                    className="mt-0.5 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900">
                      Unit {unit.unitNumber}: {unit.title}
                    </p>
                    <p className="text-xs font-mono text-slate-500 tabular-nums mt-0.5">
                      {unitQCount} questions
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Instructions & Optional Release Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <label
              htmlFor="gen-instructions"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Exam Instructions
            </label>
            <textarea
              id="gen-instructions"
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="gen-release"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Optional Release Date &amp; Time
            </label>
            <input
              id="gen-release"
              type="datetime-local"
              value={releaseDateTime}
              onChange={(e) => setReleaseDateTime(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p className="mt-1 text-xs text-slate-500">
              Leave blank if release schedule is TBD.
            </p>
          </div>
        </div>

        {/* Shortage Warning (Live) */}
        {selectedUnitIds.length > 0 && liveShortages.length > 0 && (
          <div
            role="alert"
            className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-semibold">
                Question Bank Shortage Detected for Selected Units
              </p>
              <ul className="list-disc ml-4 space-y-0.5">
                {liveShortages.map((s) => (
                  <li key={s.sectionId}>
                    <span className="font-medium">{s.sectionName}</span>{' '}
                    requires{' '}
                    <span className="font-mono font-semibold">
                      {s.required}
                    </span>{' '}
                    {s.difficulty} ({s.marksPerQuestion}M) questions, but only{' '}
                    <span className="font-mono font-semibold">
                      {s.available}
                    </span>{' '}
                    available. Select additional units or add questions to the
                    bank.
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {generationError && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700"
          >
            {generationError}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {generatedSections ? 'Regenerate Whole Paper' : 'Generate Paper'}
            </span>
          </button>
        </div>
      </div>

      {/* Generated Paper Preview & Submission Bar */}
      {generatedSections && selectedPattern && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Generated Paper Preview
              </h2>
              <p className="text-xs text-slate-500">
                Use &ldquo;Replace&rdquo; on any question to swap it with
                another question of the same marks and unit.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowAnswers((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                {showAnswers ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide Answers</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show Answers</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>

              <button
                type="button"
                onClick={() => handlePersistPaper('Draft')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={() => handlePersistPaper('Pending')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for HOD Approval</span>
              </button>
            </div>
          </div>

          <FormalPaperPreview
            paper={{
              examName,
              subjectId,
              totalMarks: selectedPattern.totalMarks,
              durationMinutes: selectedPattern.durationMinutes,
              instructions,
              sections: generatedSections,
              releaseDateTime: releaseDateTime || undefined,
            }}
            subject={selectedSubject}
            units={units}
            questionsMap={questionsMap}
            showAnswers={showAnswers}
            canReplaceQuestions
            onReplaceQuestion={handleReplaceQuestion}
          />
        </div>
      )}
    </div>
  );
};
