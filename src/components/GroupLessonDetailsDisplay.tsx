import React from 'react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { GroupLessonDetailResponse } from '@/types/api';
import { Users, BookOpen, GraduationCap, MapPin } from 'lucide-react';

interface GroupLessonDetailsDisplayProps {
  groupDetails?: GroupLessonDetailResponse[];
}

export default function GroupLessonDetailsDisplay({ groupDetails }: GroupLessonDetailsDisplayProps) {
  if (!groupDetails || groupDetails.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          Group-Specific Lesson Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {groupDetails.map((detail, idx) => (
            <div key={idx} className="p-3 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {detail.group.name}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-2 text-sm">
                {/* Teacher */}
                <div className="flex items-start gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Teacher</div>
                    <div className="font-medium">{detail.teacher.fullName}</div>
                  </div>
                </div>

                {/* Rooms */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Rooms</div>
                    <div className="flex flex-wrap gap-1">
                      {detail.rooms.length > 0 ? (
                        detail.rooms.map((room) => (
                          <Badge key={room.id} variant="secondary" className="text-xs">
                            {room.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">None assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
