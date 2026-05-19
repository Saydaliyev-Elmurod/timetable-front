import React from 'react';
import { AlertCircle, CheckCircle2, Info, User, Users } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { TimetableMeta } from '../timetable-view/types';

interface Props {
  meta: TimetableMeta;
  scheduledFallback: number;
}

export function TimetableMetaBadges({ meta, scheduledFallback }: Props) {
  const scoreTone =
    meta.score !== null && meta.score !== undefined
      ? meta.score >= 70
        ? 'border-green-300 bg-green-50 text-green-700'
        : meta.score >= 50
          ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
          : 'border-red-300 bg-red-50 text-red-700'
      : 'border-gray-200 text-gray-400';

  return (
    <div className="flex items-center gap-2 ml-2">
      <Badge variant="outline" className={`gap-1 px-2.5 py-1 font-bold border ${scoreTone}`}>
        <Info className="h-3 w-3" />
        {meta.score ?? '—'} ball
      </Badge>

      <Separator orientation="vertical" className="h-5" />

      <Badge variant="outline" className="gap-1 px-2 py-1 border-green-200 bg-green-50 text-green-700">
        <CheckCircle2 className="h-3 w-3" />
        {meta.scheduled ?? scheduledFallback}
      </Badge>
      {(meta.unscheduled ?? 0) > 0 && (
        <Badge variant="outline" className="gap-1 px-2 py-1 border-red-200 bg-red-50 text-red-600">
          <AlertCircle className="h-3 w-3" />
          {meta.unscheduled}
        </Badge>
      )}

      <Separator orientation="vertical" className="h-5" />

      <Badge
        variant="outline"
        className={`gap-1 px-2 py-1 ${
          (meta.teacherGaps ?? 0) > 0
            ? 'border-amber-200 bg-amber-50 text-amber-700'
            : 'border-gray-200 bg-gray-50 text-gray-400'
        }`}
      >
        <User className="h-3 w-3" />
        {meta.teacherGaps ?? 0}
      </Badge>
      <Badge
        variant="outline"
        className={`gap-1 px-2 py-1 ${
          (meta.classGaps ?? 0) > 0
            ? 'border-purple-200 bg-purple-50 text-purple-700'
            : 'border-gray-200 bg-gray-50 text-gray-400'
        }`}
      >
        <Users className="h-3 w-3" />
        {meta.classGaps ?? 0}
      </Badge>
    </div>
  );
}
