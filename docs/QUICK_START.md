# Quick Start Guide - Group Lesson Assignment Feature

**TL;DR**: New UI components and API types ready to use. 5-minute integration.

## What's New? 🎉

Your lesson system can now:
- ✅ Assign one lesson to **multiple classes**
- ✅ Customize lessons **per group** (different teacher/subject/rooms)
- ✅ **Selectively** assign to only some groups (not all)

**Example**: 
```
Class 9A with 4 groups:
- Group 1 & 2: Math with Teacher A (standard)
- Group 3 & 4: Math with Teacher B (advanced)
→ One lesson, two configurations
```

## Files You Got 📦

### Components (Ready to Use)
1. **`AddLessonModalWithGroups.tsx`** - New lesson form
   - Multi-class picker
   - Group checkboxes
   - Per-group customization
   
2. **`GroupLessonDetailsDisplay.tsx`** - Show group assignments
   - Pretty card display
   - Shows teacher/subject/rooms per group

### Updated
3. **`src/types/api.ts`** - New types
4. **`src/api/lessonsApi.ts`** - Ready for arrays

### Documentation
5. **`GROUP_LESSON_INTEGRATION.md`** - Full guide (read this!)
6. **`GROUP_LESSON_UI_GUIDE.md`** - Visual reference
7. **`IMPLEMENTATION_CHECKLIST.md`** - Task list

## 60-Second Setup 🚀

### Before (Old Way)
```typescript
// Single class
classId: 5
```

### After (New Way)
```typescript
// Multiple classes
classId: [5, 6, 7]

// Optional: customize for groups
groups: [
  { groupId: 101, teacherId: 11, subjectId: 20, roomIds: [3] },
  { groupId: 102, teacherId: 12, subjectId: 21, roomIds: [4] }
]
```

## How to Integrate (3 Steps) 🔧

### Step 1: Update LessonsPage (2 min)

Change the import:
```tsx
// OLD
import AddLessonModal from '../AddLessonModal';

// NEW
import AddLessonModalWithGroups from '../AddLessonModalWithGroups';
```

Change the JSX:
```tsx
// OLD
<AddLessonModal open={isDialogOpen} onOpenChange={setIsDialogOpen} onSubmit={handleModalSubmit} />

// NEW
<AddLessonModalWithGroups open={isDialogOpen} onOpenChange={setIsDialogOpen} onSubmit={handleModalSubmit} editingLesson={editingLesson} />
```

### Step 2: Fix the Submit Handler (2 min)

Update `handleModalSubmit`:
```tsx
const handleModalSubmit = async (lessonData: any) => {
  try {
    const lessonRequest = {
      classId: lessonData.selectedClasses,  // ← Array now!
      teacherId: lessonData.selectedTeacherId,
      subjectId: parseInt(lessonData.subject),
      roomIds: lessonData.roomIds,
      lessonCount: lessonData.lessonsPerWeek,
      dayOfWeek: lessonData.dayOfWeek,
      hour: lessonData.hour,
      period: lessonData.period,
      frequency: lessonData.frequency,
      groups: lessonData.groups  // ← New: group assignments
    };

    if (editingLesson?.id) {
      await LessonService.update({ id: editingLesson.id, ...lessonRequest });
      toast.success('Lesson updated');
    } else {
      await LessonService.create(lessonRequest);
      toast.success('Lesson created');
    }

    setIsDialogOpen(false);
    setEditingLesson(null);
    await fetchLessons();
  } catch (error) {
    console.error('Error:', error);
    toast.error('Failed to save lesson');
  }
};
```

### Step 3: Show Group Details (1 min)

In your lesson display area, add:
```tsx
import GroupLessonDetailsDisplay from '@/components/GroupLessonDetailsDisplay';

// In your render:
{lesson.groupDetails && lesson.groupDetails.length > 0 && (
  <GroupLessonDetailsDisplay groupDetails={lesson.groupDetails} />
)}
```

**Done!** ✅

## Test It 🧪

### Test Case 1: Basic (No groups)
1. Click "Add Lesson"
2. Select subject, teacher, **one** class
3. Leave groups unchecked
4. Submit
5. ✓ Should work like before

### Test Case 2: Multi-class
1. Click "Add Lesson"
2. Select subject, teacher, **multiple** classes (9A, 9B, 9C)
3. Leave groups unchecked
4. Submit
5. ✓ Lesson applies to all classes

### Test Case 3: With Groups
1. Click "Add Lesson"
2. Select subject, teacher, one class
3. **Check** 2-3 groups
4. For each group, pick different teacher/subject/rooms
5. Submit
6. ✓ See group details in display

## API Payload Examples 📋

