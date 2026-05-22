import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  generationSocket,
  type GenerationStatusMessage,
  type PreflightReport,
} from '@/lib/generationSocket';
import { logger } from '@/lib/logger';
import { getOrgIdFromToken } from '@/lib/token';
import { PreflightReportDialog } from '@/components/PreflightReportDialog';

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
  // taskId -> handler for generations/optimizations this client is awaiting.
  // The org topic is the transport; we correlate events back to a watch by taskId.
  const watchersRef = useRef<Map<string, (msg: GenerationStatusMessage) => void>>(new Map());

  // Currently displayed pre-flight rejection report (structured, ordered).
  const [preflight, setPreflight] = useState<{ report: PreflightReport; name: string } | null>(null);

  // Keep the latest navigate fn in a ref so watchers created earlier still use it.
  const navigateRef = useRef(onNavigate);
  useEffect(() => {
    navigateRef.current = onNavigate;
  }, [onNavigate]);

  // Connect eagerly and subscribe to the per-org topic ON MOUNT (login), so we're
  // listening before any generation can finish — no subscribe-after-publish race.
  useEffect(() => {
    const orgId = getOrgIdFromToken();
    if (!orgId) {
      logger.warn('[generation] tokenda orgId yo‘q — generatsiya bildirishnomalari o‘chirildi');
      return;
    }
    generationSocket.connect();
    const watchers = watchersRef.current;
    const unsub = generationSocket.subscribe(`/topic/generation/org/${orgId}`, (msg) => {
      const handler = watchers.get(msg.taskId);
      if (handler) handler(msg);
      // else: event for a task this client isn't awaiting (other user, or after a
      // page reload that dropped the in-memory watch) — ignore.
    });
    return () => unsub();
  }, []);

  const watch = useCallback((taskId: string, opts: WatchOptions = {}) => {
    const label = opts.name?.trim() || 'Jadval';

    watchersRef.current.set(taskId, (msg) => {
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
        if (msg.preflight) {
          // Structured pre-flight rejection — open the ordered report dialog and
          // show a concise toast (with a way to re-open the details).
          const report = msg.preflight;
          setPreflight({ report, name: label });
          toast.error(
            `"${label}" yaratib bo'lmadi: ${report.criticalCount} ta kritik muammo`,
            { action: { label: 'Batafsil', onClick: () => setPreflight({ report, name: label }) } },
          );
        } else {
          toast.error(`"${label}" generatsiyasi muvaffaqiyatsiz: ${msg.message || 'xatolik'}`);
        }
        opts.onError?.(msg.message);
      } else {
        // PROCESSING or unknown — keep watching, no terminal action.
        return;
      }

      // Terminal event handled — stop watching this task.
      watchersRef.current.delete(taskId);
    });
  }, []);

  return (
    <GenerationContext.Provider value={{ watch }}>
      {children}
      <PreflightReportDialog
        report={preflight?.report ?? null}
        timetableName={preflight?.name}
        open={!!preflight}
        onOpenChange={(o) => {
          if (!o) setPreflight(null);
        }}
      />
    </GenerationContext.Provider>
  );
}

export function useGeneration(): GenerationContextValue {
  const ctx = useContext(GenerationContext);
  if (!ctx) {
    throw new Error('useGeneration must be used within a GenerationProvider');
  }
  return ctx;
}
