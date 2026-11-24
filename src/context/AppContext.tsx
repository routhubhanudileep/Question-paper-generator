import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AuditAction,
  AuditLog,
  PaperPattern,
  PaperStatus,
  Question,
  QuestionPaper,
  Subject,
  ToastMessage,
  Unit,
  User,
} from '../types';
import {
  AppDatabaseState,
  createId,
  getSavedSessionUserId,
  initializeAndLoadState,
  resetAllDemoData,
  saveSessionUserId,
  saveStateSlice,
} from '../utils/storage';

interface AppContextValue extends AppDatabaseState {
  currentUser: User | null;
  toasts: ToastMessage[];
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  notify: (
    type: ToastMessage['type'],
    title: string,
    message?: string,
  ) => void;
  dismissToast: (id: string) => void;

  // Questions
  addQuestion: (
    q: Omit<Question, 'id' | 'createdBy' | 'createdAt' | 'lastUsedDate'>,
  ) => void;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;

  // Subjects & Units
  addSubject: (s: Omit<Subject, 'id' | 'createdAt'>) => void;
  updateSubject: (id: string, patch: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  addUnit: (u: Omit<Unit, 'id'>) => void;
  updateUnit: (id: string, patch: Partial<Unit>) => void;
  deleteUnit: (id: string) => void;

  // Patterns
  addPattern: (p: Omit<PaperPattern, 'id' | 'createdBy' | 'createdAt'>) => void;
  updatePattern: (id: string, patch: Partial<PaperPattern>) => void;
  deletePattern: (id: string) => void;

  // Papers & Workflow
  savePaper: (
    paper: Omit<
      QuestionPaper,
      'id' | 'createdBy' | 'createdByName' | 'createdAt' | 'updatedAt'
    >,
  ) => QuestionPaper;
  updatePaper: (id: string, patch: Partial<QuestionPaper>) => void;
  deletePaper: (id: string) => void;
  submitPaperForApproval: (
    id: string,
    releaseDateTime?: string,
  ) => void;
  reviewPaper: (
    id: string,
    decision: 'Approved' | 'Rejected',
    comment: string,
  ) => void;
  logPaperEvent: (
    paper: QuestionPaper,
    action: AuditAction,
    details: string,
  ) => void;

  // Users
  addUser: (u: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  deleteUser: (id: string) => void;

  resetDemoData: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [db, setDb] = useState<AppDatabaseState>(() => initializeAndLoadState());
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    getSavedSessionUserId(),
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    return db.users.find((u) => u.id === currentUserId && u.active) ?? null;
  }, [db.users, currentUserId]);

