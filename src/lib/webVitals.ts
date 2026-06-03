/**
 * Web Vitals instrumentation — surfaces INP/LCP/CLS with attribution so we can
 * see *which* interaction and *which* script cause poor responsiveness, not just
 * the score. Built primarily to quantify the timetable-grid drag optimization
 * (content-visibility isolation): drag a few cards, read the INP attribution.
 *
 * Dev-only by default: `initWebVitals()` is called behind `import.meta.env.DEV`
 * in main.tsx, so production ships nothing. To enable real-user monitoring (RUM)
 * in production later, call `initWebVitals({ beacon: '/your-analytics' })` from a
 * prod path — it will `navigator.sendBeacon` the metric + attribution instead of
 * logging. No analytics endpoint exists yet, hence dev-only for now.
 *
 * INP subparts (from the Event Timing API) tell you where the latency lives:
 *   - inputDelay        — other JS already running when the interaction fired
 *   - processingDuration — the interaction's own event handlers (our drag code)
 *   - presentationDelay  — the browser rendering the next frame
 * longestScript (from the Long Animation Frames API, Chromium-only) names the
 * single slowest function during the interaction — the root cause to fix.
 */

import { onINP, onLCP, onCLS } from 'web-vitals/attribution';
import { logger } from './logger';

interface InitOptions {
  /** If set, POST metrics here via sendBeacon (production RUM) instead of logging. */
  beacon?: string;
}

const round = (n: number | undefined) => (typeof n === 'number' ? Math.round(n) : undefined);

function reportToConsole(name: string, metric: any) {
  const a = metric.attribution ?? {};
  const longest = a.longestScript?.entry;
  // One grouped, readable line per metric so the drag experiment is easy to read.
  logger.info(
    `%c[web-vitals] ${name} ${round(metric.value)}ms (${metric.rating})`,
    'font-weight:bold',
    {
      target: a.interactionTarget ?? a.element ?? a.largestShiftTarget,
      inputDelay: round(a.inputDelay),
      processing: round(a.processingDuration),
      presentation: round(a.presentationDelay),
      longestScript: longest
        ? {
            fn: longest.sourceFunctionName || '(anonymous)',
            url: longest.sourceURL,
            invoker: longest.invokerType,
          }
        : undefined,
    },
  );
}

function reportToBeacon(url: string, name: string, metric: any) {
  const a = metric.attribution ?? {};
  const longest = a.longestScript?.entry;
  navigator.sendBeacon(
    url,
    JSON.stringify({
      name,
      value: metric.value,
      rating: metric.rating,
      inputDelay: a.inputDelay,
      processingDuration: a.processingDuration,
      presentationDelay: a.presentationDelay,
      interactionTarget: a.interactionTarget,
      sourceFunctionName: longest?.sourceFunctionName,
      sourceURL: longest?.sourceURL,
      invokerType: longest?.invokerType,
    }),
  );
}

let started = false;

/** Register Core Web Vitals listeners. Idempotent. */
export function initWebVitals(opts: InitOptions = {}): void {
  if (started) return;
  started = true;

  const report = (name: string) => (metric: any) => {
    if (opts.beacon) reportToBeacon(opts.beacon, name, metric);
    else reportToConsole(name, metric);
  };

  // reportAllChanges surfaces every interaction in dev so you see each drag,
  // not just the final worst one at page unload.
  const allChanges = !opts.beacon;
  onINP(report('INP'), { reportAllChanges: allChanges });
  onLCP(report('LCP'));
  onCLS(report('CLS'), { reportAllChanges: allChanges });
}
