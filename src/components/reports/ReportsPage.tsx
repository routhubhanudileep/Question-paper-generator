import React, { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DifficultyLevel, QuestionMarks } from '../../types';
import { StatCard } from '../ui/CommonUI';

export const ReportsPage: React.FC = () => {
  const { subjects, units, questions, papers } = useApp();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects[0]?.id ?? '',
  );

  // 1. Papers per subject breakdown
  const papersPerSubject = useMemo(() => {
    return subjects.map((sub) => {
      const subPapers = papers.filter((p) => p.subjectId === sub.id);
      return {
        subject: sub,
        total: subPapers.length,
        approved: subPapers.filter((p) => p.status === 'Approved').length,
        pending: subPapers.filter((p) => p.status === 'Pending').length,
        other: subPapers.filter(
          (p) => p.status === 'Draft' || p.status === 'Rejected',
        ).length,
      };
    });
  }, [papers, subjects]);

  const maxSubjectPapers = Math.max(
    1,
    ...papersPerSubject.map((item) => item.total),
  );

  // 2. Questions per unit (filtered by selectedSubjectId or all)
  const unitStats = useMemo(() => {
    const filteredUnits = units
      .filter((u) => !selectedSubjectId || u.subjectId === selectedSubjectId)
      .sort((a, b) => a.unitNumber - b.unitNumber);

    return filteredUnits.map((unit) => {
      const unitQuestions = questions.filter((q) => q.unitId === unit.id);
      return {
        unit,
        total: unitQuestions.length,
        easy: unitQuestions.filter((q) => q.difficulty === 'Easy').length,
        medium: unitQuestions.filter((q) => q.difficulty === 'Medium').length,
        hard: unitQuestions.filter((q) => q.difficulty === 'Hard').length,
      };
    });
  }, [questions, selectedSubjectId, units]);

  const maxUnitCount = Math.max(1, ...unitStats.map((u) => u.total));

  // 3. Difficulty & Marks distribution across whole question bank
  const difficultyDistribution = useMemo(() => {
    const levels: { level: DifficultyLevel; barColor: string; textColor: string }[] = [
      { level: 'Easy', barColor: 'bg-emerald-600', textColor: 'text-emerald-700' },
      { level: 'Medium', barColor: 'bg-amber-500', textColor: 'text-amber-700' },
      { level: 'Hard', barColor: 'bg-red-600', textColor: 'text-red-700' },
    ];
    const total = Math.max(1, questions.length);
    return levels.map((item) => {
      const count = questions.filter((q) => q.difficulty === item.level).length;
      return {
        ...item,
        count,
        percent: Math.round((count / total) * 100),
      };
    });
  }, [questions]);

  const marksDistribution = useMemo(() => {
    const marks: QuestionMarks[] = [2, 5, 10];
    const total = Math.max(1, questions.length);
    return marks.map((m) => {
      const count = questions.filter((q) => q.marks === m).length;
      return {
        marks: m,
        count,
        percent: Math.round((count / total) * 100),
      };
    });
  }, [questions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Examination Analytics &amp; Reports
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Question bank balance, unit-level coverage, and paper generation
          volume across departments.
        </p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Questions" value={questions.length} />
        <StatCard label="Total Papers" value={papers.length} />
        <StatCard
          label="Syllabus Units"
          value={units.length}
          helper={`${subjects.length} subjects`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Papers per Subject */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Papers per Subject
              </h2>
              <p className="text-xs text-slate-500">
                Generated examination papers grouped by status
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-5">
            {papersPerSubject.map(({ subject, total, approved, pending, other }) => {
              const widthPct = Math.round((total / maxSubjectPapers) * 100);
              return (
                <div key={subject.id} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {subject.code} · {subject.name}
                    </span>
                    <span className="text-xs font-mono text-slate-700 tabular-nums">
                      {total} {total === 1 ? 'paper' : 'papers'}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    {total > 0 && (
                      <div
                        className="h-full flex"
                        style={{ width: `${Math.max(8, widthPct)}%` }}
                      >
                        {approved > 0 && (
                          <div
                            className="bg-emerald-600 h-full"
                            style={{ width: `${(approved / total) * 100}%` }}
                            title={`Approved: ${approved}`}
                          />
                        )}
                        {pending > 0 && (
                          <div
                            className="bg-amber-500 h-full"
                            style={{ width: `${(pending / total) * 100}%` }}
                            title={`Pending: ${pending}`}
                          />
                        )}
                        {other > 0 && (
                          <div
                            className="bg-slate-400 h-full"
                            style={{ width: `${(other / total) * 100}%` }}
                            title={`Draft/Rejected: ${other}`}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 tabular-nums">
                    <span>Approved: {approved}</span>
                    <span>Pending: {pending}</span>
                    <span>Draft/Rejected: {other}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Difficulty & Marks Distribution */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Difficulty Distribution
            </h2>
            <p className="text-xs text-slate-500">
              Proportion of Easy, Medium, and Hard questions across the bank
            </p>

            {/* Stacked Horizontal Proportion Bar */}
            <div className="mt-5 h-4 bg-slate-100 rounded-full overflow-hidden flex">
              {difficultyDistribution.map((d) => (
                <div
                  key={d.level}
                  className={`${d.barColor} h-full transition-all`}
                  style={{ width: `${d.percent}%` }}
                  title={`${d.level}: ${d.count} (${d.percent}%)`}
                />
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 border-b border-slate-200 pb-5">
              {difficultyDistribution.map((d) => (
                <div key={d.level}>
                  <p className={`text-xs font-medium ${d.textColor}`}>
                    {d.level}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-900 font-mono tabular-nums">
                    {d.count}
                  </p>
                  <p className="text-xs text-slate-500 font-mono tabular-nums">
                    {d.percent}% of bank
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Marks Weightage Distribution
            </h3>
            <div className="mt-3 space-y-2.5">
              {marksDistribution.map((m) => (
                <div
                  key={m.marks}
                  className="flex items-center gap-3 text-xs"
                >
                  <span className="w-16 font-mono font-medium text-slate-700 tabular-nums shrink-0">
                    {m.marks} Marks
                  </span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-700 rounded-full"
                      style={{ width: `${m.percent}%` }}
                    />
                  </div>
                  <span className="w-20 text-right font-mono text-slate-600 tabular-nums shrink-0">
                    {m.count} ({m.percent}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart 3: Questions per Unit */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Questions per Syllabus Unit
            </h2>
            <p className="text-xs text-slate-500">
              Inspect difficulty balance within each unit to prevent generation
              shortages
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="report-subject-filter"
              className="text-xs font-medium text-slate-600 whitespace-nowrap"
            >
              Subject:
            </label>
            <select
              id="report-subject-filter"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {unitStats.map(({ unit, total, easy, medium, hard }) => {
            const widthPct = Math.round((total / maxUnitCount) * 100);
            return (
              <div
                key={unit.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center py-2 border-b border-slate-100 last:border-b-0"
              >
                <div className="md:col-span-4">
                  <p className="text-sm font-medium text-slate-900">
                    Unit {unit.unitNumber}: {unit.title}
                  </p>
                </div>
                <div className="md:col-span-5">
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-700 rounded-full transition-all"
                      style={{ width: `${Math.max(total > 0 ? 6 : 0, widthPct)}%` }}
                    />
                  </div>
                </div>
                <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-3 text-xs font-mono tabular-nums text-slate-600">
                  <span className="font-semibold text-slate-900">
                    {total} Qs
                  </span>
                  <span>E:{easy}</span>
                  <span>M:{medium}</span>
                  <span>H:{hard}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
