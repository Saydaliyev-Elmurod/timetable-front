import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { generationSocket, type GenerationStatusMessage } from '@/lib/generationSocket';
import { logger } from '@/lib/logger';

interface WatchOptions {
  /** Human-readable timetable name, used in the default success toast text. */
  name?: string;
  /** Overrides the default success toast text (e.g. for optimize). */
  successMessage?: string;
  /**
   * Show a "Ko'rish" action that navigates to the timetable. Defaults to true.
   * Set false when the user is already viewing the timetable (e.g. optimize).
   */
  showViewAction?: boolean;
  /** Called on SUCCESS with the freshly generated/optimized timetable id. */
  onComplete?: (timetableId: string, msg: GenerationStatusMessage) => void;
  /** Called on ERROR with the backend message. */
  onError?: (message: string) => void;
}

interface GenerationContextValue {
  /**
   * Start watching an async generation task. The connection lives in this
   * provider (mounted in Dashboard), so it survives page navigation — the
   * caller can unmount and the completion alert still fires.
   */
  watch: (taskId: string, opts?: WatchOptions) => void;
}

const GenerationContext = createContext<GenerationContextValue | null>(null);

export function GenerationProvider({
  onNavigate,
  children,
}: {
  /** Navigates the dashboard to a page id (e.g. `timetable-view-<id>`). */
  onNavigate?: (page: string) => void;
  children: React.ReactNode;
}) {
  // Track live subscriptions so we can tear them down if the provider unmounts.
  const unsubsRef = useRef<Set<() => void>>(new Set());

  // Keep the latest navigate fn in a ref so watchers created earlier still use it.
  const navigateRef = useRef(onNavigate);
  useEffect(() => {
    navigateRef.current = onNavigate;
  }, [onNavigate]);

  useEffect(() => {
    const unsubs = unsubsRef.current;
    return () => {
      unsubs.forEach((u) => u());
      unsubs.clear();
    };
  }, []);

  const watch = useCallback((taskId: string, opts: WatchOptions = {}) => {
    const label = opts.name?.trim() || 'Jadval';

    const unsub = generationSocket.watchGeneration(taskId, (msg) => {
      logger.info('[generation] event', taskId, msg.status);

      if (msg.status === 'SUCCESS' && msg.timetableId) {
        const timetableId = msg.timetableId;
        const showView = opts.showViewAction ?? true;
        // ALERT: only the timetableId comes over the socket; we announce it and
        // (optionally) offer to open the timetable page, which GETs + draws the grid.
        toast.success(opts.successMessage ?? `"${label}" jadvali tayyor bo'ldi`, {
          duration: 10000,
          action: showView
            ? {
                label: "Ko'rish",
                onClick: () => navigateRef.current?.(`timetable-view-${timetableId}`),
              }
            : undefined,
        });
        opts.onComplete?.(timetableId, msg);
      } else if (msg.status === 'ERROR') {
        toast.error(`"${label}" generatsiyasi muvaffaqiyatsiz: ${msg.message || 'xatolik'}`);
        opts.onError?.(msg.message);
      } else {
        // PROCESSING or unknown — keep watching, no terminal action.
        return;
      }

      // Terminal event handled — stop watching this task.
      cleanup();
    });

    const cleanup = () => {
      unsub();
      unsubsRef.current.delete(cleanup);
    };
    unsubsRef.current.add(cleanup);
  }, []);

  return <GenerationContext.Provider value={{ watch }}>{children}</GenerationContext.Provider>;
}

export function useGeneration(): GenerationContextValue {
  const ctx = useContext(GenerationContext);
  if (!ctx) {
    throw new Error('useGeneration must be used within a GenerationProvider');
  }
  return ctx;
}
