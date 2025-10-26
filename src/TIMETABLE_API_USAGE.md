# Timetable API Integration - Usage Guide

## Overview

Your School Timetable Management System now has full API integration for viewing and managing timetables. This guide explains how to use the new features.

## What's New

### 1. TimetablesPage (Updated)
**Location:** `/components/pages/TimetablesPage.tsx`

**New Features:**
- ✅ Real API integration with `GET /api/timetable/v1/timetable`
- ✅ Loading states with spinners
- ✅ Error handling with fallback to demo data
- ✅ Displays actual timetable metadata (ID, name, created/updated dates)
- ✅ Click to view detailed timetable data

**How it works:**
1. When the page loads, it automatically fetches all timetables from the API
2. If the API is unavailable, it shows an error alert and falls back to demo data
3. You can search timetables by name
4. Click the eye icon to view a specific timetable

### 2. TimetableViewPageWithAPI (New)
**Location:** `/components/pages/TimetableViewPageWithAPI.tsx`

**Features:**
- ✅ Fetches detailed timetable data from `GET /api/timetable/v1/timetable/{id}`
- ✅ Processes scheduled and unscheduled lessons
- ✅ Four view modes (Classes, Teachers, Rooms, Compact)
- ✅ Display options toggles
- ✅ Advanced filtering
- ✅ Statistics dashboard
- ✅ Drag-and-drop lesson scheduling
- ✅ Unplaced lessons sidebar

**How it works:**
1. When you click a timetable from the list, this component loads
2. It fetches all timetable data entries for that specific timetable
3. The data is processed into:
   - **Scheduled Lessons**: Lessons with assigned day, time, teacher, room
   - **Unplaced Lessons**: Lessons that couldn't be scheduled
4. You can view the data in multiple ways and interact with it

### 3. Dashboard (Updated)
**Location:** `/components/Dashboard.tsx`

**Changes:**
- Routes like `timetable-view-{id}` now use the new API-powered component
- The timetable ID is passed as a string (UUID format)
- Seamless navigation between list and detail views

## User Flow

### Viewing Timetables

```
1. Dashboard → Click "Timetables" in sidebar
   ↓
2. TimetablesPage loads
   - Shows loading spinner
   - Fetches GET /api/timetable/v1/timetable
   - Displays table of all timetables
   ↓
3. Click eye icon on any timetable
   ↓
4. TimetableViewPageWithAPI loads
   - Shows loading spinner
   - Fetches GET /api/timetable/v1/timetable/{id}
   - Processes and displays timetable data
   ↓
5. Interact with timetable:
   - Switch view modes (Classes/Teachers/Rooms/Compact)
   - Toggle display options (Subject/Teacher/Room)
   - Apply filters (by Class/Teacher/Room)
   - View statistics
   - Drag unplaced lessons to schedule them
```

## API Data Flow

### Scheduled Lesson
```json
API Response:
{
  "isScheduled": true,
  "scheduledData": {
    "day": "MONDAY",
    "hour": 1,
    "teacher": { "fullName": "John Smith", ... },
    "subject": { "name": "Mathematics", ... },
    "classObj": { "shortName": "5-A", ... },
    "roomId": 101
  }
}

Transforms to:
{
  "subject": "Mathematics",
  "teacher": "John Smith",
  "room": "Room 101",
  "class": "5-A",
  "day": "MONDAY",
  "timeSlot": 1
}

Displayed in:
- Blue colored card in the timetable grid
- Shows subject, teacher, and room (based on display options)
- Can be dragged to different time slots
```

### Unscheduled Lesson
```json
API Response:
{
  "isScheduled": false,
  "unscheduledData": {
    "subject": { "name": "Physics", ... },
    "teacher": { "fullName": "Sarah Johnson", ... },
    "classInfo": { "shortName": "5-B", ... },
    "requiredCount": 3,
    "scheduledCount": 0,
    "missingCount": 3
  }
}

Transforms to:
{
  "subject": "Physics",
  "teacher": "Sarah Johnson",
  "room": "TBD",
  "class": "5-B",
  "reason": "Missing 3 out of 3 required lessons"
}

Displayed in:
- Unplaced Lessons sidebar (right side)
- Orange/red colored card
- Shows reason why it couldn't be scheduled
- Can be dragged to the timetable grid
```

## View Modes Explained

