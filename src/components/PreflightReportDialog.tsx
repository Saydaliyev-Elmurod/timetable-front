import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lightbulb, XCircle } from 'lucide-react';
import type { PreflightIssue, PreflightReport } from '@/lib/generationSocket';

const RESOURCE_LABELS: Record<string, string> = {
  CLASS: 'Sinf',
  TEACHER: "O'qituvchi",
  ROOM: 'Xona',
  SYNC: 'Sinxron',
  GLOBAL: 'Umumiy',
};

/** Builds a short resource chip, e.g. "Sinf 7A". Returns null for global issues. */
function resourceChip(issue: PreflightIssue): string | null {
  if (!issue.resourceType || issue.resourceType === 'GLOBAL') return null;
  const label = RESOURCE_LABELS[issue.resourceType] ?? issue.resourceType;
  const name = issue.resourceName
    ? ` ${issue.resourceName}`
    : issue.resourceId != null
      ? ` #${issue.resourceId}`
      : '';
  return `${label}${name}`;
}

function IssueRow({ index, issue, tone }: { index: number; issue: PreflightIssue; tone: 'critical' | 'warning' }) {
  const isCritical = tone === 'critical';
  const chip = resourceChip(issue);
  return (
    <li
      className={`rounded-lg border p-3 ${
        isCritical ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            isCritical ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
          }`}
        >
          {index}
        </span>
        <div className="min-w-0 flex-1">
          {chip && (
            <Badge
              variant="outline"
              className={`mb-1 ${isCritical ? 'border-red-300 text-red-700' : 'border-amber-300 text-amber-700'}`}
            >
              {chip}
            </Badge>
          )}
          <p className="text-sm text-gray-800">{issue.message}</p>
          {issue.suggestions.length > 0 && (
            <ul className="mt-2 space-y-1">
              {issue.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-500" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * Renders a pre-flight rejection report: only CRITICAL issues (in backend order),
 * each with its resource and fix suggestions. WARNING-severity issues are NOT
 * shown — they are non-blocking and the backend no longer emits them in the alert.
 */
export function PreflightReportDialog({
  report,
  timetableName,
  open,
  onOpenChange,
}: {
  report: PreflightReport | null;
  timetableName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!report) return null;

  const criticals = report.issues.filter((i) => i.severity === 'CRITICAL');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Jadval yaratib bo'lmadi
          </DialogTitle>
          <DialogDescription>
            {timetableName ? `"${timetableName}" — ` : ''}Pre-flight diagnostika{' '}
            <b>{report.criticalCount}</b> ta kritik muammo topdi. Avval shu muammolarni bartaraf eting.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-3">
          {criticals.length > 0 && (
            <section className="mb-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-700">
                <XCircle className="h-4 w-4" />
                Kritik muammolar ({criticals.length})
              </h3>
              <ol className="space-y-2">
                {criticals.map((issue, i) => (
                  <IssueRow key={i} index={i + 1} issue={issue} tone="critical" />
                ))}
              </ol>
            </section>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
