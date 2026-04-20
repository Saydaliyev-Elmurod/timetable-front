import { describe, it, expect } from 'vitest';
import { detectSlotConflict, ConflictStatus } from '../conflictDetection';
import type { Lesson } from '../../types';

/**
 * Factory helper to create test lessons with required slot-grouping fields.
 */
function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'lesson-1',
    subject: 'Math',
    subjectId: 10,
    teacher: 'John Doe',
    teacherId: 1,
    teacherShort: 'JD',
    room: 'Room 101',
    roomId: 101,
    class: '4A',
    classId: 1,
    day: 'Monday',
    timeSlot: 1,
    isLocked: false,
    groupName: undefined,
    groupId: undefined,
    weekIndex: null,
    isBiWeekly: false,
    slotKey: '1::Monday::1::null',
    groupIndex: 0,
    groupCount: 1,
    subjectColorIndex: 2,
    entityId: 'entity-1',
    version: 1,
    ...overrides,
  };
}

describe('detectSlotConflict', () => {
  it('returns "none" when target is null', () => {
    const result = detectSlotConflict(null, {
      day: 'Monday',
      timeSlot: 1,
      rowClass: '4A',
      allLessons: [],
    });
    expect(result.status).toBe('none');
  });

  it('returns "none" when target is undefined', () => {
    const result = detectSlotConflict(undefined, {
      day: 'Monday',
      timeSlot: 1,
      rowClass: '4A',
      allLessons: [],
    });
    expect(result.status).toBe('none');
  });

  it('returns "none" when hovering the origin slot of the target lesson', () => {
    const target = makeLesson({ day: 'Monday', timeSlot: 3, class: '4A' });
    const result = detectSlotConflict(target, {
      day: 'Monday',
      timeSlot: 3,
      rowClass: '4A',
      allLessons: [target],
    });
    expect(result.status).toBe('none');
  });

  it('returns "none" when hovering origin without rowClass check', () => {
    const target = makeLesson({ day: 'Friday', timeSlot: 5 });
    const result = detectSlotConflict(target, {
      day: 'Friday',
      timeSlot: 5,
      allLessons: [target],
    });
    expect(result.status).toBe('none');
  });

  it('returns "invalid-target-class" when rowClass !== target.class', () => {
    const target = makeLesson({ class: '4A' });
    const result = detectSlotConflict(target, {
      day: 'Tuesday',
      timeSlot: 2,
      rowClass: '5B',
      allLessons: [target],
    });
    expect(result.status).toBe('invalid-target-class');
    expect(result.reason?.message).toBe('This row is for 5B.');
  });

  it('returns "teacher-conflict" with conflictingLesson set', () => {
    const target = makeLesson({ id: 'lesson-1', teacherId: 1 });
    const offender = makeLesson({
      id: 'lesson-2',
      teacherId: 1,
      day: 'Tuesday',
      timeSlot: 2,
      class: '5B',
      subject: 'Physics',
      teacher: 'John Doe',
    });
    const result = detectSlotConflict(target, {
      day: 'Tuesday',
      timeSlot: 2,
      rowClass: '4A',
      allLessons: [target, offender],
    });
    expect(result.status).toBe('teacher-conflict');
    expect(result.reason?.message).toContain('John Doe');
    expect(result.reason?.message).toContain('already teaching');
    expect(result.reason?.conflictingLesson?.id).toBe('lesson-2');
  });

  it('teacher conflict wins over room conflict', () => {
    const target = makeLesson({
      id: 'lesson-1',
      teacherId: 1,
      roomId: 101,
    });
    const teacherOffender = makeLesson({
      id: 'lesson-2',
      teacherId: 1,
      roomId: 999,
      day: 'Wednesday',
      timeSlot: 3,
      teacher: 'John Doe',
      class: '5B',
    });
    const roomOffender = makeLesson({
      id: 'lesson-3',
      roomId: 101,
      teacherId: 999,
      day: 'Wednesday',
      timeSlot: 3,
      class: '5C',
    });
    const result = detectSlotConflict(target, {
      day: 'Wednesday',
      timeSlot: 3,
      rowClass: '4A',
      allLessons: [target, teacherOffender, roomOffender],
    });
    expect(result.status).toBe('teacher-conflict');
    expect(result.reason?.conflictingLesson?.id).toBe('lesson-2');
  });

  it('returns "room-conflict" when another lesson has same roomId at same slot', () => {
    const target = makeLesson({ id: 'lesson-1', roomId: 101, teacherId: 1 });
    const offender = makeLesson({
      id: 'lesson-2',
      roomId: 101,
      teacherId: 2,
      day: 'Thursday',
      timeSlot: 4,
      class: '5B',
      room: 'Room 101',
    });
    const result = detectSlotConflict(target, {
      day: 'Thursday',
      timeSlot: 4,
      rowClass: '4A',
      allLessons: [target, offender],
    });
    expect(result.status).toBe('room-conflict');
    expect(result.reason?.message).toContain('Room 101');
    expect(result.reason?.message).toContain('occupied');
    expect(result.reason?.conflictingLesson?.id).toBe('lesson-2');
  });

  it('skips room check when target.roomId === 0', () => {
    const target = makeLesson({ id: 'lesson-1', roomId: 0, teacherId: 1, classId: 1 });
    const otherLesson = makeLesson({
      id: 'lesson-2',
      roomId: 0,
      teacherId: 2,
      classId: 2,
      day: 'Friday',
      timeSlot: 5,
      class: '5B',
    });
    const result = detectSlotConflict(target, {
      day: 'Friday',
      timeSlot: 5,
      rowClass: '4A',
      allLessons: [target, otherLesson],
    });
    expect(result.status).toBe('valid');
  });

  it('skips room check when target.roomId is undefined', () => {
    const target = makeLesson({ id: 'lesson-1', roomId: undefined as any });
    const result = detectSlotConflict(target, {
      day: 'Friday',
      timeSlot: 5,
      rowClass: '4A',
      allLessons: [target],
    });
    expect(result.status).toBe('valid');
  });

  it('returns "class-conflict" when another lesson has same classId at same slot', () => {
    const target = makeLesson({ id: 'lesson-1', classId: 1, class: '4A', teacherId: 1 });
    const offender = makeLesson({
      id: 'lesson-2',
      classId: 1,
      class: '4A',
      subject: 'Physics',
      teacherId: 2,
      roomId: 102,
      day: 'Monday',
      timeSlot: 2,
      teacher: 'Jane Smith',
    });
    const result = detectSlotConflict(target, {
      day: 'Monday',
      timeSlot: 2,
      rowClass: '4A',
      allLessons: [target, offender],
    });
    expect(result.status).toBe('class-conflict');
    expect(result.reason?.message).toContain('4A');
    expect(result.reason?.message).toContain('already has');
    expect(result.reason?.conflictingLesson?.id).toBe('lesson-2');
  });

  it('returns "valid" when no conflicts exist', () => {
    const target = makeLesson({
      id: 'lesson-1',
      teacherId: 1,
      roomId: 101,
      classId: 1,
    });
    const other = makeLesson({
      id: 'lesson-2',
      teacherId: 2,
      roomId: 102,
      classId: 2,
      day: 'Tuesday',
      timeSlot: 2,
    });
    const result = detectSlotConflict(target, {
      day: 'Tuesday',
      timeSlot: 2,
      rowClass: '4A',
      allLessons: [target, other],
    });
    expect(result.status).toBe('valid');
  });

  it('snapshots teacher conflict message format', () => {
    const target = makeLesson({ id: 'lesson-1', teacherId: 1 });
    const offender = makeLesson({
      id: 'lesson-2',
      teacherId: 1,
      day: 'Tuesday',
      timeSlot: 2,
      teacher: 'Alice Johnson',
      class: '5C',
    });
    const result = detectSlotConflict(target, {
      day: 'Tuesday',
      timeSlot: 2,
      rowClass: '4A',
      allLessons: [target, offender],
    });
    expect(result.reason?.message).toMatchInlineSnapshot(
      '"Alice Johnson is already teaching 5C this period."'
    );
  });

  it('snapshots room conflict message format', () => {
    const target = makeLesson({ id: 'lesson-1', roomId: 101, room: 'Lab 1', teacherId: 1 });
    const offender = makeLesson({
      id: 'lesson-2',
      roomId: 101,
      teacherId: 2,
      day: 'Wednesday',
      timeSlot: 3,
      class: '5D',
    });
    const result = detectSlotConflict(target, {
      day: 'Wednesday',
      timeSlot: 3,
      rowClass: '4A',
      allLessons: [target, offender],
    });
    expect(result.reason?.message).toMatchInlineSnapshot(
      '"Lab 1 is occupied by 5D this period."'
    );
  });

  it('snapshots class conflict message format', () => {
    const target = makeLesson({
      id: 'lesson-1',
      classId: 1,
      class: '4A',
      teacherId: 1,
    });
    const offender = makeLesson({
      id: 'lesson-2',
      classId: 1,
      class: '4A',
      subject: 'Chemistry',
      teacherId: 2,
      roomId: 102,
      day: 'Thursday',
      timeSlot: 4,
    });
    const result = detectSlotConflict(target, {
      day: 'Thursday',
      timeSlot: 4,
      rowClass: '4A',
      allLessons: [target, offender],
    });
    expect(result.reason?.message).toMatchInlineSnapshot(
      '"4A already has Chemistry this period."'
    );
  });
});
