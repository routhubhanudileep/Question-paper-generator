/**
 * Browser localStorage persistence layer with automatic first-load seeding.
 */

import {
  SEED_AUDIT_LOGS,
  SEED_PAPERS,
  SEED_PATTERNS,
  SEED_QUESTIONS,
  SEED_SUBJECTS,
  SEED_UNITS,
  SEED_USERS,
} from '../data/seedData';
import {
  AuditLog,
  PaperPattern,
  Question,
  QuestionPaper,
  Subject,
  Unit,
  User,
} from '../types';

const STORAGE_KEYS = {
  INITIALIZED: 'oqpg_v1_initialized',
  USERS: 'oqpg_v1_users',
  SUBJECTS: 'oqpg_v1_subjects',
  UNITS: 'oqpg_v1_units',
  QUESTIONS: 'oqpg_v1_questions',
  PATTERNS: 'oqpg_v1_patterns',
  PAPERS: 'oqpg_v1_papers',
  AUDIT_LOGS: 'oqpg_v1_audit_logs',
  SESSION_USER_ID: 'oqpg_v1_session_user_id',
} as const;

export interface AppDatabaseState {
  users: User[];
  subjects: Subject[];
  units: Unit[];
  questions: Question[];
  patterns: PaperPattern[];
  papers: QuestionPaper[];
  auditLogs: AuditLog[];
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function initializeAndLoadState(): AppDatabaseState {
  const alreadySeeded = window.localStorage.getItem(STORAGE_KEYS.INITIALIZED);

  if (!alreadySeeded) {
    writeJson(STORAGE_KEYS.USERS, SEED_USERS);
    writeJson(STORAGE_KEYS.SUBJECTS, SEED_SUBJECTS);
    writeJson(STORAGE_KEYS.UNITS, SEED_UNITS);
    writeJson(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
    writeJson(STORAGE_KEYS.PATTERNS, SEED_PATTERNS);
    writeJson(STORAGE_KEYS.PAPERS, SEED_PAPERS);
    writeJson(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    window.localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  return {
    users: readJson<User[]>(STORAGE_KEYS.USERS, SEED_USERS),
    subjects: readJson<Subject[]>(STORAGE_KEYS.SUBJECTS, SEED_SUBJECTS),
    units: readJson<Unit[]>(STORAGE_KEYS.UNITS, SEED_UNITS),
    questions: readJson<Question[]>(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS),
    patterns: readJson<PaperPattern[]>(STORAGE_KEYS.PATTERNS, SEED_PATTERNS),
    papers: readJson<QuestionPaper[]>(STORAGE_KEYS.PAPERS, SEED_PAPERS),
    auditLogs: readJson<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS),
  };
}

export function saveStateSlice<K extends keyof AppDatabaseState>(
  slice: K,
  data: AppDatabaseState[K],
): void {
  const keyMap: Record<keyof AppDatabaseState, string> = {
    users: STORAGE_KEYS.USERS,
    subjects: STORAGE_KEYS.SUBJECTS,
    units: STORAGE_KEYS.UNITS,
    questions: STORAGE_KEYS.QUESTIONS,
    patterns: STORAGE_KEYS.PATTERNS,
    papers: STORAGE_KEYS.PAPERS,
    auditLogs: STORAGE_KEYS.AUDIT_LOGS,
  };
  writeJson(keyMap[slice], data);
}

export function getSavedSessionUserId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.SESSION_USER_ID);
  } catch {
    return null;
  }
}

export function saveSessionUserId(userId: string | null): void {
  try {
    if (userId) {
      window.localStorage.setItem(STORAGE_KEYS.SESSION_USER_ID, userId);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.SESSION_USER_ID);
    }
  } catch {
    // Ignore storage errors
  }
}

export function resetAllDemoData(): AppDatabaseState {
  window.localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  window.localStorage.removeItem(STORAGE_KEYS.SESSION_USER_ID);
  return initializeAndLoadState();
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
