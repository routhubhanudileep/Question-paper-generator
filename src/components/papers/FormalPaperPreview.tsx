import React, { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Question, QuestionPaper, Subject, Unit } from '../../types';

interface FormalPaperPreviewProps {
  paper: Pick<
    QuestionPaper,
    | 'examName'
    | 'subjectId'
    | 'totalMarks'
    | 'durationMinutes'
    | 'instructions'
    | 'sections'
    | 'releaseDateTime'
  >;
  subject?: Subject;
  units: Unit[];
  questionsMap: Map<string, Question>;
  showAnswers?: boolean;
  canReplaceQuestions?: boolean;
  onReplaceQuestion?: (sectionId: string, questionId: string) => void;
}

export const FormalPaperPreview: React.FC<FormalPaperPreviewProps> = ({
  paper,
  subject,
  units,
  questionsMap,
  showAnswers = false,
  canReplaceQuestions = false,
  onReplaceQuestion,
}) => {
  const unitMap = useMemo(() => new Map(units.map((u) => [u.id, u])), [units]);

  const formattedDate = useMemo(() => {
    if (!paper.releaseDateTime) {
      return new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    const d = new Date(paper.releaseDateTime);
    if (Number.isNaN(d.getTime())) return paper.releaseDateTime;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [paper.releaseDateTime]);

  let runningIndex = 1;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 text-slate-900 print-only-sheet">
      {/* Formal University Examination Header */}
      <div className="text-center border-b border-slate-900 pb-5">
        <p className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
          National Institute of Engineering &amp; Technology
        </p>
        <h2 className="mt-1.5 text-xl font-bold text-slate-900">
          {paper.examName || 'Examination Question Paper'}
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-700">
          {subject
            ? `${subject.code} · ${subject.name} · ${subject.department}`
            : 'Subject'}
        </p>

        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm font-medium text-slate-800">
          <span className="font-mono tabular-nums">
            Time: {paper.durationMinutes} Minutes
          </span>
          <span className="font-mono tabular-nums">Date: {formattedDate}</span>
          <span className="font-mono tabular-nums">
            Maximum Marks: {paper.totalMarks}
          </span>
        </div>
      </div>

      {/* General Instructions */}
      {paper.instructions.trim() && (
        <div className="mt-5 pb-4 border-b border-slate-200">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            General Instructions
          </h3>
          <p className="mt-1.5 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {paper.instructions}
          </p>
        </div>
      )}

      {/* Sections & Questions */}
      <div className="mt-6 space-y-8">
        {paper.sections.map((section) => {
          const sectionMarks =
            section.questionIds.length * section.marksPerQuestion;

          return (
            <section key={section.sectionId}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b border-slate-300 bg-slate-50 px-3 py-2 rounded-md">
                <h3 className="text-sm font-semibold text-slate-900">
                  {section.sectionName}
                </h3>
                <span className="text-xs font-mono text-slate-600 tabular-nums">
                  {section.questionIds.length} &times; {section.marksPerQuestion}{' '}
                  = {sectionMarks} Marks · {section.difficulty}
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {section.questionIds.map((qId) => {
                  const q = questionsMap.get(qId);
                  const qNum = runningIndex++;

                  if (!q) {
                    return (
                      <div
                        key={qId}
                        className="text-sm text-red-600 py-2 border-b border-slate-100"
                      >
                        Q{qNum}. Question record missing ({qId})
                      </div>
                    );
                  }

                  const unit = unitMap.get(q.unitId);

                  return (
                    <div
                      key={q.id}
                      className="pb-4 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 leading-relaxed">
                            <span className="font-semibold font-mono mr-2">
                              Q{qNum}.
                            </span>
                            {q.text}
                          </p>

                          {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                            <div className="mt-2.5 ml-6 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm text-slate-700">
                              {q.options.map((opt, idx) => (
                                <div key={idx}>
                                  <span className="font-mono text-xs text-slate-500 mr-1.5">
                                    ({String.fromCharCode(97 + idx)})
                                  </span>
                                  <span>{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {showAnswers && (
                            <div className="mt-2.5 ml-6 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                              <span className="font-semibold text-slate-900">
                                Model Answer:{' '}
                              </span>
                              {q.answer}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-xs font-mono font-medium text-slate-700 tabular-nums whitespace-nowrap">
                            [{q.marks}M
                            {unit ? ` · Unit ${unit.unitNumber}` : ''}]
                          </span>

                          {canReplaceQuestions && onReplaceQuestion && (
                            <button
                              type="button"
                              onClick={() =>
                                onReplaceQuestion(section.sectionId, q.id)
                              }
                              title="Replace with another question of the same marks and unit"
                              className="no-print inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors whitespace-nowrap"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Replace</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
