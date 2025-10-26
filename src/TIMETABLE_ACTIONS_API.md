# Timetable Actions API - Comprehensive Guide

## Overview

This document describes the action-based API design for editing timetables in the School Timetable Management System. The system implements atomic operations for manipulating timetables with proper validation, conflict detection, and optimistic locking.

## Design Philosophy

### Action-Based Approach

Instead of sending the entire timetable state to the server, the frontend sends specific **actions** (operations) that describe what the user wants to do. This approach provides:

- **Atomicity**: Each operation is a single, well-defined action
- **Server-side validation**: The backend has full control over business logic
- **Better error handling**: Easier to track what went wrong
- **Transaction safety**: Multiple changes can be rolled back if needed
- **Optimistic locking**: Prevents concurrent editing conflicts

### Key Principles

1. **Never trust frontend validation 100%** - Always re-validate on the server
2. **Optimistic locking** - Use version numbers to detect conflicts
3. **Informative responses** - Return detailed impact analysis, not just success/failure
4. **Two-step process** - Validate first, then apply

## API Endpoints

### 1. Validate Action (Quick Check)

**Endpoint**: `POST /api/timetables/{id}/validate-move`

**Purpose**: Fast validation check before actually applying changes. Provides immediate feedback to users.

**Request Body**:

```json
{
  "action_type": "MOVE_LESSON" | "SWAP_LESSONS" | "PLACE_UNPLACED_LESSON",
  "timetable_version": 1,
  "payload": { /* action-specific payload */ }
}
```

**Response**:

```json
{
  "valid": true,
  "errors": ["Teacher is not available at this time"],
  "warnings": ["This creates a gap in Monday schedule"],
  "soft_constraint_impact": {
    "new_gaps": [
      { "entity_type": "CLASS", "entity_id": 5, "day": "MONDAY" }
    ],
    "new_quality_score": 85
  }
}
```

### 2. Apply Action (Final Execution)

**Endpoint**: `POST /api/timetables/{id}/apply-action`

**Purpose**: Actually apply the validated action and persist changes to database.

**Request Body**: Same as validate-move

**Response**:

```json
{
  "success": true,
  "new_version": 2,
  "soft_constraint_impact": {
    "new_quality_score": 85,
    "warnings": ["Class 10A now has an unbalanced Monday schedule"],
    "new_gaps": [...]
  },
  "message": "Lesson moved successfully"
}
```

## Action Types

### 1. MOVE_LESSON - Moving a Lesson to Empty Slot

**Use Case**: User drags "Math lesson" from Monday Period 2 to Wednesday Period 4 (empty slot)

**Payload Structure**:

```json
{
  "action_type": "MOVE_LESSON",
  "timetable_version": 1,
  "payload": {
    "lesson_id": "lesson-uuid-123",
    "source_position": {
      "day": "MONDAY",
      "hour": 2,
      "room_id": 101
    },
    "target_position": {
      "day": "WEDNESDAY",
      "hour": 4,
      "room_id": 101
    }
  }
}
```

**Backend Validation**:

1. Check version number (optimistic locking)
2. Verify teacher is available at target time
3. Verify class is available at target time
4. Verify room is available at target time
5. Check if target slot is empty

**Database Operation**:

```sql
UPDATE lessons
SET day = 'WEDNESDAY',
    hour = 4,
    room_id = 101,
    updated_at = NOW()
WHERE id = 'lesson-uuid-123';

UPDATE timetables
SET version = version + 1
WHERE id = {timetable_id};
```

### 2. SWAP_LESSONS - Swapping Two Lessons

**Use Case**: User drags "Math" to where "Physics" is, swapping their positions

**Payload Structure**:

```json
{
  "action_type": "SWAP_LESSONS",
  "timetable_version": 2,
  "payload": {
    "lesson_a": {
      "id": "lesson-uuid-123",
      "source_position": { "day": "MONDAY", "hour": 2, "room_id": 101 }
    },
    "lesson_b": {
      "id": "lesson-uuid-456",
      "source_position": { "day": "WEDNESDAY", "hour": 4, "room_id": 202 }
    }
  }
}
```

