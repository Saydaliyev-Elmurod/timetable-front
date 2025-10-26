# Timetable API Integration Documentation

## Overview

This document describes the integration between the School Timetable Management System frontend and the backend API endpoints for managing timetables.

## API Endpoints

### 1. Get All Timetables
```
GET /api/timetable/v1/timetable
```

**Response:** Array of `TimetableEntity`

```typescript
interface TimetableEntity {
  id: string;             // UUID
  orgId: number;
  taskId: string;         // UUID
  name: string;
  deleted: boolean;
  createdDate: string;    // ISO 8601 datetime
  updatedDate: string;    // ISO 8601 datetime
}
```

**Example Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "orgId": 1,
    "taskId": "123e4567-e89b-12d3-a456-426614174001",
    "name": "Semester 1 - 2024",
    "deleted": false,
    "createdDate": "2024-09-15T10:30:00Z",
    "updatedDate": "2024-09-15T10:30:00Z"
  }
]
```

### 2. Get Timetable Data by ID
```
GET /api/timetable/v1/timetable/{id}
```

**Response:** Array of `TimetableDataEntity`

```typescript
interface TimetableDataEntity {
  id: string;                              // UUID
  timetableId: string;                     // UUID
  isScheduled: boolean;                    // True if lesson is scheduled
  subjectId: number;
  classId: number;
  roomId: number;
  teacherId: number;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  hour: number;                            // Period/lesson number (1-8)
  scheduledData: ScheduledData | null;     // Present if isScheduled = true
  unscheduledData: UnscheduledLesson | null; // Present if isScheduled = false
  version: number;
}

interface ScheduledData {
  day: string;                    // Day of week
  hour: number;                   // Period number
  teacher: TeacherResponse;
  subject: SubjectResponse;
  classObj: ClassResponse;
  roomId: number;
}

interface UnscheduledLesson {
  classInfo: ClassResponse;
  teacher: TeacherResponse;
  subject: SubjectResponse;
  requiredCount: number;          // Total lessons required
  scheduledCount: number;         // Lessons already scheduled
  missingCount: number;           // Lessons still needed
}

interface TeacherResponse {
  id: number;
  fullName: string;
  shortName: string;
  availabilities: TimeSlot[];
  createdDate: string;
  updatedDate: string;
}

interface SubjectResponse {
  id: number;
  shortName: string;
  name: string;
  availabilities: TimeSlot[];
}

interface ClassResponse {
  id: number;
  shortName: string;
  name: string;
  availabilities: TimeSlot[];
  teacher: TeacherResponse;
  rooms: RoomResponse[];
  updatedDate: string;
  createdDate: string;
}

interface RoomResponse {
  id: number;
  name: string;
}

interface TimeSlot {
  dayOfWeek: string;
  lessons: number[];              // Array of period numbers
}
```

**Example Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "timetableId": "123e4567-e89b-12d3-a456-426614174000",
    "isScheduled": true,
    "subjectId": 1,
    "classId": 1,
    "roomId": 101,
    "teacherId": 1,
    "dayOfWeek": "MONDAY",
    "hour": 1,
    "scheduledData": {
      "day": "MONDAY",
      "hour": 1,
      "teacher": {
        "id": 1,
        "fullName": "John Smith",
        "shortName": "J. Smith",
        "availabilities": [
          {
            "dayOfWeek": "MONDAY",
            "lessons": [1, 2, 3, 4]
          }
        ],
        "createdDate": "2024-09-01T00:00:00Z",
        "updatedDate": "2024-09-01T00:00:00Z"
      },
      "subject": {
        "id": 1,
        "shortName": "Math",
        "name": "Mathematics",
        "availabilities": []
      },
      "classObj": {
        "id": 1,
        "shortName": "5-A",
        "name": "Class 5-A",
        "availabilities": [],
        "teacher": { ... },
        "rooms": [],
        "createdDate": "2024-09-01T00:00:00Z",
        "updatedDate": "2024-09-01T00:00:00Z"
      },
      "roomId": 101
    },
    "unscheduledData": null,
    "version": 1
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174003",
    "timetableId": "123e4567-e89b-12d3-a456-426614174000",
    "isScheduled": false,
    "subjectId": 2,
    "classId": 2,
    "roomId": 0,
    "teacherId": 2,
    "dayOfWeek": "TUESDAY",
    "hour": 0,
    "scheduledData": null,
    "unscheduledData": {
      "classInfo": {
        "id": 2,
        "shortName": "5-B",
        "name": "Class 5-B",
        ...
      },
      "teacher": {
        "id": 2,
        "fullName": "Sarah Johnson",
        "shortName": "S. Johnson",
        ...
      },
      "subject": {
        "id": 2,
        "shortName": "Phys",
        "name": "Physics",
        ...
      },
      "requiredCount": 3,
      "scheduledCount": 0,
      "missingCount": 3
    },
    "version": 1
  }
]
```