  useEffect(() => {
    if (currentUserId && !currentUser) {
      saveSessionUserId(null);
      setCurrentUserId(null);
    }
  }, [currentUser, currentUserId]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (type: ToastMessage['type'], title: string, message?: string) => {
      const id = createId('toast');
      setToasts((prev) => [...prev, { id, type, title, message }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    [],
  );

  const updateSlice = useCallback(
    <K extends keyof AppDatabaseState>(
      key: K,
      updater: (prev: AppDatabaseState[K]) => AppDatabaseState[K],
    ) => {
      setDb((prev) => {
        const nextSlice = updater(prev[key]);
        saveStateSlice(key, nextSlice);
        return { ...prev, [key]: nextSlice };
      });
    },
    [],
  );

  const appendAudit = useCallback(
    (
      actor: User,
      action: AuditAction,
      paperId: string,
      paperTitle: string,
      subjectName: string,
      details: string,
    ) => {
      const entry: AuditLog = {
        id: createId('aud'),
        timestamp: new Date().toISOString(),
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action,
        paperId,
        paperTitle,
        subjectName,
        details,
      };
      updateSlice('auditLogs', (prev) => [entry, ...prev]);
    },
    [updateSlice],
  );

  const login = useCallback(
    (email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const matched = db.users.find(
        (u) => u.email.toLowerCase() === normalizedEmail,
      );
      if (!matched || matched.password !== password) {
        return { ok: false, error: 'Invalid email address or password.' };
      }
      if (!matched.active) {
        return {
          ok: false,
          error: 'This account is currently deactivated. Contact Examination Admin.',
        };
      }
      saveSessionUserId(matched.id);
      setCurrentUserId(matched.id);
      notify('success', `Welcome back, ${matched.name}`);
      return { ok: true };
    },
    [db.users, notify],
  );

  const logout = useCallback(() => {
    saveSessionUserId(null);
    setCurrentUserId(null);
    notify('info', 'Signed out successfully');
  }, [notify]);

  // Question CRUD
  const addQuestion = useCallback(
    (q: Omit<Question, 'id' | 'createdBy' | 'createdAt' | 'lastUsedDate'>) => {
      const newQ: Question = {
        ...q,
        id: createId('q'),
        lastUsedDate: null,
        createdBy: currentUser?.id ?? 'usr-faculty-1',
        createdAt: new Date().toISOString(),
      };
      updateSlice('questions', (prev) => [newQ, ...prev]);
      notify('success', 'Question added to bank');
    },
    [currentUser, notify, updateSlice],
  );

  const updateQuestion = useCallback(
    (id: string, patch: Partial<Question>) => {
      updateSlice('questions', (prev) =>
        prev.map((q) => (q.id === id ? { ...q, ...patch } : q)),
      );
      notify('success', 'Question updated');
    },
    [notify, updateSlice],
  );

  const deleteQuestion = useCallback(
    (id: string) => {
      updateSlice('questions', (prev) => prev.filter((q) => q.id !== id));
      notify('success', 'Question removed from bank');
    },
    [notify, updateSlice],
  );

  // Subject & Unit CRUD
  const addSubject = useCallback(
    (s: Omit<Subject, 'id' | 'createdAt'>) => {
      const newSub: Subject = {
        ...s,
        id: createId('sub'),
        createdAt: new Date().toISOString(),
      };
      updateSlice('subjects', (prev) => [...prev, newSub]);
      notify('success', `Subject "${s.name}" created`);
    },
    [notify, updateSlice],
  );

  const updateSubject = useCallback(
    (id: string, patch: Partial<Subject>) => {
      updateSlice('subjects', (prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      );
      notify('success', 'Subject updated');
    },
    [notify, updateSlice],
  );

  const deleteSubject = useCallback(
    (id: string) => {
      updateSlice('subjects', (prev) => prev.filter((s) => s.id !== id));
      updateSlice('units', (prev) => prev.filter((u) => u.subjectId !== id));
      updateSlice('questions', (prev) =>
        prev.filter((q) => q.subjectId !== id),
      );
      notify('success', 'Subject and associated units deleted');
    },
    [notify, updateSlice],
  );

  const addUnit = useCallback(
    (u: Omit<Unit, 'id'>) => {
      const newUnit: Unit = { ...u, id: createId('unit') };
      updateSlice('units', (prev) => [...prev, newUnit]);
      notify('success', `Unit ${u.unitNumber} added`);
    },
    [notify, updateSlice],
  );

  const updateUnit = useCallback(
    (id: string, patch: Partial<Unit>) => {
      updateSlice('units', (prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...patch } : u)),
      );
      notify('success', 'Unit updated');
    },
    [notify, updateSlice],
  );

  const deleteUnit = useCallback(
    (id: string) => {
      updateSlice('units', (prev) => prev.filter((u) => u.id !== id));
      updateSlice('questions', (prev) => prev.filter((q) => q.unitId !== id));
      notify('success', 'Unit removed');
    },
    [notify, updateSlice],
  );

  // Pattern CRUD
  const addPattern = useCallback(
    (p: Omit<PaperPattern, 'id' | 'createdBy' | 'createdAt'>) => {
      const newPat: PaperPattern = {
        ...p,
        id: createId('pat'),
        createdBy: currentUser?.id ?? 'usr-hod-1',
        createdAt: new Date().toISOString(),
      };
      updateSlice('patterns', (prev) => [newPat, ...prev]);
      notify('success', `Pattern "${p.name}" saved`);
    },
    [currentUser, notify, updateSlice],
  );

  const updatePattern = useCallback(
    (id: string, patch: Partial<PaperPattern>) => {
      updateSlice('patterns', (prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
      notify('success', 'Pattern updated');
    },
    [notify, updateSlice],
  );

  const deletePattern = useCallback(
    (id: string) => {
      updateSlice('patterns', (prev) => prev.filter((p) => p.id !== id));
      notify('success', 'Pattern deleted');
    },
    [notify, updateSlice],
  );

  // Papers & Workflow
  const getSubjectName = useCallback(
    (subjectId: string) =>
      db.subjects.find((s) => s.id === subjectId)?.name ?? 'Unknown Subject',
    [db.subjects],
  );

  const markQuestionsUsed = useCallback(
    (paper: Pick<QuestionPaper, 'sections'>) => {
      const usedIds = new Set(paper.sections.flatMap((s) => s.questionIds));
      const now = new Date().toISOString();
      updateSlice('questions', (prev) =>
        prev.map((q) => (usedIds.has(q.id) ? { ...q, lastUsedDate: now } : q)),
      );
    },
    [updateSlice],
  );

  const savePaper = useCallback(
    (
      paperInput: Omit<
        QuestionPaper,
        'id' | 'createdBy' | 'createdByName' | 'createdAt' | 'updatedAt'
      >,
    ) => {
      const now = new Date().toISOString();
      const actor = currentUser ?? db.users[0];
      const newPaper: QuestionPaper = {
        ...paperInput,
        id: createId('pap'),
        createdBy: actor.id,
        createdByName: actor.name,
        createdAt: now,
        updatedAt: now,
      };
      updateSlice('papers', (prev) => [newPaper, ...prev]);

      const subName = getSubjectName(newPaper.subjectId);
      appendAudit(
        actor,
        'Created',
        newPaper.id,
        newPaper.examName,
        subName,
        `Generated ${newPaper.totalMarks}-mark paper using "${newPaper.patternName}".`,
      );

      if (newPaper.status === 'Pending') {
        markQuestionsUsed(newPaper);
        appendAudit(
          actor,
          'Submitted',
          newPaper.id,
          newPaper.examName,
          subName,
          `Submitted paper for HOD approval.${
            newPaper.releaseDateTime
              ? ` Scheduled release: ${newPaper.releaseDateTime}.`
              : ''
          }`,
        );
      }

      return newPaper;
    },
    [appendAudit, currentUser, db.users, getSubjectName, markQuestionsUsed, updateSlice],
  );

  const updatePaper = useCallback(
    (id: string, patch: Partial<QuestionPaper>) => {
      const now = new Date().toISOString();
      updateSlice('papers', (prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now } : p)),
      );
    },
    [updateSlice],
  );

  const deletePaper = useCallback(
    (id: string) => {
      updateSlice('papers', (prev) => prev.filter((p) => p.id !== id));
      notify('success', 'Paper deleted');
    },
    [notify, updateSlice],
  );

  const submitPaperForApproval = useCallback(
    (id: string, releaseDateTime?: string) => {
      const target = db.papers.find((p) => p.id === id);
      if (!target || !currentUser) return;
      const now = new Date().toISOString();
      updateSlice('papers', (prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: 'Pending' as PaperStatus,
                releaseDateTime: releaseDateTime ?? p.releaseDateTime,
                hodComment: undefined,
                updatedAt: now,
              }
            : p,
        ),
      );
      markQuestionsUsed(target);
      appendAudit(
        currentUser,
        'Submitted',
        target.id,
        target.examName,
        getSubjectName(target.subjectId),
        `Submitted paper for HOD approval.${
          releaseDateTime ? ` Release scheduled: ${releaseDateTime}.` : ''
        }`,
      );
      notify('success', 'Paper submitted for HOD approval');
    },
    [
      appendAudit,
      currentUser,
      db.papers,
      getSubjectName,
      markQuestionsUsed,
      notify,
      updateSlice,
    ],
  );

  const reviewPaper = useCallback(
    (id: string, decision: 'Approved' | 'Rejected', comment: string) => {
      const target = db.papers.find((p) => p.id === id);
      if (!target || !currentUser) return;
      const now = new Date().toISOString();
      updateSlice('papers', (prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: decision,
                hodComment: comment.trim() || undefined,
                reviewedBy: currentUser.name,
                reviewedAt: now,
                updatedAt: now,
              }
            : p,
        ),
      );
      if (decision === 'Approved') {
        markQuestionsUsed(target);
      }
      appendAudit(
        currentUser,
        decision,
        target.id,
        target.examName,
        getSubjectName(target.subjectId),
        `${decision} paper.${comment.trim() ? ` Comment: "${comment.trim()}"` : ''}`,
      );
      notify(
        decision === 'Approved' ? 'success' : 'warning',
        `Paper ${decision.toLowerCase()}`,
      );
    },
    [
      appendAudit,
      currentUser,
      db.papers,
      getSubjectName,
      markQuestionsUsed,
      notify,
      updateSlice,
    ],
  );