**Backend Validation**:

1. Check version number
2. Verify both lessons exist
3. Verify neither lesson is locked
4. Check if Lesson A can go to Lesson B's position:
   - Teacher availability
   - Class availability
   - Room availability
5. Check if Lesson B can go to Lesson A's position:
   - Teacher availability
   - Class availability
   - Room availability

**Database Operation** (within transaction):

```sql
BEGIN TRANSACTION;

-- Store Lesson A's position temporarily
DECLARE @tempDay = (SELECT day FROM lessons WHERE id = 'lesson-uuid-123');
DECLARE @tempHour = (SELECT hour FROM lessons WHERE id = 'lesson-uuid-123');
DECLARE @tempRoom = (SELECT room_id FROM lessons WHERE id = 'lesson-uuid-123');

-- Move Lesson A to Lesson B's position
UPDATE lessons
SET day = (SELECT day FROM lessons WHERE id = 'lesson-uuid-456'),
    hour = (SELECT hour FROM lessons WHERE id = 'lesson-uuid-456'),
    room_id = (SELECT room_id FROM lessons WHERE id = 'lesson-uuid-456')
WHERE id = 'lesson-uuid-123';

-- Move Lesson B to Lesson A's old position
UPDATE lessons
SET day = @tempDay,
    hour = @tempHour,
    room_id = @tempRoom
WHERE id = 'lesson-uuid-456';

UPDATE timetables SET version = version + 1 WHERE id = {timetable_id};

COMMIT;
```

### 3. PLACE_UNPLACED_LESSON - Placing Unscheduled Lesson

**Use Case**: User drags lesson from "Unplaced Lessons" panel to Thursday Period 1

**Payload Structure**:

```json
{
  "action_type": "PLACE_UNPLACED_LESSON",
  "timetable_version": 3,
  "payload": {
    "lesson_id": "lesson-uuid-789",
    "target_position": {
      "day": "THURSDAY",
      "hour": 1,
      "room_id": 303
    }
  }
}
```

**Backend Validation**:

1. Check version number
2. Verify lesson exists and is currently unplaced
3. Verify target slot is empty
4. Check teacher availability
5. Check class availability
6. Check room availability

**Database Operation**:

```sql
UPDATE lessons
SET day = 'THURSDAY',
    hour = 1,
    room_id = 303,
    is_placed = true,
    updated_at = NOW()
WHERE id = 'lesson-uuid-789';

UPDATE timetables
SET version = version + 1
WHERE id = {timetable_id};
```

## Hard Constraints (Must Be Valid)

These constraints **MUST** be satisfied, or the action will be rejected:

1. **Teacher Availability**: Teacher cannot teach two classes at the same time
2. **Class Availability**: A class cannot have two lessons at the same time
3. **Room Availability**: A room cannot host two lessons at the same time
4. **Position Occupancy**: Cannot place a lesson in an already occupied slot (except SWAP)
5. **Lesson Lock**: Cannot move/swap locked lessons
6. **Subject-Teacher Match**: Teacher must be qualified to teach the subject

## Soft Constraints (Quality Indicators)

These constraints affect quality score but don't block the action:

1. **Schedule Gaps**: Minimize empty periods in a day
2. **Daily Load Balance**: Distribute lessons evenly across days
3. **Teacher Preferences**: Respect preferred time slots
4. **Consecutive Lessons**: Avoid too many consecutive periods of same subject
5. **First/Last Period Preferences**: Some subjects better suited for certain times

## Soft Constraint Impact Response

After each action, the backend calculates and returns the impact on soft constraints:

```typescript
interface SoftConstraintImpact {
  new_gaps?: Array<{
    entity_type: "CLASS" | "TEACHER";
    entity_id: number;
    day: string;
  }>;
  balance_change?: {
    class_id?: number;
    teacher_id?: number;
    day: string;
    new_load: number;
  };
  new_quality_score?: number; // 0-100
  warnings?: string[];
}
```

