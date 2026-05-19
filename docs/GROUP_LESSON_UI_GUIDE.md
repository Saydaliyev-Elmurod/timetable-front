# Group Lesson Assignment - UI Changes Summary

## Visual Overview

### AddLessonModalWithGroups - New Features

```
┌─────────────────────────────────────────────────────────┐
│                    Add Lesson Dialog                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Subject *               [Select subject ▼]              │
│                                                           │
│  Main Teacher *          [Select teacher ▼]              │
│                                                           │
│  Classes *               [Search classes ▼]              │
│  ✓ 9A  ✓ 9B  ✓ 9C       (Selected: 3 classes)           │
│                                                           │
│  Day of Week *    Hour *                                 │
│  [MONDAY ▼]       [1___]                                 │
│                                                           │
│  Rooms (Main Lesson)                                     │
│  [Select rooms ▼]                                        │
│  ✓ Lab1  ✓ Room2                                         │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 🧑‍🎓 Assign Lessons to Groups (Optional)              │ │
│  │ Select groups to assign specific teachers,           │ │
│  │ subjects, or rooms                                   │ │
│  │                                                       │ │
│  │ ☐ Group A                                           │ │
│  │ ☑ Group B                                           │ │
│  │   Teacher: [Select ▼]                              │ │
│  │   Subject: [Select ▼]                              │ │
│  │   Rooms: [Edit rooms]                              │ │
│  │                                                       │ │
│  │ ☑ Group C                                           │ │
│  │   Teacher: [Select ▼]                              │ │
│  │   Subject: [Select ▼]                              │ │
│  │   Rooms: [Edit rooms]                              │ │
│  │                                                       │ │
│  │ ☐ Group D                                           │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│                [Cancel]  [Save Lesson]                   │
└─────────────────────────────────────────────────────────┘
```

### Changes from Old Modal

**OLD** (AddLessonModal):
- Single class selection
- Single teacher assignment
- No group-level customization
- Fixed placement toggle

**NEW** (AddLessonModalWithGroups):
- ✅ Multiple class selection
- ✅ Main teacher + optional group teachers
- ✅ Checkbox-based group selection
- ✅ Per-group teacher/subject/room assignment
- ✅ Optional groups section (hidden if no groups)
- ✅ Better validation messages

## User Workflows

### Workflow 1: Simple Lesson (No Groups)
```
1. User selects subject, main teacher, one class
2. No groups selected (unchecked)
3. Submit → Single lesson created
✓ Works exactly like old modal
```

### Workflow 2: Multi-Class Lesson
```
1. User selects subject, main teacher, classes [9A, 9B, 9C]
2. Groups section shows all groups from selected classes
3. Leave all groups unchecked
4. Submit → One lesson for all 3 classes
✓ New capability: One lesson covers multiple classes
```

### Workflow 3: Group Customization
```
1. Select 1 class with 4 groups
2. Check only 2 groups (e.g., advanced + honors)
3. For Group B: assign Teacher X, Subject Y, Room Z1
4. For Group C: assign Teacher X, Subject Z, Room Z2
5. Submit → Lesson with 2 group-specific configurations
✓ Groups B & C get custom assignments
✓ Groups A & D not affected
```

### Workflow 4: Mixed Classes + Groups
```
1. Select classes [9A, 9B]
   - 9A has groups: G1, G2, G3
   - 9B has groups: G4, G5, G6
2. Check only G2 and G4
3. Assign different configs to each
4. Submit → Lesson for both classes, special configs for G2, G4
✓ Most complex but most flexible
```

## Component Props & Data Flow

### AddLessonModalWithGroups Props
```typescript
interface AddLessonModalWithGroupsProps {
  open: boolean;                    // Dialog visibility
  onOpenChange: (open: boolean) => void;  // Toggle dialog
  onSubmit: (lessonData: any) => void;    // Submit handler
  editingLesson?: any;              // Optional: pre-fill for edit
}
```

### onSubmit Payload
```typescript
{
  // Main lesson info
  subject: 5,                    // Subject ID
  selectedClasses: [1, 2, 3],   // Class IDs (array!)
  selectedTeacherId: 10,        // Teacher ID (number)
  selectedTeacher: "John Doe",  // Teacher name (for display)
  dayOfWeek: "MONDAY",
  hour: 3,
  period: 1,
  frequency: "WEEKLY",
  roomIds: [1, 2],
  
  // Group assignments (optional)
  groups: [
    {
      groupId: 101,
      teacherId: 11,
      subjectId: 6,
      roomIds: [3, 4]
    },
    {
      groupId: 102,
      teacherId: 12,
      subjectId: 7,
      roomIds: [5]
    }
  ]
}
```

## API Integration Changes

### Before (Old LessonRequest)
```typescript
{
  classId: 5,              // Single class
  teacherId: 10,
  roomIds: [1, 2],
  subjectId: 15,
  lessonCount: 2,
  dayOfWeek: "MONDAY",
  hour: 3,
  period: 1
}
```

### After (New LessonRequest)
```typescript
{
  classId: [5, 6, 7],      // Array of classes ⚠️
  teacherId: 10,           // Main teacher
  roomIds: [1, 2],         // Main rooms
  subjectId: 15,
  lessonCount: 2,
  dayOfWeek: "MONDAY",
  hour: 3,
  period: 1,
  frequency: "WEEKLY",
  groups: [                 // ✨ NEW: Optional
    {
      groupId: 101,
      teacherId: 11,
      subjectId: 16,
      roomIds: [3]
    }
  ]
}
```

