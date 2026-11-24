import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaperStatus, QuestionPaper } from '../../types';
import { FormalPaperPreview } from '../papers/FormalPaperPreview';
import { EmptyState, Modal, StatusLabel } from '../ui/CommonUI';

const APPROVAL_TABS: { key: 'all' | PaperStatus; label: string }[] = [
  { key: 'Pending', label: 'Pending Review' },
  { key: 'Approved', label: 'Approved' },
  { key: 'Rejected', label: 'Rejected' },
  { key: 'all', label: 'All Submissions' },
];

export const ApprovalsPage: React.FC = () => {
  const {
    papers,
    subjects,
    units,
    questions,
    reviewPaper,
    logPaperEvent,
  } = useApp();

  const [filter, setFilter] = useState<'all' | PaperStatus>('Pending');
  const [activePaper, setActivePaper] = useState<QuestionPaper | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  const subjectMap = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );
  const questionsMap = useMemo(
    () => new Map(questions.map((q) => [q.id, q])),
    [questions],
  );

  // HOD only reviews submitted/reviewed papers (exclude unsubmitted Drafts unless viewing all)
  const visiblePapers = useMemo(() => {
    const submittedPool = papers.filter((p) => p.status !== 'Draft');
    if (filter === 'all') return submittedPool;
    return submittedPool.filter((p) => p.status === filter);
  }, [filter, papers]);

  const openReviewModal = (paper: QuestionPaper) => {
    setActivePaper(paper);
    setShowAnswers(false);
    setComment(paper.hodComment ?? '');
    setCommentError(null);
    logPaperEvent(paper, 'Viewed', 'Opened paper for HOD moderation review.');
  };

  const handleDecision = (decision: 'Approved' | 'Rejected') => {
    if (!activePaper) return;
    if (decision === 'Rejected' && comment.trim().length < 5) {
      setCommentError(
        'Please include a short review comment explaining why this paper is rejected.',
      );
      return;
    }
    reviewPaper(activePaper.id, decision, comment);
    setActivePaper(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Paper Approvals &amp; Moderation
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Inspect submitted examination papers against syllabus balance and
          approve or return them with feedback.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
        {APPROVAL_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filter === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {visiblePapers.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="w-5 h-5" />}
          title="No papers in this queue"
          description={
            filter === 'Pending'
              ? 'All submitted question papers have been reviewed.'
              : 'No papers match the selected approval status.'
          }
        />
      ) : (
        <div className="space-y-3">
          {visiblePapers.map((paper) => {
            const sub = subjectMap.get(paper.subjectId);
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
                    &middot; Submitted by {paper.createdByName} &middot;{' '}
                    <span className="font-mono tabular-nums">
                      {paper.totalMarks} Marks
                    </span>{' '}
                    &middot;{' '}
                    <span className="font-mono tabular-nums">
                      {paper.durationMinutes} mins
                    </span>
                  </p>
                  {paper.hodComment && (
                    <p className="text-xs text-slate-700 pt-1">
                      <span className="font-semibold">Review Comment: </span>
                      {paper.hodComment}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openReviewModal(paper)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      paper.status === 'Pending'
                        ? 'text-white bg-blue-700 hover:bg-blue-800'
                        : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>
                      {paper.status === 'Pending'
                        ? 'Review & Decide'
                        : 'Inspect Paper'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        open={Boolean(activePaper)}
        onClose={() => setActivePaper(null)}
        title={activePaper?.examName ?? 'Paper Review'}
        subtitle={
          activePaper
            ? `Submitted by ${activePaper.createdByName} · ${
                subjectMap.get(activePaper.subjectId)?.name ?? ''
              }`
            : undefined
        }
        maxWidth="max-w-4xl"
      >
        {activePaper && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusLabel status={activePaper.status} />
              <button
                type="button"
                onClick={() => setShowAnswers((v) => !v)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                {showAnswers ? 'Hide Answer Key' : 'Verify Answer Key'}
              </button>
            </div>

            <FormalPaperPreview
              paper={activePaper}
              subject={subjectMap.get(activePaper.subjectId)}
              units={units}
              questionsMap={questionsMap}
              showAnswers={showAnswers}
            />

            {activePaper.status === 'Pending' && (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div>
                  <label
                    htmlFor="hod-review-comment"
                    className="block text-xs font-semibold text-slate-800 mb-1.5"
                  >
                    HOD Review Comment (optional for approval, required for
                    rejection)
                  </label>
                  <textarea
                    id="hod-review-comment"
                    rows={2}
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      setCommentError(null);
                    }}
                    placeholder="Add moderation notes or feedback for faculty..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {commentError && (
                  <p className="text-xs font-medium text-red-700">
                    {commentError}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => handleDecision('Rejected')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject with Comment</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision('Approved')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Paper</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