**Example**:

```json
{
  "new_quality_score": 85,
  "warnings": [
    "Class 10A now has a gap on Monday between periods 2 and 4",
    "Teacher John Smith has 5 lessons on Wednesday (unbalanced)"
  ],
  "new_gaps": [
    { "entity_type": "CLASS", "entity_id": 5, "day": "MONDAY" }
  ],
  "balance_change": {
    "teacher_id": 12,
    "day": "WEDNESDAY",
    "new_load": 5
  }
}
```

## Optimistic Locking (Version Control)

### Why Use Versioning?

Prevents two users from overwriting each other's changes:

**Scenario without versioning**:

1. User A loads timetable (version 1)
2. User B loads timetable (version 1)
3. User A moves Math lesson → saves successfully
4. User B moves Physics lesson → **overwrites A's change!** ❌

**Scenario with versioning**:

1. User A loads timetable (version 1)
2. User B loads timetable (version 1)
3. User A moves Math → server increments to version 2 ✓
4. User B tries to move Physics with version 1 → **REJECTED!** ✓
5. User B gets error: "Version conflict, please refresh"
6. User B refreshes → sees latest changes → continues editing ✓

### Implementation

**Frontend**:

```typescript
const [timetableVersion, setTimetableVersion] = useState(1);

const handleDrop = async (lesson, targetDay, targetSlot) => {
  const request = {
    action_type: "MOVE_LESSON",
    timetable_version: timetableVersion, // Send current version
    payload: {
      /* ... */
    },
  };

  const result = await applyAction(timetableId, request);

  if (result.success) {
    setTimetableVersion(result.new_version); // Update to new version
  } else if (result.errors?.includes("Version conflict")) {
    // Refresh timetable data
    await fetchTimetableData(timetableId);
    toast.error(
      "Someone else modified this timetable. Please try again.",
    );
  }
};
```

**Backend**:

```sql
UPDATE timetables
SET version = version + 1,
    updated_at = NOW()
WHERE id = @timetable_id
  AND version = @expected_version;  -- Only update if version matches

-- If 0 rows affected, version conflict occurred
IF @@ROWCOUNT = 0
  RETURN ERROR('Version conflict');
```

## Frontend Integration

### Step-by-Step Flow

1. **User Initiates Drag**

   ```typescript
   const [{ isDragging }, drag] = useDrag({
     type: "lesson",
     item: lesson,
   });
   ```

2. **User Drops on Target**

   ```typescript
   const [{ isOver }, drop] = useDrop({
     accept: "lesson",
     drop: (item) => handleDrop(item, day, timeSlot),
   });
   ```

3. **Determine Action Type**

   ```typescript
   const targetLesson = findLessonAt(day, timeSlot);
   const isUnplaced = unplacedLessons.includes(draggedLesson);

   let actionType;
   if (targetLesson && targetLesson.id !== draggedLesson.id) {
     actionType = "SWAP_LESSONS";
   } else if (isUnplaced) {
     actionType = "PLACE_UNPLACED_LESSON";
   } else {
     actionType = "MOVE_LESSON";
   }
   ```

4. **Validate Action (Optional but Recommended)**

   ```typescript
   const validation = await validateMove(
     timetableId,
     actionRequest,
   );

   if (!validation.valid) {
     toast.error(validation.errors.join(", "));
     return;
   }

   if (validation.warnings?.length > 0) {
     toast.warning(validation.warnings.join(", "));
   }
   ```

5. **Apply Action**

   ```typescript
   const result = await applyAction(timetableId, actionRequest);

   if (result.success) {
     setTimetableVersion(result.new_version);
     updateLocalState(actionRequest);
     toast.success(result.message);
   } else {
     toast.error(result.errors.join(", "));
   }
   ```

6. **Show Soft Constraint Impact**
   ```typescript
   if (result.soft_constraint_impact?.warnings) {
     toast.info("Quality Impact", {
       description:
         result.soft_constraint_impact.warnings.join(", "),
     });
   }
   ```

