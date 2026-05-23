import { useCallback, useEffect, useRef, useState } from 'react';
import { AUTONOMY_LEVELS } from '../data/autonomyLevels';
import { FEATURE_GROUPS } from '../data/featureGroups';
import type { DashboardPersistedState, NotebookWritingLogEntry, SecondReviewState } from '../types';
import { buildNovaReview } from '../utils/novaSecondReview';

const STORAGE_KEY = 'nova_control_room_v2';
const REVIEW_DEBOUNCE_MS = 400;

const NOTEBOOK_WRITING_DESCRIPTION =
  'Kate studies a subject, writes her version, and files it into the correct notebook—or creates a new notebook when needed.';

const EMPTY_REVIEW: SecondReviewState = {
  context: '',
  recommendation: '',
  acknowledged: false,
  finalApproved: false,
  updatedAt: null,
};

function buildDefaults(): DashboardPersistedState {
  const autonomyProgress: Record<string, number> = {};
  const itemProgress: Record<string, number> = {};

  for (const level of AUTONOMY_LEVELS) {
    autonomyProgress[`level_${level.level}`] = level.defaultProgress;
    for (const item of level.items) {
      itemProgress[item.id] = level.defaultProgress;
    }
  }

  const featureProgress: Record<string, number> = {};
  for (const group of FEATURE_GROUPS) {
    featureProgress[group.id] = 35;
    for (const item of group.items) {
      itemProgress[item.id] = 30;
    }
  }

  const bootLog: NotebookWritingLogEntry = {
    at: new Date().toISOString(),
    message:
      'Capability registered (disabled): study → write Kate version → file or create notebook.',
  };

  return {
    autonomyProgress,
    featureProgress,
    itemProgress,
    notebookWriting: {
      enabled: false,
      status: 'disabled',
      description: NOTEBOOK_WRITING_DESCRIPTION,
      log: [bootLog],
    },
    locationOpsEnabled: false,
    secondReview: { ...EMPTY_REVIEW },
  };
}

function loadState(): DashboardPersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('nova_control_room_v1');
    if (!raw) return buildDefaults();
    const parsed = JSON.parse(raw) as Partial<DashboardPersistedState>;
    const defaults = buildDefaults();
    return {
      ...defaults,
      ...parsed,
      notebookWriting: {
        ...defaults.notebookWriting,
        ...parsed.notebookWriting,
        enabled: false,
        status: 'disabled',
      },
      locationOpsEnabled: false,
      secondReview: { ...defaults.secondReview, ...parsed.secondReview },
    };
  } catch {
    return buildDefaults();
  }
}

export function useDashboardState() {
  const [state, setState] = useState<DashboardPersistedState>(loadState);
  const reviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    return () => {
      if (reviewTimer.current) clearTimeout(reviewTimer.current);
    };
  }, []);

  const postSecondReviewNow = useCallback((context: string, label: string, value: number) => {
    const recommendation = buildNovaReview(label, value, context);
    setState(prev => ({
      ...prev,
      secondReview: {
        context,
        recommendation,
        acknowledged: false,
        finalApproved: false,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const postSecondReview = useCallback(
    (context: string, label: string, value: number) => {
      if (reviewTimer.current) clearTimeout(reviewTimer.current);
      reviewTimer.current = setTimeout(() => {
        postSecondReviewNow(context, label, value);
      }, REVIEW_DEBOUNCE_MS);
    },
    [postSecondReviewNow],
  );

  const acknowledgeReview = useCallback(() => {
    setState(prev => ({
      ...prev,
      secondReview: { ...prev.secondReview, acknowledged: true, updatedAt: new Date().toISOString() },
    }));
  }, []);

  const finalApproveReview = useCallback(() => {
    setState(prev => ({
      ...prev,
      secondReview: {
        ...prev.secondReview,
        acknowledged: true,
        finalApproved: true,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const dismissReview = useCallback(() => {
    setState(prev => ({
      ...prev,
      secondReview: { ...EMPTY_REVIEW },
    }));
  }, []);

  const setLevelProgress = useCallback(
    (level: number, value: number, emitReview = false) => {
      const def = AUTONOMY_LEVELS.find(l => l.level === level);
      setState(prev => ({
        ...prev,
        autonomyProgress: { ...prev.autonomyProgress, [`level_${level}`]: value },
      }));
      if (emitReview) {
        postSecondReview(
          `Autonomy · Level ${level}`,
          def ? `Level ${level}: ${def.title}` : `Level ${level}`,
          value,
        );
      }
    },
    [postSecondReview],
  );

  const setItemProgress = useCallback(
    (itemId: string, value: number, reviewLabel?: string, emitReview = false) => {
      setState(prev => ({
        ...prev,
        itemProgress: { ...prev.itemProgress, [itemId]: value },
      }));
      if (reviewLabel && emitReview) {
        const ctx = itemId.startsWith('a')
          ? 'Autonomy · capability item'
          : itemId.startsWith('fg')
            ? 'Features'
            : 'Study · UI planning';
        postSecondReview(ctx, reviewLabel, value);
      }
    },
    [postSecondReview],
  );

  const setFeatureGroupProgress = useCallback(
    (groupId: string, value: number, emitReview = false) => {
      const group = FEATURE_GROUPS.find(g => g.id === groupId);
      setState(prev => ({
        ...prev,
        featureProgress: { ...prev.featureProgress, [groupId]: value },
      }));
      if (emitReview) {
        postSecondReview('Features', group?.title ?? groupId, value);
      }
    },
    [postSecondReview],
  );

  const logNotebookCapability = useCallback((message: string) => {
    const entry: NotebookWritingLogEntry = { at: new Date().toISOString(), message };
    setState(prev => ({
      ...prev,
      notebookWriting: {
        ...prev.notebookWriting,
        enabled: false,
        status: 'disabled',
        log: [entry, ...prev.notebookWriting.log].slice(0, 50),
      },
    }));
    console.info('[Nova Capability]', message);
  }, []);

  const requestNotebookWrite = useCallback(
    (subject: string) => {
      logNotebookCapability(
        `Write blocked (flag off): "${subject}" — flow: study → write Kate version → file or create notebook.`,
      );
      postSecondReviewNow('Study · notebook authoring', `Notebook write: ${subject}`, 0);
    },
    [logNotebookCapability, postSecondReviewNow],
  );

  return {
    state,
    setLevelProgress,
    setItemProgress,
    setFeatureGroupProgress,
    logNotebookCapability,
    requestNotebookWrite,
    acknowledgeReview,
    finalApproveReview,
    dismissReview,
  };
}
