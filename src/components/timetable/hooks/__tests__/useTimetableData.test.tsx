import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTimetableData } from '../useTimetableData';
import * as apiModule from '@/lib/api';
import { organizationApi } from '@/api/organizationApi';
import { TimetableFullResponse, TimetableDataEntity, ClassResponse, TeacherResponse, SubjectResponse, RoomResponse, GroupResponse } from '../../types';

vi.mock('@/lib/api');
vi.mock('@/api/organizationApi');
vi.mock('@/components/api/timetableActionApi', () => ({
  initializeMockLessons: vi.fn(),
}));

describe('useTimetableData: processAPIData subject resolution', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should resolve per-detail subjectId when parent subjectId is null', async () => {
    const mockClasses: ClassResponse[] = [{
      id: 1, shortName: '4A', name: 'Class 4A', availabilities: [],
      teacher: { id: 1, fullName: 'John Doe', shortName: 'JD', availabilities: [], createdDate: '', updatedDate: '' },
      rooms: [], updatedDate: '', createdDate: '',
    }];

    const mockSubjects: SubjectResponse[] = [
      { id: 10, shortName: 'MAT', name: 'Math', availabilities: [] },
      { id: 20, shortName: 'PHY', name: 'Physics', availabilities: [] },
    ];

    const mockTeachers: TeacherResponse[] = [
      { id: 1, fullName: 'Alice Smith', shortName: 'AS', availabilities: [], createdDate: '', updatedDate: '' },
    ];

    const mockRooms: RoomResponse[] = [{ id: 1, name: 'Room 101' }];
    const mockGroups: GroupResponse[] = [];

    const mockTimetableData: TimetableDataEntity[] = [
      {
        id: 'slot-1', timetableId: 'tt-1', isScheduled: true, classId: 1,
        dayOfWeek: 'Monday', hour: 1, subjectId: null, weekIndex: null,
        slotDetails: [
          { lessonId: 1, subjectId: 10, teacherId: 1, roomId: 1, groupId: null },
          { lessonId: 2, subjectId: 20, teacherId: 1, roomId: 1, groupId: null },
        ],
        unscheduledData: null, version: 1,
      },
      {
        id: 'slot-2', timetableId: 'tt-1', isScheduled: true, classId: 1,
        dayOfWeek: 'Tuesday', hour: 2, subjectId: 10, weekIndex: null,
        slotDetails: [
          { lessonId: 3, subjectId: null, teacherId: 1, roomId: 1, groupId: null },
        ],
        unscheduledData: null, version: 1,
      },
    ];

    const mockResponse: TimetableFullResponse = {
      timetableData: mockTimetableData, classes: mockClasses, teachers: mockTeachers,
      subjects: mockSubjects, rooms: mockRooms, groups: mockGroups,
    };

    vi.mocked(apiModule.apiCall).mockResolvedValueOnce({
      data: mockResponse, error: null,
    } as any);

    vi.mocked(organizationApi.get).mockResolvedValueOnce({ periods: [] } as any);

    const { result } = renderHook(() => useTimetableData());

    await act(async () => {
      await result.current.fetchTimetableData('tt-1');
    });

    expect(result.current.scheduledLessons).toHaveLength(3);
    expect(result.current.scheduledLessons[0].subject).toBe('Math');
    expect(result.current.scheduledLessons[0].subjectId).toBe(10);
    expect(result.current.scheduledLessons[1].subject).toBe('Physics');
    expect(result.current.scheduledLessons[1].subjectId).toBe(20);
    expect(result.current.scheduledLessons[2].subject).toBe('Math');
    expect(result.current.scheduledLessons[2].subjectId).toBe(10);

    result.current.scheduledLessons.forEach((lesson) => {
      expect(lesson.subject).not.toBe('No Subject');
    });
  });
});
