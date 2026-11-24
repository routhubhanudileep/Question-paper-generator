/**
 * Question Paper Generation Engine
 *
 * Handles blueprint validation, randomized non-repeating question selection
 * with recency avoidance, shortage diagnostics, and single-question replacement.
 */

import {
  DifficultyLevel,
  GeneratedSection,
  PaperPattern,
  Question,
  QuestionMarks,
  QuestionPaper,
} from '../types';

export interface SectionShortage {
  sectionId: string;
  sectionName: string;
  marksPerQuestion: QuestionMarks;
  difficulty: DifficultyLevel;
  required: number;
  available: number;
}

export interface PaperGenerationResult {
  success: boolean;
  sections?: GeneratedSection[];
  calculatedMarks?: number;
  shortages?: SectionShortage[];
  errorMessage?: string;
}

export interface GeneratePaperParams {
  subjectId: string;
  pattern: PaperPattern;
  selectedUnitIds: string[];
  allQuestions: Question[];
  /** Number of days considered "recently used" for deprioritization */
  recencyWindowDays?: number;
}

export interface ReplaceQuestionResult {
  success: boolean;
  replacementQuestion?: Question;
  note?: string;
  errorMessage?: string;
}

/**
 * Computes the sum of marks defined across all sections of a pattern.
 */
export function calculatePatternMarks(pattern: PaperPattern): number {
  return pattern.sections.reduce(
    (sum, section) => sum + section.questionCount * section.marksPerQuestion,
    0,
  );
}

/**
 * Validates that a pattern's section totals add up to its declared totalMarks.
 */
export function validatePatternMarks(pattern: PaperPattern): {
  valid: boolean;
  calculatedTotal: number;
} {
  const calculatedTotal = calculatePatternMarks(pattern);
  return {
    valid: calculatedTotal === pattern.totalMarks && calculatedTotal > 0,
    calculatedTotal,
  };
}

/**
 * Fisher-Yates in-place shuffle for unbiased randomization.
 */
function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Orders candidate questions into three recency tiers and shuffles within each tier:
 *   Tier 0: Never used (lastUsedDate === null)
 *   Tier 1: Used more than `recencyWindowDays` ago (sorted oldest-first within randomized sub-buckets)
 *   Tier 2: Used within `recencyWindowDays` (last resort to avoid failing generation unnecessarily)
 */
function prioritizeByRecency(
  candidates: Question[],
  recencyWindowDays: number,
): Question[] {
  const now = Date.now();
  const cutoffMs = recencyWindowDays * 24 * 60 * 60 * 1000;

  const neverUsed: Question[] = [];
  const olderUsed: Question[] = [];
  const recentlyUsed: Question[] = [];

  for (const q of candidates) {
    if (!q.lastUsedDate) {
      neverUsed.push(q);
      continue;
    }
    const usedTime = new Date(q.lastUsedDate).getTime();
    if (Number.isNaN(usedTime) || now - usedTime > cutoffMs) {
      olderUsed.push(q);
    } else {
      recentlyUsed.push(q);
    }
  }

  // Sort olderUsed roughly by age (oldest first) after shuffling to keep variety across ties
  const shuffledNever = shuffleArray(neverUsed);
  const shuffledOlder = shuffleArray(olderUsed).sort((a, b) => {
    const ta = a.lastUsedDate ? new Date(a.lastUsedDate).getTime() : 0;
    const tb = b.lastUsedDate ? new Date(b.lastUsedDate).getTime() : 0;
    return ta - tb;
  });
  const shuffledRecent = shuffleArray(recentlyUsed).sort((a, b) => {
    const ta = a.lastUsedDate ? new Date(a.lastUsedDate).getTime() : 0;
    const tb = b.lastUsedDate ? new Date(b.lastUsedDate).getTime() : 0;
    return ta - tb;
  });

  return [...shuffledNever, ...shuffledOlder, ...shuffledRecent];
}

/**
 * Inspects question bank coverage against a pattern and selected units without mutating state.
 */
export function checkBankAvailability(params: GeneratePaperParams): SectionShortage[] {
  const { subjectId, pattern, selectedUnitIds, allQuestions } = params;
  const unitSet = new Set(selectedUnitIds);
  const shortages: SectionShortage[] = [];

  // Track cumulative demand for identical (marks, difficulty) buckets across sections
  const simulatedUsedIds = new Set<string>();

  for (const section of pattern.sections) {
    const eligible = allQuestions.filter(
      (q) =>
        q.subjectId === subjectId &&
        unitSet.has(q.unitId) &&
        q.marks === section.marksPerQuestion &&
        q.difficulty === section.difficulty &&
        !simulatedUsedIds.has(q.id),
    );

    if (eligible.length < section.questionCount) {
      shortages.push({
        sectionId: section.id,
        sectionName: section.name,
        marksPerQuestion: section.marksPerQuestion,
        difficulty: section.difficulty,
        required: section.questionCount,
        available: eligible.length,
      });
    } else {
      for (let i = 0; i < section.questionCount; i++) {
        simulatedUsedIds.add(eligible[i].id);
      }
    }
  }

  return shortages;
}

/**
 * Generates sections of unique questions matching the blueprint, avoiding recently used questions,
 * and verifying total marks alignment.
 */