## Frontend Components

### TimetablesPage.tsx

**Purpose:** Lists all available timetables

**Features:**
- Fetches timetables from `GET /api/timetable/v1/timetable`
- Displays timetables in a table with search and pagination
- Shows loading states and error handling
- Allows navigation to detailed timetable view
- Supports export to Excel/PDF (placeholder)
- Filters out deleted timetables

**State Management:**
- `timetables`: Array of TimetableEntity
- `isLoading`: Loading state
- `error`: Error message if API call fails
- Falls back to demo data if API is unavailable

### TimetableViewPageWithAPI.tsx

**Purpose:** Displays detailed timetable with interactive drag-and-drop scheduling

**Features:**
- Fetches timetable data from `GET /api/timetable/v1/timetable/{id}`
- Processes scheduled and unscheduled lessons
- Four view modes:
  - **Classes View**: Shows timetable for each class
  - **Teachers View**: Shows schedule for each teacher
  - **Rooms View**: Shows occupancy for each room
  - **Compact View**: Shows all classes in a grid
- Display options toggles (Subject, Teacher, Room)
- Filtering by class, teacher, or room
- Statistics panel (Schedule Integrity, Conflicts, Unplaced Lessons)
- Drag-and-drop lesson placement
- Unplaced lessons sidebar

**Data Processing:**
```typescript
// API Response → Internal Format
TimetableDataEntity[] → {
  scheduledLessons: Lesson[],
  unplacedLessons: UnplacedLesson[]
}

// Scheduled Lesson
if (entry.isScheduled && entry.scheduledData) {
  scheduledLessons.push({
    id: entry.id,
    subject: scheduledData.subject.name,
    teacher: scheduledData.teacher.fullName,
    room: `Room ${scheduledData.roomId}`,
    class: scheduledData.classObj.shortName,
    day: scheduledData.day,
    timeSlot: scheduledData.hour,
    isLocked: false
  });
}

// Unplaced Lesson
if (!entry.isScheduled && entry.unscheduledData) {
  unplacedLessons.push({
    id: entry.id,
    subject: unscheduledData.subject.name,
    teacher: unscheduledData.teacher.fullName,
    room: "TBD",
    class: unscheduledData.classInfo.shortName,
    reason: `Missing ${unscheduledData.missingCount} out of ${unscheduledData.requiredCount} required lessons`
  });
}
```

## Usage

### Viewing Timetables List

1. Navigate to the Timetables page
2. The page automatically fetches all timetables
3. Use the search bar to filter by name
4. Click the eye icon to view a timetable in detail

### Viewing Detailed Timetable

1. Click on a timetable from the list
2. The page loads with timetable data from the API
3. Use the segmented control to switch between view modes:
   - Classes: See each class's schedule
   - Teachers: See each teacher's schedule
   - Rooms: See room occupancy
   - Compact: Overview of all classes
4. Use display toggles to show/hide subject, teacher, room
5. Use the filter dropdown to focus on specific class/teacher/room
6. View unplaced lessons in the right sidebar
7. Drag lessons from the sidebar to place them manually

## Error Handling

Both components implement comprehensive error handling:

1. **Network Errors**: Caught and displayed with user-friendly messages
2. **Fallback Data**: Demo data is shown if API is unavailable
3. **Loading States**: Skeleton loaders and spinners during data fetch
4. **Empty States**: Clear messages when no data is available

## Local Caching (Future Enhancement)

To implement local caching:

```typescript
const CACHE_KEY = 'timetable_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Check cache before fetching
const cachedData = localStorage.getItem(CACHE_KEY);
if (cachedData) {
  const { data, timestamp } = JSON.parse(cachedData);
  if (Date.now() - timestamp < CACHE_DURATION) {
    return data;
  }
}

// Cache after fetching
localStorage.setItem(CACHE_KEY, JSON.stringify({
  data: timetableData,
  timestamp: Date.now()
}));
```

## Notes

- All dates from the API are in ISO 8601 format
- Day of week is uppercase (MONDAY, TUESDAY, etc.)
- Hour/period numbers typically range from 1-8
- UUIDs are used for timetable and timetable data IDs
- Integer IDs are used for teachers, subjects, classes, and rooms
