# Group Lesson Assignment - Integration Guide

## Overview

This guide explains how to integrate the new group lesson assignment feature into your School Timetable Management system.

The new API structure allows:
- **Multiple classes per lesson** - `classId` is now an array
- **Group-specific assignments** - Each group can have different teachers, subjects, and rooms
- **Flexible configuration** - Assign lessons only to selected groups (not all groups at once)

## Updated Types

### GroupLessonDetail (Request)
```typescript
interface GroupLessonDetail {
  groupId: number;
  teacherId: number;
  subjectId: number;
  roomIds: number[];
}
```

### GroupLessonDetailResponse (Response)
```typescript
interface GroupLessonDetailResponse {
  group: GroupResponse;
  teacher: TeacherResponse;
  subject: SubjectResponse;
  rooms: RoomResponse[];
}
```

### Updated LessonRequest
```typescript
interface LessonRequest {
  classId: number[];              // Changed from number to array
  teacherId: number;              // Main teacher
  roomIds: number[];
  subjectId: number;
  lessonCount: number;
  dayOfWeek: string;
  hour: number;
  frequency?: 'WEEKLY' | 'BI_WEEKLY' | 'TRI_WEEKLY';
  period: number;
  groups?: GroupLessonDetail[];   // NEW: Optional group assignments
}
```

### Updated LessonResponse
```typescript
interface LessonResponse {
  id: number;
  class: ClassResponse;
  teacher: TeacherResponse;
  rooms: RoomResponse[];
  subject: SubjectResponse;
  group?: GroupResponse;
  groupDetails?: GroupLessonDetailResponse[];  // NEW: Displays group assignments
  lessonCount: number;
  dayOfWeek: string;
  hour: number;
  period: number;
  frequency?: 'WEEKLY' | 'BI_WEEKLY' | 'TRI_WEEKLY';
  createdDate: string;
  updatedDate: string;
}
```

## New Components

### 1. AddLessonModalWithGroups
**File**: `src/components/AddLessonModalWithGroups.tsx`

Modern modal component with full group support:
- ✅ Select multiple classes
- ✅ Checkbox-based group selection
- ✅ Per-group teacher/subject/room assignment
- ✅ Form validation with helpful error messages
- ✅ Internationalization support

**Usage**:
```tsx
import AddLessonModalWithGroups from '@/components/AddLessonModalWithGroups';

<AddLessonModalWithGroups
  open={isDialogOpen}
  onOpenChange={setIsDialogOpen}
  onSubmit={handleModalSubmit}
  editingLesson={editingLesson}
/>
```

**Submitted Data Structure**:
```typescript
{
  subject: number;              // Subject ID
  selectedClasses: number[];    // Array of class IDs
  selectedTeacherId: number;    // Main teacher ID
  selectedTeacher: string;      // Teacher name (for display)
  dayOfWeek: string;           // 'MONDAY', 'TUESDAY', etc.
  hour: number;                // 1-12
  roomIds: number[];           // Main lesson rooms
  period: number;
  frequency: 'WEEKLY' | 'BI_WEEKLY' | 'TRI_WEEKLY';
  groups?: GroupLessonDetail[]; // Only includes selected groups
}
```

### 2. GroupLessonDetailsDisplay
**File**: `src/components/GroupLessonDetailsDisplay.tsx`

Read-only display component for group lesson assignments:
- Shows group name
- Displays assigned teacher
- Shows assigned subject
- Lists assigned rooms
- Color-coded icons for easy scanning

**Usage**:
```tsx
import GroupLessonDetailsDisplay from '@/components/GroupLessonDetailsDisplay';

<GroupLessonDetailsDisplay groupDetails={lesson.groupDetails} />
```

## Updated API Layer

**File**: `src/api/lessonsApi.ts`

The mock API now properly handles:
- Multiple class IDs in requests
- Group details in responses
- Creating lessons with group assignments
- Updating lessons with group modifications

