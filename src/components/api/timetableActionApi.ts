// Timetable Action API - Action-based approach for editing timetables
// Implements atomic operations: MOVE_LESSON, SWAP_LESSONS, PLACE_UNPLACED_LESSON

interface Position {
  day: string;
  hour: number;
  room_id?: number;
}

interface LessonInfo {
  id: string;
  source_position: Position;
}

// Action Types
export type ActionType = 'MOVE_LESSON' | 'SWAP_LESSONS' | 'PLACE_UNPLACED_LESSON';

// Move Lesson Action Payload
interface MoveLessonPayload {
  lesson_id: string;
  source_position: Position;
  target_position: Position;
}

// Swap Lessons Action Payload
interface SwapLessonsPayload {
  lesson_a: LessonInfo;
  lesson_b: LessonInfo;
}

// Place Unplaced Lesson Action Payload
interface PlaceUnplacedLessonPayload {
  lesson_id: string;
  target_position: Position;
}

// Generic Action Request
export interface TimetableActionRequest {
  action_type: ActionType;
  timetable_version: number;
  payload: MoveLessonPayload | SwapLessonsPayload | PlaceUnplacedLessonPayload;
}

// Soft Constraint Impact
interface SoftConstraintImpact {
  new_gaps?: Array<{
    entity_type: 'CLASS' | 'TEACHER';
    entity_id: number;
    day: string;
  }>;
  balance_change?: {
    class_id?: number;
    teacher_id?: number;
    day: string;
    new_load: number;
  };
  new_quality_score?: number;
  warnings?: string[];
}

// Validation Response
export interface ValidationResponse {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  soft_constraint_impact?: SoftConstraintImpact;
}

// Action Response
export interface ActionResponse {
  success: boolean;
  new_version: number;
  soft_constraint_impact?: SoftConstraintImpact;
  errors?: string[];
  message?: string;
}

// Mock storage for timetable state
let mockTimetableVersion = 1;
let mockLessons: Record<string, any> = {};

// Simulate network delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize mock lessons (you can populate this from TimetableViewPageWithAPI data)
export const initializeMockLessons = (lessons: any[]) => {
  mockLessons = {};
  lessons.forEach(lesson => {
    mockLessons[lesson.id] = {
      id: lesson.id,
      subject_id: lesson.subjectId,
      teacher_id: lesson.teacherId,
      class_id: lesson.classId,
      room_id: lesson.roomId,
      day: lesson.day,
      hour: lesson.timeSlot,
      is_locked: lesson.isLocked || false,
    };
  });
};

// Helper: Check if position is occupied
const isPositionOccupied = (day: string, hour: number, excludeLessonId?: string): boolean => {
  return Object.values(mockLessons).some(
    lesson => lesson.day === day && lesson.hour === hour && lesson.id !== excludeLessonId
  );
};

// Helper: Check teacher availability
const checkTeacherAvailability = (teacherId: number, day: string, hour: number, excludeLessonId?: string): boolean => {
  const hasConflict = Object.values(mockLessons).some(
    lesson => 
      lesson.teacher_id === teacherId && 
      lesson.day === day && 
      lesson.hour === hour &&
      lesson.id !== excludeLessonId
  );
  return !hasConflict;
};

// Helper: Check class availability
const checkClassAvailability = (classId: number, day: string, hour: number, excludeLessonId?: string): boolean => {
  const hasConflict = Object.values(mockLessons).some(
    lesson => 
      lesson.class_id === classId && 
      lesson.day === day && 
      lesson.hour === hour &&
      lesson.id !== excludeLessonId
  );
  return !hasConflict;
};

// Helper: Check room availability
const checkRoomAvailability = (roomId: number, day: string, hour: number, excludeLessonId?: string): boolean => {
  const hasConflict = Object.values(mockLessons).some(
    lesson => 
      lesson.room_id === roomId && 
      lesson.day === day && 
      lesson.hour === hour &&
      lesson.id !== excludeLessonId
  );
  return !hasConflict;
};