### Payload Sent to Backend
```json
{
  "classId": [1, 2, 3],
  "teacherId": 10,
  "subjectId": 15,
  "roomIds": [1, 2],
  "lessonCount": 2,
  "dayOfWeek": "MONDAY",
  "hour": 3,
  "period": 1,
  "frequency": "WEEKLY",
  "groups": [
    {
      "groupId": 101,
      "teacherId": 11,
      "subjectId": 16,
      "roomIds": [3]
    }
  ]
}
```

### Response from Backend
```json
{
  "id": 1,
  "class": { "id": 1, "name": "9A", ... },
  "teacher": { "id": 10, "fullName": "John Doe" },
  "rooms": [{ "id": 1, "name": "Lab 1" }],
  "subject": { "id": 15, "name": "Math" },
  "groupDetails": [
    {
      "group": { "id": 101, "name": "Group A" },
      "teacher": { "id": 11, "fullName": "Jane Smith" },
      "subject": { "id": 16, "name": "Advanced Math" },
      "rooms": [{ "id": 3, "name": "Lab 2" }]
    }
  ],
  "lessonCount": 2,
  "dayOfWeek": "MONDAY",
  "hour": 3,
  "period": 1,
  "frequency": "WEEKLY",
  "createdDate": "2026-01-24T...",
  "updatedDate": "2026-01-24T..."
}
```

## Troubleshooting 🔧

| Problem | Solution |
|---------|----------|
| `classId is not an array` | Ensure: `classId: Array.isArray(classId) ? classId : [classId]` |
| Groups not showing | Check: Class must have `groups` defined in API response |
| Form won't submit | Check: Main subject, teacher selected AND all checked groups have teacher+subject |
| No group details display | Check: Response includes `groupDetails` array from backend |
| Types error | Check: Import from `@/types/api`, not elsewhere |

## Key Differences 📊

| Feature | Old | New |
|---------|-----|-----|
| Classes | Single | Multiple |
| Group Support | ❌ No | ✅ Yes |
| Per-group Customization | ❌ No | ✅ Yes |
| Display Component | ❌ No | ✅ Yes |
| Validation | Basic | Enhanced |
| Group Details | ❌ N/A | ✅ Included |

## Important Notes ⚠️

### Breaking Changes
- `classId` is now **array** not single ID
- Old code expecting `classId: number` will need update

### Backward Compatible
- Groups are **optional** - null/undefined if not used
- Works with existing backend if updated properly
- Mock API ready immediately

### Next Steps
1. ✅ Types updated
2. ✅ Components created
3. ✅ API layer ready
4. ⏳ **You**: Update LessonsPage (5 min)
5. ⏳ Test integration
6. ⏳ Deploy

## Need More Help? 📚

1. **Full Integration Guide**: See `GROUP_LESSON_INTEGRATION.md`
2. **UI Reference**: See `GROUP_LESSON_UI_GUIDE.md`  
3. **Task Checklist**: See `IMPLEMENTATION_CHECKLIST.md`
4. **Component Code**: See `src/components/AddLessonModalWithGroups.tsx`

## Example: Full Workflow

```typescript
// 1. User fills form with:
//    - Subject: Math
//    - Teacher: John Doe (ID: 5)
//    - Classes: 9A, 9B (IDs: [1, 2])
//    - Groups selected:
//      * Group A: Teacher Jane (6), Subject Advanced Math (11), Rooms [3]
//      * Group B: Teacher Bob (7), Subject Basic Math (12), Rooms [4]

// 2. Component converts to API payload:
const payload = {
  subject: 10,           // Math
  selectedClasses: [1, 2],
  selectedTeacherId: 5,
  groups: [
    { groupId: 101, teacherId: 6, subjectId: 11, roomIds: [3] },
    { groupId: 102, teacherId: 7, subjectId: 12, roomIds: [4] }
  ]
};

// 3. Backend creates lesson with:
//    - Main lesson: Math with John in classes 9A, 9B
//    - Override for Group A: Advanced Math with Jane in Room 3
//    - Override for Group B: Basic Math with Bob in Room 4

// 4. Response includes groupDetails:
{
  id: 1,
  groupDetails: [
    {
      group: { id: 101, name: "Group A" },
      teacher: { fullName: "Jane" },
      subject: { name: "Advanced Math" },
      rooms: [{ name: "Lab 3" }]
    },
    {
      group: { id: 102, name: "Group B" },
      teacher: { fullName: "Bob" },
      subject: { name: "Basic Math" },
      rooms: [{ name: "Lab 4" }]
    }
  ]
}

// 5. UI displays group information beautifully
```

---

**Ready?** Update LessonsPage now! 🚀

Questions? Check the docs or code comments.