export function generatePaperSections(
  params: GeneratePaperParams,
): PaperGenerationResult {
  const {
    subjectId,
    pattern,
    selectedUnitIds,
    allQuestions,
    recencyWindowDays = 30,
  } = params;

  if (selectedUnitIds.length === 0) {
    return {
      success: false,
      errorMessage: 'Please select at least one syllabus unit before generating a paper.',
    };
  }

  const { valid, calculatedTotal } = validatePatternMarks(pattern);
  if (!valid) {
    return {
      success: false,
      errorMessage: `Pattern mark mismatch: sections total ${calculatedTotal} marks, expected ${pattern.totalMarks} marks.`,
    };
  }

  const unitSet = new Set(selectedUnitIds);
  const usedQuestionIds = new Set<string>();
  const generatedSections: GeneratedSection[] = [];
  const shortages: SectionShortage[] = [];

  for (const section of pattern.sections) {
    const matchingQuestions = allQuestions.filter(
      (q) =>
        q.subjectId === subjectId &&
        unitSet.has(q.unitId) &&
        q.marks === section.marksPerQuestion &&
        q.difficulty === section.difficulty &&
        !usedQuestionIds.has(q.id),
    );

    if (matchingQuestions.length < section.questionCount) {
      shortages.push({
        sectionId: section.id,
        sectionName: section.name,
        marksPerQuestion: section.marksPerQuestion,
        difficulty: section.difficulty,
        required: section.questionCount,
        available: matchingQuestions.length,
      });
      continue;
    }

    const prioritized = prioritizeByRecency(matchingQuestions, recencyWindowDays);

    // Distribute picks evenly across selected units (while keeping recency priority)
    const unitOrder = shuffleArray(selectedUnitIds);
    const chosen: Question[] = [];
    const chosenSet = new Set<string>();
    let passIndex = 0;

    while (chosen.length < section.questionCount) {
      let pickedInPass = false;
      for (const uId of unitOrder) {
        if (chosen.length >= section.questionCount) break;
        const candidate = prioritized.find(
          (q) => q.unitId === uId && !chosenSet.has(q.id),
        );
        if (candidate) {
          chosen.push(candidate);
          chosenSet.add(candidate.id);
          pickedInPass = true;
        }
      }
      passIndex++;
      if (!pickedInPass || passIndex > section.questionCount + 2) {
        // Fallback: fill any remaining slots strictly from prioritized pool
        for (const q of prioritized) {
          if (chosen.length >= section.questionCount) break;
          if (!chosenSet.has(q.id)) {
            chosen.push(q);
            chosenSet.add(q.id);
          }
        }
        break;
      }
    }

    chosen.forEach((q) => usedQuestionIds.add(q.id));

    generatedSections.push({
      sectionId: section.id,
      sectionName: section.name,
      marksPerQuestion: section.marksPerQuestion,
      difficulty: section.difficulty,
      questionIds: chosen.map((q) => q.id),
    });
  }

  if (shortages.length > 0) {
    const detail = shortages
      .map(
        (s) =>
          `${s.sectionName} (${s.difficulty}, ${s.marksPerQuestion}m): needs ${s.required}, found ${s.available}`,
      )
      .join('; ');
    return {
      success: false,
      shortages,
      errorMessage: `Insufficient questions in the selected units — ${detail}.`,
    };
  }

  const generatedTotal = generatedSections.reduce(
    (sum, sec) => sum + sec.questionIds.length * sec.marksPerQuestion,
    0,
  );

  if (generatedTotal !== pattern.totalMarks) {
    return {
      success: false,
      errorMessage: `Generated marks (${generatedTotal}) do not match pattern total (${pattern.totalMarks}).`,
    };
  }

  return {
    success: true,
    sections: generatedSections,
    calculatedMarks: generatedTotal,
  };
}

/**
 * Replaces a single question in a generated paper with another non-duplicate question
 * from the same subject, same unit, and same marks value.
 * Prefers matching difficulty and avoids recently used questions.
 */
export function replaceSingleQuestion(
  paper: Pick<QuestionPaper, 'subjectId' | 'sections'>,
  currentQuestion: Question,
  allQuestions: Question[],
  recencyWindowDays = 30,
): ReplaceQuestionResult {
  const usedIds = new Set<string>();
  for (const section of paper.sections) {
    for (const qId of section.questionIds) {
      usedIds.add(qId);
    }
  }

  // Primary pool: same subject, same unit, same marks, same difficulty, not in paper
  const exactMatches = allQuestions.filter(
    (q) =>
      q.subjectId === paper.subjectId &&
      q.unitId === currentQuestion.unitId &&
      q.marks === currentQuestion.marks &&
      q.difficulty === currentQuestion.difficulty &&
      q.id !== currentQuestion.id &&
      !usedIds.has(q.id),
  );

  if (exactMatches.length > 0) {
    const prioritized = prioritizeByRecency(exactMatches, recencyWindowDays);
    return {
      success: true,
      replacementQuestion: prioritized[0],
    };
  }

  // Secondary pool: same subject, same unit, same marks (any difficulty), not in paper
  const sameUnitAndMarks = allQuestions.filter(
    (q) =>
      q.subjectId === paper.subjectId &&
      q.unitId === currentQuestion.unitId &&
      q.marks === currentQuestion.marks &&
      q.id !== currentQuestion.id &&
      !usedIds.has(q.id),
  );

  if (sameUnitAndMarks.length > 0) {
    const prioritized = prioritizeByRecency(sameUnitAndMarks, recencyWindowDays);
    return {
      success: true,
      replacementQuestion: prioritized[0],
      note: `Replaced with a ${prioritized[0].difficulty} question of the same marks and unit (no other ${currentQuestion.difficulty} question available in this unit).`,
    };
  }

  return {
    success: false,
    errorMessage: `No alternative ${currentQuestion.marks}-mark question is available in the same unit that isn't already in this paper.`,
  };
}
