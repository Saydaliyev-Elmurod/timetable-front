import { 
  TimetableState, 
  Position, 
  Lesson, 
  MoveValidationResult 
} from '@/types/timetable';

/**
 * Darsni yangi joyga ko'chirish mumkinligini tekshiradi
 */
export function validateMove(
  lesson: Lesson,
  targetPosition: Position,
  timetableState: TimetableState
): MoveValidationResult {
  const { day, hour, roomId } = targetPosition;
  const { teacherId, classId } = lesson;

  // 1. O'qituvchi bo'shmi?
  const teacher = timetableState.teachers[teacherId];
  if (!teacher) {
    return { isValid: false, reason: "O'qituvchi topilmadi" };
  }

  if (teacher.schedule[day][hour] !== 'FREE' && teacher.schedule[day][hour] !== lesson.id) {
    return { isValid: false, reason: "O'qituvchi bu vaqtda band" };
  }

  // 2. Sinf bo'shmi?
  const classObj = timetableState.classes[classId];
  if (!classObj) {
    return { isValid: false, reason: "Sinf topilmadi" };
  }

  if (classObj.schedule[day][hour] !== 'FREE' && classObj.schedule[day][hour] !== lesson.id) {
    return { isValid: false, reason: "Sinf bu vaqtda band" };
  }

  // 3. Xona bo'shmi?
  if (roomId) {
    const room = timetableState.rooms[roomId];
    if (!room) {
      return { isValid: false, reason: "Xona topilmadi" };
    }

    if (room.schedule[day][hour] !== 'FREE' && room.schedule[day][hour] !== lesson.id) {
      return { isValid: false, reason: "Xona bu vaqtda band" };
    }
  }

  // Yumshoq cheklovlarni baholash
  const softConstraints = evaluateSoftConstraints({
    ...timetableState,
    lessons: updateLessonPosition(lesson, targetPosition, timetableState)
  });

  return { 
    isValid: true, 
    reason: null,
    softConstraints 
  };
}

/**
 * Ikkita darsni almashtirish mumkinligini tekshiradi
 */
export function validateSwap(
  lessonA: Lesson,
  lessonB: Lesson,
  timetableState: TimetableState
): MoveValidationResult {
  // A ni B ning joyiga ko'chirish mumkinmi?
  const validationAtoB = validateMove(
    lessonA,
    { day: lessonB.day!, hour: lessonB.hour!, roomId: lessonB.roomId },
    timetableState
  );

  if (!validationAtoB.isValid) {
    return validationAtoB;
  }

  // B ni A ning joyiga ko'chirish mumkinmi?
  const validationBtoA = validateMove(
    lessonB,
    { day: lessonA.day!, hour: lessonA.hour!, roomId: lessonA.roomId },
    timetableState
  );

  if (!validationBtoA.isValid) {
    return validationBtoA;
  }

  // Yumshoq cheklovlarni baholash
  const softConstraints = evaluateSoftConstraints({
    ...timetableState,
    lessons: swapLessons(lessonA, lessonB, timetableState)
  });

  return {
    isValid: true,
    reason: null,
    softConstraints
  };
}

/**
 * Yumshoq cheklovlarni baholaydi
 */
function evaluateSoftConstraints(timetableState: TimetableState) {
  return {
    gaps: calculateGaps(timetableState),
    balanceScore: calculateBalanceScore(timetableState),
    preferenceScore: calculatePreferenceScore(timetableState)
  };
}

/**
 * "Oyna"lar sonini hisoblaydi
 */
function calculateGaps(timetableState: TimetableState): number {
  let gapCount = 0;

  // Har bir sinf uchun
  Object.values(timetableState.classes).forEach(classObj => {
    Object.values(classObj.schedule).forEach(daySchedule => {
      let hasLesson = false;
      let gapStarted = false;

      for (let hour = 1; hour <= 8; hour++) {
        const slot = daySchedule[hour];
        
        if (slot !== 'FREE') {
          if (gapStarted && hasLesson) {
            gapCount++;
          }
          hasLesson = true;
          gapStarted = false;
        } else if (hasLesson) {
          gapStarted = true;
        }
      }
    });
  });

  return gapCount;
}

/**
 * Kunlik yuklamaning muvozanatini hisoblaydi
 */
function calculateBalanceScore(timetableState: TimetableState): number {
  let score = 100;
  
  // Har bir sinf uchun kunlik darslar sonining o'rtacha chetlanishini hisoblaydi
  Object.values(timetableState.classes).forEach(classObj => {
    const lessonsPerDay = Object.values(classObj.schedule).map(day => 
      Object.values(day).filter(slot => slot !== 'FREE' && slot !== 'TIME-OFF').length
    );

    const avg = lessonsPerDay.reduce((a, b) => a + b) / lessonsPerDay.length;
    const deviation = Math.sqrt(
      lessonsPerDay.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / lessonsPerDay.length
    );

    score -= deviation * 10; // Har bir birlik chetlanish uchun 10 ball ayiriladi
  });

  return Math.max(0, score);
}

/**
 * O'qituvchilarning afzalliklariga moslik darajasini hisoblaydi
 */
function calculatePreferenceScore(timetableState: TimetableState): number {
  let score = 100;
  let totalPreferences = 0;
  let matchedPreferences = 0;

  Object.values(timetableState.teachers).forEach(teacher => {
    if (teacher.timePreferences) {
      const { preferredDays = [], preferredHours = [] } = teacher.timePreferences;
      
      Object.entries(teacher.schedule).forEach(([day, hours]) => {
        Object.entries(hours).forEach(([hour, slot]) => {
          if (slot !== 'FREE' && slot !== 'TIME-OFF') {
            totalPreferences++;
            if (preferredDays.includes(day)) matchedPreferences++;
            if (preferredHours.includes(Number(hour))) matchedPreferences++;
          }
        });
      });
    }
  });

  if (totalPreferences > 0) {
    score = (matchedPreferences / totalPreferences) * 100;
  }

  return score;
}

// Yordamchi funksiyalar
function updateLessonPosition(
  lesson: Lesson, 
  position: Position, 
  state: TimetableState
): Lesson[] {
  const lessons = Object.values(state.classes)
    .flatMap(c => Object.values(c.schedule)
      .flatMap(d => Object.values(d)
        .filter((slot): slot is number => typeof slot === 'number')
      )
    );
  
  return lessons.map(l => 
    l === lesson.id 
      ? { ...lesson, ...position }
      : lesson
  );
}

function swapLessons(
  lessonA: Lesson,
  lessonB: Lesson,
  state: TimetableState
): Lesson[] {
  const lessons = Object.values(state.classes)
    .flatMap(c => Object.values(c.schedule)
      .flatMap(d => Object.values(d)
        .filter((slot): slot is number => typeof slot === 'number')
      )
    );
    
  return lessons.map(l => {
    if (l === lessonA.id) {
      return { 
        ...lessonA, 
        day: lessonB.day, 
        hour: lessonB.hour, 
        roomId: lessonB.roomId 
      };
    }
    if (l === lessonB.id) {
      return { 
        ...lessonB, 
        day: lessonA.day, 
        hour: lessonA.hour, 
        roomId: lessonA.roomId 
      };
    }
    return l;
  });
}