// Helper: Calculate soft constraint impact (simplified)
const calculateSoftConstraintImpact = (affectedLessonIds: string[]): SoftConstraintImpact => {
  // This is a simplified version. Real implementation would analyze:
  // - Gaps in schedule
  // - Daily load balance
  // - Teacher preferences
  // - etc.
  
  const warnings: string[] = [];
  const newGaps: any[] = [];
  
  // Simple quality score (percentage of lessons scheduled)
  const totalLessons = Object.keys(mockLessons).length;
  const scheduledLessons = Object.values(mockLessons).filter(l => l.day && l.hour).length;
  const qualityScore = totalLessons > 0 ? Math.round((scheduledLessons / totalLessons) * 100) : 0;
  
  return {
    new_quality_score: qualityScore,
    warnings,
    new_gaps: newGaps.length > 0 ? newGaps : undefined,
  };
};

// Validate Move Lesson
const validateMoveLesson = async (payload: MoveLessonPayload): Promise<ValidationResponse> => {
  await delay(200);
  
  const lesson = mockLessons[payload.lesson_id];
  if (!lesson) {
    return { valid: false, errors: ['Lesson not found'] };
  }
  
  if (lesson.is_locked) {
    return { valid: false, errors: ['Cannot move locked lesson'] };
  }
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if target position is occupied
  if (isPositionOccupied(payload.target_position.day, payload.target_position.hour, payload.lesson_id)) {
    errors.push('Target position is already occupied');
  }
  
  // Check teacher availability
  if (!checkTeacherAvailability(lesson.teacher_id, payload.target_position.day, payload.target_position.hour, payload.lesson_id)) {
    errors.push('Teacher is not available at this time');
  }
  
  // Check class availability
  if (!checkClassAvailability(lesson.class_id, payload.target_position.day, payload.target_position.hour, payload.lesson_id)) {
    errors.push('Class is not available at this time');
  }
  
  // Check room availability
  if (payload.target_position.room_id && !checkRoomAvailability(payload.target_position.room_id, payload.target_position.day, payload.target_position.hour, payload.lesson_id)) {
    errors.push('Room is not available at this time');
  }
  
  if (errors.length > 0) {
    return { valid: false, errors, warnings: warnings.length > 0 ? warnings : undefined };
  }
  
  const softImpact = calculateSoftConstraintImpact([payload.lesson_id]);
  
  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    soft_constraint_impact: softImpact,
  };
};

// Validate Swap Lessons
const validateSwapLessons = async (payload: SwapLessonsPayload): Promise<ValidationResponse> => {
  await delay(200);
  
  const lessonA = mockLessons[payload.lesson_a.id];
  const lessonB = mockLessons[payload.lesson_b.id];
  
  if (!lessonA || !lessonB) {
    return { valid: false, errors: ['One or both lessons not found'] };
  }
  
  if (lessonA.is_locked || lessonB.is_locked) {
    return { valid: false, errors: ['Cannot swap locked lessons'] };
  }
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if Lesson A can go to Lesson B's position
  if (!checkTeacherAvailability(lessonA.teacher_id, lessonB.day, lessonB.hour, lessonA.id)) {
    errors.push(`${lessonA.subject_name || 'Lesson A'}: Teacher not available at target time`);
  }
  if (!checkClassAvailability(lessonA.class_id, lessonB.day, lessonB.hour, lessonA.id)) {
    errors.push(`${lessonA.subject_name || 'Lesson A'}: Class not available at target time`);
  }
  
  // Check if Lesson B can go to Lesson A's position
  if (!checkTeacherAvailability(lessonB.teacher_id, lessonA.day, lessonA.hour, lessonB.id)) {
    errors.push(`${lessonB.subject_name || 'Lesson B'}: Teacher not available at target time`);
  }
  if (!checkClassAvailability(lessonB.class_id, lessonA.day, lessonA.hour, lessonB.id)) {
    errors.push(`${lessonB.subject_name || 'Lesson B'}: Class not available at target time`);
  }
  
  if (errors.length > 0) {
    return { valid: false, errors, warnings: warnings.length > 0 ? warnings : undefined };
  }
  
  const softImpact = calculateSoftConstraintImpact([payload.lesson_a.id, payload.lesson_b.id]);
  
  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    soft_constraint_impact: softImpact,
  };
};