### Mock Implementation Features:
- Automatically generates mock class data with groups
- Converts group details to/from API format
- Maintains data consistency in in-memory storage
- Ready to swap with real backend API

## Integration Steps

### Step 1: Update LessonsPage.tsx

Replace the old `AddLessonModal` import and usage:

```tsx
// Old
import AddLessonModal from '../AddLessonModal';
<AddLessonModal ... />

// New
import AddLessonModalWithGroups from '../AddLessonModalWithGroups';
<AddLessonModalWithGroups ... />
```

Update the `handleModalSubmit` function to handle the new group structure:

```tsx
const handleModalSubmit = async (lessonData: any) => {
  try {
    const subjectId = parseInt(lessonData.subject, 10);
    if (isNaN(subjectId)) {
      toast.error('Invalid subject');
      return;
    }

    // New: classId is now an array
    const lessonRequest = {
      classId: lessonData.selectedClasses,      // Array
      teacherId: lessonData.selectedTeacherId,
      subjectId: subjectId,
      roomIds: lessonData.roomIds,
      lessonCount: lessonData.lessonsPerWeek,
      dayOfWeek: lessonData.dayOfWeek,
      hour: lessonData.hour,
      period: lessonData.period,
      frequency: lessonData.frequency,
      groups: lessonData.groups || undefined     // Optional group assignments
    };

    if (editingLesson) {
      await LessonService.update({ id: editingLesson.id, ...lessonRequest } as any);
      toast.success('Lesson updated successfully');
    } else {
      await LessonService.create(lessonRequest as any);
      toast.success('Lesson created successfully');
    }

    setIsDialogOpen(false);
    setEditingLesson(null);
    fetchLessons();
  } catch (error) {
    console.error('Failed to save lesson:', error);
    toast.error('Failed to save lesson');
  }
};
```

### Step 2: Display Group Details

Add the group details component to your lesson display area (table row, card, etc.):

```tsx
import GroupLessonDetailsDisplay from '@/components/GroupLessonDetailsDisplay';

// In your lesson rendering code:
<GroupLessonDetailsDisplay groupDetails={lesson.groupDetails} />
```

### Step 3: Update LessonService (if custom)

If you have a custom `LessonService`, update its `create` and `update` methods to handle the new array structure:

```typescript
export const LessonService = {
  create: async (lesson: LessonRequest): Promise<LessonResponse> => {
    // Ensure classId is an array
    const payload = {
      ...lesson,
      classId: Array.isArray(lesson.classId) ? lesson.classId : [lesson.classId]
    };
    // Call API with payload
  },
  
  update: async (id: number, lesson: LessonUpdateRequest): Promise<LessonResponse> => {
    // Similar structure
  }
};
```

## Key Features Explained

### 1. Class Multi-Select
- Users can now assign one lesson to multiple classes
- Useful for parallel classes studying the same subject with the same teacher
- UI shows selected classes as dismissible badges

### 2. Group Checkboxes
- Groups appear only after selecting classes
- Each group can be independently selected
- Example: 4 groups in a class, but only 2 need this lesson

### 3. Per-Group Configuration
When a group is selected, users can assign:
- **Different teacher** than the main lesson teacher
- **Different subject** than the main lesson subject
- **Different rooms** than the main lesson rooms

This is useful for:
- Advanced groups (honors classes)
- Specialized subjects within a class
- Different classroom locations

### 4. Form Validation
The modal validates:
- Main subject is selected
- At least one class is selected
- Main teacher is selected
- All selected groups have teacher AND subject assigned
- Helpful error messages guide users

## Data Flow

### Creating a Lesson with Groups

