export interface ScheduledLessonDto {
    id: string;              // Unique UUID
    subjectName: string;
    teacherName: string;
    groupNames: string;      // Could be single class or stream
    roomName: string | null; // Can be null if virtual

    // Positioning
    dayIndex: number;        // 0=Mon, 1=Tue...
    hourIndex: number;       // 1, 2, 3... (Starting slot)

    // Complex Logic Fields
    period: number;          // Duration in blocks (1, 2, 3)
    weekIndex: number | null;// null = Weekly, 0 = Week A, 1 = Week B
}

export interface LessonRequest {
    teacher: string;
    subject: string;
    classGroup: string;
    totalWeeklyHours: number; // 0.5, 1.0, 1.5, ...
}

export type LessonFrequency = 'WEEKLY' | 'BIWEEKLY' | 'WEEKLY_VARIED';

// For internal use in the grid
export interface GridCellData {
    dayIndex: number;
    hourIndex: number;
    weekA?: ScheduledLessonDto;
    weekB?: ScheduledLessonDto;
    weekly?: ScheduledLessonDto;
}
