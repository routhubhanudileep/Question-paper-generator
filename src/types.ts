/**
 * Core domain models for the Online Question Paper Generator.
 */

export type UserRole = 'faculty' | 'hod' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  active: boolean;
  createdAt: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  department: string;
  createdAt: string;
}

export interface Unit {
  id: string;
  subjectId: string;
  unitNumber: number;
  title: string;
  description: string;
}

export type QuestionMarks = 2 | 5 | 10;
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type QuestionType = 'Short' | 'Long' | 'MCQ';

export interface Question {
  id: string;
  subjectId: string;
  unitId: string;
  text: string;
  answer: string;
  options?: string[];
  marks: QuestionMarks;
  difficulty: DifficultyLevel;
  type: QuestionType;
  lastUsedDate: string | null;
  createdBy: string;
  createdAt: string;
}

export interface PatternSection {
  id: string;
  name: string;
  questionCount: number;
  marksPerQuestion: QuestionMarks;
  difficulty: DifficultyLevel;
}

export interface PaperPattern {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  sections: PatternSection[];
  createdBy: string;
  createdAt: string;
}

export type PaperStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected';

export interface GeneratedSection {
  sectionId: string;
  sectionName: string;
  marksPerQuestion: QuestionMarks;
  difficulty: DifficultyLevel;
  questionIds: string[];
}

export interface QuestionPaper {
  id: string;
  examName: string;
  subjectId: string;
  patternId: string;
  patternName: string;
  selectedUnitIds: string[];
  totalMarks: number;
  durationMinutes: number;
  instructions: string;
  sections: GeneratedSection[];
  status: PaperStatus;
  releaseDateTime?: string;
  hodComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export type AuditAction =
  | 'Created'
  | 'Viewed'
  | 'Submitted'
  | 'Approved'
  | 'Rejected'
  | 'Downloaded Paper'
  | 'Downloaded Answer Key'
  | 'Updated';

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: AuditAction;
  paperId: string;
  paperTitle: string;
  subjectName: string;
  details: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}