```
User Form Input
    ↓
AddLessonModalWithGroups processes:
  - Classes: [1, 2, 3]
  - Main Teacher: ID 5
  - Main Subject: ID 10
  - Selected Groups:
    * Group A: Teacher 6, Subject 11, Rooms [1, 2]
    * Group C: Teacher 7, Subject 12, Rooms [3]
    ↓
Converts to LessonRequest:
  {
    classId: [1, 2, 3],
    teacherId: 5,
    subjectId: 10,
    roomIds: [...],
    groups: [
      { groupId: A, teacherId: 6, subjectId: 11, roomIds: [1, 2] },
      { groupId: C, teacherId: 7, subjectId: 12, roomIds: [3] }
    ]
  }
    ↓
API receives and processes
    ↓
Response includes groupDetails array
    ↓
LessonsPage displays both main info + group details
```

## Testing the Feature

### Test Case 1: Basic Lesson (No Groups)
1. Open "Add Lesson" modal
2. Select subject, class, main teacher
3. Submit without selecting any groups
4. Verify lesson is created with empty groupDetails

### Test Case 2: Multi-Class Lesson
1. Select multiple classes
2. Verify groups from all selected classes appear
3. Submit without group selections
4. Verify lesson applies to all classes

### Test Case 3: Group Customization
1. Select one class with multiple groups
2. Check 2-3 groups
3. For each group, assign different teacher/subject/rooms
4. Submit and verify group details in response

### Test Case 4: Mixed Configuration
1. Select multiple classes
2. Select only some groups from mixed classes
3. Assign different configurations to each
4. Verify in LessonResponse that groupDetails matches selections

## Migration from Old Modal

The old `AddLessonModal` is still available but handles only single-class lessons.

**To fully migrate**:
1. Replace all `AddLessonModal` imports with `AddLessonModalWithGroups`
2. Update form submission handlers as shown in Step 1
3. Add `GroupLessonDetailsDisplay` to lesson display areas
4. Test thoroughly with existing data

## Troubleshooting

### Issue: "classId is not an array"
**Solution**: Ensure form submission wraps classId in an array:
```typescript
classId: Array.isArray(lessonData.selectedClasses) 
  ? lessonData.selectedClasses 
  : [lessonData.selectedClasses]
```

### Issue: Groups not appearing
**Solution**: Check that selected classes have groups defined in ClassResponse:
```typescript
// Verify in API response
console.log(selectedClass.groups); // Should not be empty
```

### Issue: Group assignments not saved
**Solution**: Verify groups array is included in request and matches types:
```typescript
groups: selectedGroups.map(g => ({
  groupId: g.groupId,
  teacherId: g.teacherId,
  subjectId: g.subjectId,
  roomIds: g.roomIds
}))
```

## Next Steps

1. ✅ Update type definitions (Done)
2. ✅ Create new modal component (Done)
3. ✅ Create display component (Done)
4. ⏳ Integrate into LessonsPage
5. ⏳ Test with mock API
6. ⏳ Deploy to staging
7. ⏳ Test with real backend API

## Backend Requirements

Your backend API should:

**POST /api/lessons/v1 (Create)**
- Accept: `LessonRequest` with optional `groups` array
- Return: `LessonResponse` with populated `groupDetails`

**PUT /api/lessons/v1 (Update)**
- Accept: `LessonUpdateRequest` with optional `groups` array
- Return: `LessonResponse` with populated `groupDetails`

**Data Validation**:
- Verify classId array is not empty
- Verify all referenced groups exist
- Verify all group teachers have required subjects
- Prevent duplicate group assignments in single lesson

## Files Modified

1. ✅ `src/types/api.ts` - Added new types
2. ✅ `src/api/lessonsApi.ts` - Updated mock API
3. ✅ `src/components/AddLessonModalWithGroups.tsx` - New component
4. ✅ `src/components/GroupLessonDetailsDisplay.tsx` - New component
5. ⏳ `src/components/pages/LessonsPage.tsx` - Integration needed

## Support

For questions or issues:
1. Check the Troubleshooting section
2. Review component PropTypes/JSDoc
3. Check test cases in this guide
4. Review backend API documentation