### Response Structure (New LessonResponse)
```typescript
{
  id: 1,
  class: { /* class info */ },
  teacher: { /* main teacher */ },
  rooms: [/* main rooms */],
  subject: { /* main subject */ },
  groupDetails: [                    // ✨ NEW
    {
      group: { id: 101, name: "Group B" },
      teacher: { /* group teacher */ },
      subject: { /* group subject */ },
      rooms: [/* group rooms */]
    },
    {
      group: { id: 102, name: "Group C" },
      teacher: { /* group teacher */ },
      subject: { /* group subject */ },
      rooms: [/* group rooms */]
    }
  ],
  lessonCount: 2,
  dayOfWeek: "MONDAY",
  hour: 3,
  period: 1,
  frequency: "WEEKLY",
  createdDate: "...",
  updatedDate: "..."
}
```

## Display Component (GroupLessonDetailsDisplay)

Shows group assignments in a card format:

```
┌──────────────────────────────────────────────────────────┐
│ 🧑‍🎓 Group-Specific Lesson Assignments                  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ [Group B]                                                │
│ 👨‍🏫 Teacher       Subject       📍 Rooms                │
│    Mrs. Smith      Math              Lab 1               │
│                                       Room 2              │
│                                                           │
│ [Group C]                                                │
│ 👨‍🏫 Teacher       Subject       📍 Rooms                │
│    Dr. Johnson     Physics           Lab 3               │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Key UI Interactions

### Interaction 1: Multi-Select Classes
```
User Action:        Click "Select classes..."
Result:            Popover opens with searchable list
UI State:          Selected classes shown as badges
Removal:           Click X on badge removes it
Multiple:          Can select/deselect multiple
```

### Interaction 2: Group Selection
```
User Action:        Click checkbox next to group name
Result:            Group expands to show config fields
UI State:          Teacher, Subject, Rooms inputs appear
Automatic:         Groups list updates when classes change
Conditional:       Groups section hidden if no groups
```

### Interaction 3: Room Selection
```
User Action:        Click "Select rooms" or "Edit rooms"
Result:            Modal popover with searchable rooms
UI State:          Selected rooms show as badges
Per-Group:         Each group has its own room list
Alternative:       Can share main lesson rooms or override
```

## Validation & Error Handling

### Form Validation States
```
❌ Invalid if:
  - Subject not selected
  - No classes selected
  - Main teacher not selected
  - Group is checked but missing teacher
  - Group is checked but missing subject

✅ Valid when:
  - Subject selected
  - At least 1 class selected
  - Main teacher selected
  - All checked groups have teacher & subject
  - Rooms optional (can be empty)
```

### Error Messages
```
Toast notification shows:
- "Please fill in all required fields"
- "All selected groups must have a teacher and subject assigned"
- "Failed to load teachers, subjects, classes, or rooms"
```

## Responsive Design

### Desktop (Full Width)
```
┌──────────────────────────────────────────────┐
│ Subject [________]  Teacher [________]       │
│ Classes [__________________]                 │
│ Day [__]  Hour [__]                          │
│ Rooms [__________________]                   │
│ ┌──────────────────────────────────────────┐ │
│ │ Group Selection                          │ │
│ │ ☑ Group B: Teacher [__]  Subject [__]   │ │
│ │ ☑ Group C: Teacher [__]  Subject [__]   │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### Tablet/Mobile
```
┌──────────────────────────┐
│ Subject [__________]     │
│ Teacher [__________]     │
│ Classes [__________]     │
│ Day [__]  Hour [__]      │
│ Rooms [__________]       │
│ ┌──────────────────────┐ │
│ │ Groups              │ │
│ │ ☑ Group B          │ │
│ │   Teacher [_____]   │ │
│ │   Subject [_____]   │ │
│ │ ☑ Group C          │ │
│ │   Teacher [_____]   │ │
│ │   Subject [_____]   │ │
│ └──────────────────────┘ │
│ [Cancel] [Save]          │
└──────────────────────────┘
```

## Accessibility Features

- ✅ Proper label associations (`htmlFor`)
- ✅ Required field indicators (`*`)
- ✅ Helpful descriptions under labels
- ✅ Semantic HTML structure
- ✅ Keyboard navigation support
- ✅ Aria attributes on combobox elements
- ✅ Hover states on interactive elements
- ✅ Color + icons (not just color) for status

## Backward Compatibility

### Old Code Still Works
```typescript
// Old modal still exists
import AddLessonModal from '@/components/AddLessonModal';

// Old API still works (handles single classId)
lessonsApi.createLesson({
  classId: 5,  // Single ID
  teacherId: 10,
  // ...
});
```

### Gradual Migration Path
```
Phase 1: ✅ New types in place
        ✅ New components available
        ✅ Mock API updated
        ✅ Old code still works

Phase 2: Replace AddLessonModal import
        Update handleModalSubmit
        Test with new data

Phase 3: Add GroupLessonDetailsDisplay
        Display group information
        Full integration complete

Phase 4: Remove old AddLessonModal
        Cleanup completed
```

## Performance Considerations

- Groups loaded only when classes are selected
- Search/filter optimized with `useMemo`
- Popover content lazy-rendered
- No unnecessary re-renders
- Mock API instant responses
- Ready for real API pagination

## Internationalization

All user-facing strings use `useTranslation()`:
- Toast messages support i18n
- Labels and descriptions translated
- Placeholder text localized
- Day names from system

Currently supports: EN, RU, UZ

Add new strings to locale files:
```json
{
  "lessons.assign_to_groups": "Assign Lessons to Groups",
  "lessons.group_teacher": "Group Teacher",
  "lessons.group_subject": "Group Subject"
}
```