### Classes View
- Shows one grid per class
- Rows: Time slots (periods)
- Columns: Days of the week
- Best for: Viewing a class's complete schedule

### Teachers View
- Shows one grid per teacher
- Rows: Time slots (periods)
- Columns: Days of the week
- Green colored headers
- Shows which class each lesson is for
- Best for: Managing teacher workload and availability

### Rooms View
- Shows one grid per room
- Rows: Time slots (periods)
- Columns: Days of the week
- Amber colored headers
- Shows room occupancy
- Best for: Avoiding room conflicts

### Compact View
- Single grid showing all classes
- Rows: Day + Time combinations
- Columns: Classes
- Best for: Overview of entire timetable at once

## Statistics Panel

Located in the Filter dropdown, shows:

**Schedule Integrity**
- Percentage of lessons successfully scheduled
- Formula: `(scheduled / total) × 100`
- Green when high (>90%), yellow when medium, red when low

**Conflicts**
- Number of scheduling conflicts detected
- Currently: 0 (conflict detection to be implemented)

**Unplaced**
- Number of lessons that couldn't be scheduled
- Matches the count in the Unplaced Lessons sidebar

## Display Options

Three toggle buttons to control what information is shown on lesson cards:

1. **📚 Subject**: Show/hide subject name
2. **👤 Teacher**: Show/hide teacher name  
3. **🚪 Room**: Show/hide room number

Toggle any combination to customize the view density.

## Filtering

The Filter dropdown allows focusing on specific entities:

- **All**: Show everything (default)
- **By Class**: Show only one class's schedule
- **By Teacher**: Show only one teacher's schedule
- **By Room**: Show only one room's schedule

When a filter is applied, the view automatically adjusts to show only relevant data.

## Drag and Drop

**Moving Lessons:**
1. Hover over a lesson card
2. Click and drag it
3. Drop it on any time slot in the grid
4. The lesson moves to that day/time

**Placing Unscheduled Lessons:**
1. Find a lesson in the Unplaced Lessons sidebar
2. Click and drag it
3. Drop it on an empty time slot
4. It becomes a scheduled lesson

**Note:** Currently, drag-and-drop changes are local only. To save changes, you would need to implement a PUT/PATCH API call.

## Error Handling

**If API is unavailable:**
- ❌ Error alert appears at the top
- 📊 Demo data is shown instead
- ✅ All features continue to work
- Message: "Failed to fetch timetables - Showing demo data instead"

**If a specific timetable fails to load:**
- ❌ Error message is displayed
- 📊 Empty state is shown
- 🔄 You can navigate back to the list

## Testing Without Backend

The components are designed to work even if the backend API isn't available:

1. **TimetablesPage**: Shows 2 demo timetables
2. **TimetableViewPageWithAPI**: Shows empty state

To test with real data, ensure your backend is running and the API endpoints are accessible at:
- `http://your-domain/api/timetable/v1/timetable`
- `http://your-domain/api/timetable/v1/timetable/{id}`

## Future Enhancements

**Planned features:**

1. **Local Caching**
   - Cache timetable data in localStorage
   - Reduce API calls
   - Faster page loads

2. **Save Changes**
   - Implement PUT/PATCH API calls
   - Save drag-and-drop modifications
   - Update unplaced lessons

3. **Conflict Detection**
   - Detect teacher double-booking
   - Detect room conflicts
   - Detect class conflicts
   - Show visual indicators

4. **Bulk Operations**
   - Select multiple lessons
   - Move multiple lessons at once
   - Delete multiple lessons

5. **Print/Export**
   - PDF generation
   - Excel export with proper formatting
   - Print individual class schedules

## Component Files

```
/components/pages/
├── TimetablesPage.tsx              # List of timetables (API-integrated)
├── TimetableViewPageWithAPI.tsx    # Detailed view (API-integrated)
└── TimetableViewPage.tsx           # Original demo version (kept for reference)

/components/
└── Dashboard.tsx                   # Updated routing

/API_INTEGRATION.md                 # Detailed API documentation
/TIMETABLE_API_USAGE.md            # This file
```

## API Response Examples

For detailed API response formats and TypeScript interfaces, see `/API_INTEGRATION.md`.

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify API endpoints are accessible
3. Check network tab in dev tools
4. Ensure response format matches expected types
5. Review the TypeScript interfaces in the component files
