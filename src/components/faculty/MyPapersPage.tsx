import React, { useMemo, useState } from 'react';
import {
  Download,
  Eye,
  FileCheck2,
  FileKey2,
  Printer,
  Send,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaperStatus, QuestionPaper } from '../../types';
import {
  downloadAnswerKeyPDF,
  downloadQuestionPaperPDF,
} from '../../utils/pdfExporter';
import { FormalPaperPreview } from '../papers/FormalPaperPreview';
import {
  ConfirmDialog,
  EmptyState,
  Modal,
  StatusLabel,
} from '../ui/CommonUI';

interface MyPapersPageProps {
  onGoToGenerator: () => void;
}

const STATUS_TABS: { key: 'all' | PaperStatus; label: string }[] = [
  { key: 'all', label: 'All Papers' },
  { key: 'Draft', label: 'Drafts' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Approved', label: 'Approved' },
  { key: 'Rejected', label: 'Rejected' },
];

export const MyPapersPage: React.FC<MyPapersPageProps> = ({
  onGoToGenerator,
}) => {
  const {
    papers,
    subjects,
    units,
    questions,
    submitPaperForApproval,
    deletePaper,
    logPaperEvent,
    notify,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | PaperStatus>('all');
  const [previewPaper, setPreviewPaper] = useState<QuestionPaper | null>(null);
  const [showAnswersInPreview, setShowAnswersInPreview] = useState(false);
  const [submitTarget, setSubmitTarget] = useState<QuestionPaper | null>(null);
  const [releaseInput, setReleaseInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<QuestionPaper | null>(null);

  const subjectMap = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );
  const questionsMap = useMemo(
    () => new Map(questions.map((q) => [q.id, q])),
    [questions],
  );

  const filteredPapers = useMemo(() => {
    if (statusFilter === 'all') return papers;
    return papers.filter((p) => p.status === statusFilter);
  }, [papers, statusFilter]);

  const handleOpenPreview = (paper: QuestionPaper) => {
    setPreviewPaper(paper);
    setShowAnswersInPreview(false);
    logPaperEvent(paper, 'Viewed', 'Opened question paper preview.');
  };

  const handleDownloadPaper = (paper: QuestionPaper) => {
    const sub = subjectMap.get(paper.subjectId);
    if (!sub) return;
    downloadQuestionPaperPDF({
      paper,
      subject: sub,
      units,
      questionsMap,
    });
    logPaperEvent(
      paper,
      'Downloaded Paper',
      `Exported "${paper.examName}" Question Paper PDF.`,
    );
    notify('success', 'Question Paper PDF downloaded');
  };

  const handleDownloadAnswerKey = (paper: QuestionPaper) => {
    const sub = subjectMap.get(paper.subjectId);
    if (!sub) return;
    downloadAnswerKeyPDF({
      paper,
      subject: sub,
      units,
      questionsMap,
    });
    logPaperEvent(
      paper,
      'Downloaded Answer Key',
      `Exported "${paper.examName}" Answer Key PDF.`,
    );
    notify('success', 'Answer Key PDF downloaded');
  };

  const openSubmitDialog = (paper: QuestionPaper) => {
    setSubmitTarget(paper);
    setReleaseInput(paper.releaseDateTime ?? '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Generated Question Papers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track submission status, review HOD feedback, and export approved
            papers and answer keys as PDF.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToGenerator}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          New Question Paper
        </button>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                active
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Papers List */}
      {filteredPapers.length === 0 ? (
        <EmptyState
          icon={<FileCheck2 className="w-5 h-5" />}
          title="No question papers in this view"
          description="Generate a new question paper from your question bank or switch status filters."
          actionLabel="Generate Paper"
          onAction={onGoToGenerator}
        />
      ) : (
        <div className="space-y-3">
          {filteredPapers.map((paper) => {
            const sub = subjectMap.get(paper.subjectId);
            const isApproved = paper.status === 'Approved';
            const canSubmit =
              paper.status === 'Draft' || paper.status === 'Rejected';

            return (
              <div
                key={paper.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-base font-semibold text-slate-900">
                      {paper.examName}
                    </h2>
                    <StatusLabel status={paper.status} />
                  </div>

                  <p className="text-xs text-slate-600">
                    {sub ? `${sub.code} · ${sub.name}` : 'Unknown Subject'}{' '}
                    &middot; {paper.patternName} &middot;{' '}
                    <span className="font-mono tabular-nums">
                      {paper.totalMarks} Marks
                    </span>{' '}
                    &middot;{' '}
                    <span className="font-mono tabular-nums">
                      {paper.durationMinutes} mins
                    </span>
                  </p>

                  <p className="text-xs text-slate-500 font-mono tabular-nums">
                    Created {new Date(paper.createdAt).toLocaleDateString()}
                    {paper.releaseDateTime
                      ? ` · Release: ${new Date(
                          paper.releaseDateTime,
                        ).toLocaleString()}`
                      : ''}
                  </p>

                  {paper.hodComment && (
                    <p className="text-xs text-slate-700 pt-1">
                      <span className="font-semibold">HOD Note: </span>
                      {paper.hodComment}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenPreview(paper)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>

                  {isApproved && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDownloadPaper(paper)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Paper PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadAnswerKey(paper)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <FileKey2 className="w-3.5 h-3.5" />
                        <span>Answer Key PDF</span>
                      </button>
                    </>
                  )}

                  {canSubmit && (
                    <>
                      <button
                        type="button"
                        onClick={() => openSubmitDialog(paper)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit for Approval</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(paper)}
                        title="Delete Draft"
                        className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        open={Boolean(previewPaper)}
        onClose={() => setPreviewPaper(null)}
        title={previewPaper?.examName ?? 'Paper Preview'}
        subtitle={
          previewPaper
            ? `${subjectMap.get(previewPaper.subjectId)?.name ?? ''} · ${
                previewPaper.totalMarks
              } Marks`
            : undefined
        }
        maxWidth="max-w-4xl"
      >
        {previewPaper && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 no-print">
              <StatusLabel status={previewPaper.status} />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAnswersInPreview((v) => !v)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  {showAnswersInPreview ? 'Hide Answers' : 'Show Answer Key'}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                {previewPaper.status === 'Approved' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDownloadPaper(previewPaper)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Paper PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadAnswerKey(previewPaper)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg"
                    >
                      <FileKey2 className="w-3.5 h-3.5" />
                      <span>Answer Key PDF</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {previewPaper.status !== 'Approved' && (
              <p className="text-xs text-slate-500 no-print">
                Official PDF exports are unlocked once the HOD approves this
                question paper.
              </p>
            )}

            <FormalPaperPreview
              paper={previewPaper}
              subject={subjectMap.get(previewPaper.subjectId)}
              units={units}
              questionsMap={questionsMap}
              showAnswers={showAnswersInPreview}
            />
          </div>
        )}
      </Modal>

      {/* Submit with Optional Release Date Modal */}
      <Modal
        open={Boolean(submitTarget)}
        onClose={() => setSubmitTarget(null)}
        title="Submit Paper for HOD Approval"
        subtitle={submitTarget?.examName}
        maxWidth="max-w-md"
      >
        {submitTarget && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Optional Release Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={releaseInput}
                onChange={(e) => setReleaseInput(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <p className="mt-1 text-xs text-slate-500">
                Optionally specify when the approved examination is scheduled
                for release.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSubmitTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  submitPaperForApproval(
                    submitTarget.id,
                    releaseInput || undefined,
                  );
                  setSubmitTarget(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
              >
                Confirm &amp; Submit
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Question Paper"
        message={`Remove "${deleteTarget?.examName}" permanently? This action cannot be undone.`}
        onConfirm={() => {
          if (deleteTarget) deletePaper(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