## Mock API Implementation

For development without a backend, the system includes a mock API that simulates all backend behavior:

```typescript
import {
  timetableActionApi,
  initializeMockLessons,
} from "../api/timetableActionApi";

// Initialize mock data
useEffect(() => {
  initializeMockLessons(scheduledLessons);
}, [scheduledLessons]);

// Use the same API interface
const result = await timetableActionApi.applyAction(
  timetableId,
  actionRequest,
);
```

### Switching to Real Backend

Simply change the flag in `/components/api/timetableActionApi.ts`:

```typescript
const USE_MOCK_API = false; // Set to false when backend is ready
```

All API calls will automatically switch to the real backend at `http://localhost:8080`.

## Error Handling

### Validation Errors (Before Application)

```json
{
  "valid": false,
  "errors": [
    "Teacher is not available at this time",
    "Class already has a lesson at this time"
  ]
}
```

**Frontend Response**: Show error toast, prevent action

### Application Errors (During Execution)

```json
{
  "success": false,
  "new_version": 1,
  "errors": [
    "Version conflict: timetable has been modified by another user"
  ]
}
```

**Frontend Response**: Refresh data, show error, ask user to retry

### Network Errors

```typescript
try {
  const result = await applyAction(timetableId, request);
} catch (error) {
  toast.error("Network error. Please check your connection.");
}
```

## Best Practices

### 1. Always Validate First (Optional but Recommended)

Provide immediate feedback without committing changes:

```typescript
// Quick validation on drop hover
const onDragOver = async (lesson, day, slot) => {
  const validation = await validateMove(
    timetableId,
    buildRequest(lesson, day, slot),
  );

  if (!validation.valid) {
    showVisualFeedback("error");
  } else if (validation.warnings) {
    showVisualFeedback("warning");
  } else {
    showVisualFeedback("success");
  }
};
```

### 2. Handle Version Conflicts Gracefully

```typescript
if (
  result.errors?.some((e) => e.includes("Version conflict"))
) {
  // Automatically refresh
  await fetchTimetableData(timetableId);

  // Ask user to retry
  const retry = await confirmDialog(
    "Timetable was modified by someone else. Retry this action?",
  );

  if (retry) {
    await handleDrop(lesson, day, slot); // Retry with new version
  }
}
```

### 3. Show Soft Constraint Impacts

Don't just silently apply changes - educate the user:

```typescript
if (result.soft_constraint_impact) {
  const impact = result.soft_constraint_impact;

  // Show quality score change
  if (impact.new_quality_score) {
    updateQualityDisplay(impact.new_quality_score);
  }

  // Highlight new gaps in the UI
  if (impact.new_gaps) {
    impact.new_gaps.forEach((gap) => {
      highlightCell(gap.day, gap.entity_id, "gap");
    });
  }

  // Show warnings
  if (impact.warnings) {
    toast.info("Scheduling Impact", {
      description: impact.warnings.join("\n"),
    });
  }
}
```

### 4. Optimistic UI Updates

Update UI immediately, rollback if action fails:

```typescript
// 1. Save current state
const previousState = cloneState(scheduledLessons);

// 2. Update UI optimistically
updateLessonPosition(lesson, day, slot);

// 3. Try to apply on server
const result = await applyAction(timetableId, request);

// 4. Rollback if failed
if (!result.success) {
  restoreState(previousState);
  toast.error("Action failed: " + result.errors.join(", "));
}
```

## Summary

This action-based API design provides:

✅ **Atomic operations** - Each action is clear and well-defined  
✅ **Server-side validation** - Security and data integrity  
✅ **Optimistic locking** - Prevents concurrent edit conflicts  
✅ **Rich feedback** - Detailed validation and impact analysis  
✅ **Flexible** - Easy to add new action types  
✅ **Testable** - Mock API for development  
✅ **Scalable** - Can handle complex business logic on server

The system is production-ready and can be connected to a real backend by simply changing the `USE_MOCK_API` flag.