// Validate Place Unplaced Lesson
const validatePlaceUnplacedLesson = async (payload: PlaceUnplacedLessonPayload): Promise<ValidationResponse> => {
  await delay(200);
  
  const lesson = mockLessons[payload.lesson_id];
  if (!lesson) {
    return { valid: false, errors: ['Lesson not found'] };
  }
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if target position is occupied
  if (isPositionOccupied(payload.target_position.day, payload.target_position.hour)) {
    errors.push('Target position is already occupied');
  }
  
  // Check teacher availability
  if (!checkTeacherAvailability(lesson.teacher_id, payload.target_position.day, payload.target_position.hour)) {
    errors.push('Teacher is not available at this time');
  }
  
  // Check class availability
  if (!checkClassAvailability(lesson.class_id, payload.target_position.day, payload.target_position.hour)) {
    errors.push('Class is not available at this time');
  }
  
  // Check room availability
  if (payload.target_position.room_id && !checkRoomAvailability(payload.target_position.room_id, payload.target_position.day, payload.target_position.hour)) {
    errors.push('Room is not available at this time');
  }
  
  if (errors.length > 0) {
    return { valid: false, errors, warnings: warnings.length > 0 ? warnings : undefined };
  }
  
  const softImpact = calculateSoftConstraintImpact([payload.lesson_id]);
  
  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    soft_constraint_impact: softImpact,
  };
};

// Apply Move Lesson
const applyMoveLesson = async (payload: MoveLessonPayload, version: number): Promise<ActionResponse> => {
  await delay(300);
  
  // Check version
  if (version !== mockTimetableVersion) {
    return {
      success: false,
      new_version: mockTimetableVersion,
      errors: ['Version conflict: timetable has been modified by another user'],
    };
  }
  
  // Validate again
  const validation = await validateMoveLesson(payload);
  if (!validation.valid) {
    return {
      success: false,
      new_version: mockTimetableVersion,
      errors: validation.errors,
    };
  }
  
  // Apply the change
  const lesson = mockLessons[payload.lesson_id];
  lesson.day = payload.target_position.day;
  lesson.hour = payload.target_position.hour;
  if (payload.target_position.room_id !== undefined) {
    lesson.room_id = payload.target_position.room_id;
  }
  
  // Increment version
  mockTimetableVersion++;
  
  const softImpact = calculateSoftConstraintImpact([payload.lesson_id]);
  
  return {
    success: true,
    new_version: mockTimetableVersion,
    soft_constraint_impact: softImpact,
    message: 'Lesson moved successfully',
  };
};

// Apply Swap Lessons
const applySwapLessons = async (payload: SwapLessonsPayload, version: number): Promise<ActionResponse> => {
  await delay(300);
  
  // Check version
  if (version !== mockTimetableVersion) {
    return {
      success: false,
      new_version: mockTimetableVersion,
      errors: ['Version conflict: timetable has been modified by another user'],
    };
  }
  
  // Validate again
  const validation = await validateSwapLessons(payload);
  if (!validation.valid) {
    return {
      success: false,
      new_version: mockTimetableVersion,
      errors: validation.errors,
    };
  }
  
  // Apply the swap
  const lessonA = mockLessons[payload.lesson_a.id];
  const lessonB = mockLessons[payload.lesson_b.id];
  
  const tempDay = lessonA.day;
  const tempHour = lessonA.hour;
  const tempRoom = lessonA.room_id;
  
  lessonA.day = lessonB.day;
  lessonA.hour = lessonB.hour;
  lessonA.room_id = lessonB.room_id;
  
  lessonB.day = tempDay;
  lessonB.hour = tempHour;
  lessonB.room_id = tempRoom;
  
  // Increment version
  mockTimetableVersion++;
  
  const softImpact = calculateSoftConstraintImpact([payload.lesson_a.id, payload.lesson_b.id]);
  
  return {
    success: true,
    new_version: mockTimetableVersion,
    soft_constraint_impact: softImpact,
    message: 'Lessons swapped successfully',
  };
};

