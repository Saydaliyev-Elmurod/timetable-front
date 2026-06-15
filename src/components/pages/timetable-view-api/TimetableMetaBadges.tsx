import React from 'react';
import { AlertCircle, Users } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { TimetableMeta } from '../timetable-view/types';

interface Props {
  meta: TimetableMeta;
  scheduledFallback: number;
}

export function TimetableMetaBadges({ meta }: Props) {
  return (
    <div className="flex items-center gap-2 ml-2">
      {(meta.unscheduled ?? 0) > 0 && (
        <Badge variant="outline" className="gap-1 px-2 py-1 border-red-200 bg-red-50 text-red-600">
          <AlertCircle className="h-3 w-3" />
          {meta.unscheduled}
        </Badge>
      )}

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