  const logPaperEvent = useCallback(
    (paper: QuestionPaper, action: AuditAction, details: string) => {
      if (!currentUser) return;
      appendAudit(
        currentUser,
        action,
        paper.id,
        paper.examName,
        getSubjectName(paper.subjectId),
        details,
      );
    },
    [appendAudit, currentUser, getSubjectName],
  );

  // User CRUD
  const addUser = useCallback(
    (u: Omit<User, 'id' | 'createdAt'>) => {
      const newUser: User = {
        ...u,
        id: createId('usr'),
        createdAt: new Date().toISOString(),
      };
      updateSlice('users', (prev) => [...prev, newUser]);
      notify('success', `User ${u.name} added`);
    },
    [notify, updateSlice],
  );

  const updateUser = useCallback(
    (id: string, patch: Partial<User>) => {
      updateSlice('users', (prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...patch } : u)),
      );
      notify('success', 'User account updated');
    },
    [notify, updateSlice],
  );

  const deleteUser = useCallback(
    (id: string) => {
      updateSlice('users', (prev) => prev.filter((u) => u.id !== id));
      notify('success', 'User removed');
    },
    [notify, updateSlice],
  );

  const resetDemoData = useCallback(() => {
    const fresh = resetAllDemoData();
    setDb(fresh);
    setCurrentUserId(null);
    notify('info', 'Demo data restored to initial state');
  }, [notify]);

  const value: AppContextValue = {
    ...db,
    currentUser,
    toasts,
    login,
    logout,
    notify,
    dismissToast,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addSubject,
    updateSubject,
    deleteSubject,
    addUnit,
    updateUnit,
    deleteUnit,
    addPattern,
    updatePattern,
    deletePattern,
    savePaper,
    updatePaper,
    deletePaper,
    submitPaperForApproval,
    reviewPaper,
    logPaperEvent,
    addUser,
    updateUser,
    deleteUser,
    resetDemoData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