// Apply Place Unplaced Lesson
const applyPlaceUnplacedLesson = async (payload: PlaceUnplacedLessonPayload, version: number): Promise<ActionResponse> => {
  await delay(300);
  
  // Check version
  if (version !== mockTimetableVersion) {
    return {
      success: false,
      new_version: mockTimetableVersion,
      errors: ['Version conflict: timetable has been modified by another user'],
    };
  }
  
  // Validate again
  const validation = await validatePlaceUnplacedLesson(payload);
  if (!validation.valid) {
    return {
      success: false,
      new_version: mockTimetableVersion,
      errors: validation.errors,
    };
  }
  
  // Apply the placement
  const lesson = mockLessons[payload.lesson_id];
  lesson.day = payload.target_position.day;
  lesson.hour = payload.target_position.hour;
  if (payload.target_position.room_id !== undefined) {
    lesson.room_id = payload.target_position.room_id;
  }
  
  // Increment version
  mockTimetableVersion++;
  
  const softImpact = calculateSoftConstraintImpact([payload.lesson_id]);
  
  return {
    success: true,
    new_version: mockTimetableVersion,
    soft_constraint_impact: softImpact,
    message: 'Lesson placed successfully',
  };
};

// Main API functions
const API_BASE_URL = 'http://localhost:8080/api/timetables';
const USE_MOCK_API = true; // Set to false when backend is available

export const timetableActionApi = {
  // Validate action before applying
  validateMove: async (timetableId: string, request: TimetableActionRequest): Promise<ValidationResponse> => {
    if (USE_MOCK_API) {
      const payload = request.payload;
      switch (request.action_type) {
        case 'MOVE_LESSON':
          return validateMoveLesson(payload as MoveLessonPayload);
        case 'SWAP_LESSONS':
          return validateSwapLessons(payload as SwapLessonsPayload);
        case 'PLACE_UNPLACED_LESSON':
          return validatePlaceUnplacedLesson(payload as PlaceUnplacedLessonPayload);
        default:
          return { valid: false, errors: ['Unknown action type'] };
      }
    }
    
    const response = await fetch(`${API_BASE_URL}/${timetableId}/validate-move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) throw new Error('Failed to validate action');
    return response.json();
  },

  // Apply action to timetable
  applyAction: async (timetableId: string, request: TimetableActionRequest): Promise<ActionResponse> => {
    if (USE_MOCK_API) {
      const payload = request.payload;
      switch (request.action_type) {
        case 'MOVE_LESSON':
          return applyMoveLesson(payload as MoveLessonPayload, request.timetable_version);
        case 'SWAP_LESSONS':
          return applySwapLessons(payload as SwapLessonsPayload, request.timetable_version);
        case 'PLACE_UNPLACED_LESSON':
          return applyPlaceUnplacedLesson(payload as PlaceUnplacedLessonPayload, request.timetable_version);
        default:
          return { success: false, new_version: request.timetable_version, errors: ['Unknown action type'] };
      }
    }
    
    const response = await fetch(`${API_BASE_URL}/${timetableId}/apply-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) throw new Error('Failed to apply action');
    return response.json();
  },
  
  // Get current version (for optimistic locking)
  getCurrentVersion: (): number => {
    return mockTimetableVersion;
  },
  
  // Reset version (for testing)
  resetVersion: (): void => {
    mockTimetableVersion = 1;
  },
};
