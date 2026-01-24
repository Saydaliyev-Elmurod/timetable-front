# Backend Migration Guide - Group Lesson Assignment API

**For**: Backend Development Team  
**Date**: January 24, 2026  
**Scope**: Update lesson API endpoints to support group assignments

---

## 🎯 Objective

Update backend API endpoints to accept and return group-specific lesson assignments.

## 📊 API Changes Overview

### Before (v0.x)
```
POST /api/lessons/v1
{
  "classId": 5,              // Single class
  "teacherId": 10,
  "roomIds": [1, 2],
  "subjectId": 15,
  "lessonCount": 2,
  "dayOfWeek": "MONDAY",
  "hour": 3,
  "period": 1
}

Response:
{
  "id": 1,
  "class": { ... },
  "teacher": { ... },
  "rooms": [ ... ],
  "subject": { ... },
  "lessonCount": 2,
  "dayOfWeek": "MONDAY",
  "hour": 3,
  "period": 1,
  "createdDate": "...",
  "updatedDate": "..."
}
```

### After (v1.0+)
```
POST /api/lessons/v1
{
  "classId": [5, 6, 7],      // ← BREAKING: Now array!
  "teacherId": 10,
  "roomIds": [1, 2],
  "subjectId": 15,
  "lessonCount": 2,
  "dayOfWeek": "MONDAY",
  "hour": 3,
  "period": 1,
  "frequency": "WEEKLY",     // ← NEW: Optional
  "groups": [                // ← NEW: Optional group assignments
    {
      "groupId": 101,
      "teacherId": 11,
      "subjectId": 16,
      "roomIds": [3]
    }
  ]
}

Response:
{
  "id": 1,
  "class": { ... },
  "teacher": { ... },
  "rooms": [ ... ],
  "subject": { ... },
  "group": { ... },          // ← NEW: Optional
  "groupDetails": [          // ← NEW: Optional
    {
      "group": { "id": 101, "name": "Group B" },
      "teacher": { ... },
      "subject": { ... },
      "rooms": [ ... ]
    }
  ],
  "lessonCount": 2,
  "dayOfWeek": "MONDAY",
  "hour": 3,
  "period": 1,
  "frequency": "WEEKLY",
  "createdDate": "...",
  "updatedDate": "..."
}
```

---

## 📝 Type Definitions

### GroupLessonDetail (Request DTO)
```java
public record GroupLessonDetail(
    Integer groupId,
    Integer teacherId,
    Integer subjectId,
    List<Integer> roomIds
) {}
```

### GroupLessonDetailResponse (Response DTO)
```java
public record GroupLessonDetailResponse(
    GroupResponse group,
    TeacherResponse teacher,
    SubjectResponse subject,
    List<RoomResponse> rooms
) {}
```

### LessonRequest (Updated)
```java
public record LessonRequest(
    List<Integer> classId,              // ← CHANGED: Was Integer, now List
    Integer teacherId,
    List<Integer> roomIds,
    Integer subjectId,
    Integer lessonCount,
    DayOfWeek dayOfWeek,
    Integer hour,
    LessonFrequency frequency,
    Integer period,
    List<GroupLessonDetail> groups      // ← NEW: Optional
) {}
```

### LessonResponse (Updated)
```java
public record LessonResponse(
    Integer id,
    ClassResponse classInfo,            // or classDetails
    TeacherResponse teacher,
    List<RoomResponse> rooms,
    SubjectResponse subject,
    GroupResponse group,                // ← NEW: Optional
    List<GroupLessonDetailResponse> groupDetails,  // ← NEW: Optional
    Integer lessonCount,
    DayOfWeek dayOfWeek,
    Integer hour,
    Integer period,
    LessonFrequency frequency,
    Instant createdDate,
    Instant updatedDate
) {}
```

---

## 🔧 Implementation Guide

### Step 1: Update Database Schema (if needed)

**Existing Structure**:
```sql
CREATE TABLE lesson (
    id INT PRIMARY KEY,
    class_id INT,              -- Was single foreign key
    teacher_id INT,
    subject_id INT,
    lesson_count INT,
    day_of_week VARCHAR,
    hour INT,
    period INT,
    -- ...
);
```

**New Structure** (if needed):
```sql
CREATE TABLE lesson (
    id INT PRIMARY KEY,
    -- Multiple classes supported
    lesson_count INT,
    teacher_id INT,
    subject_id INT,
    day_of_week VARCHAR,
    hour INT,
    period INT,
    frequency VARCHAR DEFAULT 'WEEKLY',
    created_date TIMESTAMP,
    updated_date TIMESTAMP
);

-- Junction table for lesson-class relationship
CREATE TABLE lesson_class (
    lesson_id INT,
    class_id INT,
    PRIMARY KEY (lesson_id, class_id),
    FOREIGN KEY (lesson_id) REFERENCES lesson(id),
    FOREIGN KEY (class_id) REFERENCES class(id)
);

-- Group-specific assignments
CREATE TABLE lesson_group_detail (
    id INT PRIMARY KEY,
    lesson_id INT,
    group_id INT,
    teacher_id INT,           -- Can differ from main teacher
    subject_id INT,           -- Can differ from main subject
    created_date TIMESTAMP,
    updated_date TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lesson(id),
    FOREIGN KEY (group_id) REFERENCES group(id),
    FOREIGN KEY (teacher_id) REFERENCES teacher(id),
    FOREIGN KEY (subject_id) REFERENCES subject(id)
);

-- Group rooms
CREATE TABLE lesson_group_detail_room (
    group_detail_id INT,
    room_id INT,
    PRIMARY KEY (group_detail_id, room_id),
    FOREIGN KEY (group_detail_id) REFERENCES lesson_group_detail(id),
    FOREIGN KEY (room_id) REFERENCES room(id)
);
```

### Step 2: Update Service Layer

**LessonService.create()**
```java
public LessonResponse create(UserPrincipal principal, LessonRequest request) {
    // Validate input
    if (request.classId() == null || request.classId().isEmpty()) {
        throw new IllegalArgumentException("At least one class must be selected");
    }
    
    // Validate all classes exist and belong to org
    List<Class> classes = classService.findAllById(request.classId());
    if (classes.size() != request.classId().size()) {
        throw new NotFoundException("Some classes not found");
    }
    
    // Validate teacher exists
    Teacher teacher = teacherService.findById(request.teacherId());
    
    // Validate subject exists
    Subject subject = subjectService.findById(request.subjectId());
    
    // Validate main rooms if provided
    List<Room> mainRooms = Collections.emptyList();
    if (request.roomIds() != null && !request.roomIds().isEmpty()) {
        mainRooms = roomService.findAllById(request.roomIds());
    }
    
    // Create lesson entity
    Lesson lesson = new Lesson();
    lesson.setTeacher(teacher);
    lesson.setSubject(subject);
    lesson.setLessonCount(request.lessonCount());
    lesson.setDayOfWeek(request.dayOfWeek());
    lesson.setHour(request.hour());
    lesson.setPeriod(request.period());
    lesson.setFrequency(request.frequency());
    lesson.setOrganizationId(principal.orgId());
    
    // Save lesson
    lesson = lessonRepository.save(lesson);
    final Lesson savedLesson = lesson;
    
    // Create lesson-class associations
    for (Class classEntity : classes) {
        LessonClass lc = new LessonClass();
        lc.setLesson(savedLesson);
        lc.setClassEntity(classEntity);
        lessonClassRepository.save(lc);
    }
    
    // Create lesson-room associations
    for (Room room : mainRooms) {
        LessonRoom lr = new LessonRoom();
        lr.setLesson(savedLesson);
        lr.setRoom(room);
        lessonRoomRepository.save(lr);
    }
    
    // Handle group assignments if provided
    if (request.groups() != null && !request.groups().isEmpty()) {
        for (GroupLessonDetail groupDetail : request.groups()) {
            // Validate group exists
            Group group = groupService.findById(groupDetail.groupId());
            
            // Validate group teacher exists
            Teacher groupTeacher = teacherService.findById(groupDetail.teacherId());
            
            // Validate group subject exists
            Subject groupSubject = subjectService.findById(groupDetail.subjectId());
            
            // Validate group rooms if provided
            List<Room> groupRooms = Collections.emptyList();
            if (groupDetail.roomIds() != null && !groupDetail.roomIds().isEmpty()) {
                groupRooms = roomService.findAllById(groupDetail.roomIds());
            }
            
            // Create group detail entity
            LessonGroupDetail gd = new LessonGroupDetail();
            gd.setLesson(savedLesson);
            gd.setGroup(group);
            gd.setTeacher(groupTeacher);
            gd.setSubject(groupSubject);
            gd = lessonGroupDetailRepository.save(gd);
            
            // Create group-room associations
            for (Room room : groupRooms) {
                LessonGroupDetailRoom gr = new LessonGroupDetailRoom();
                gr.setGroupDetail(gd);
                gr.setRoom(room);
                lessonGroupDetailRoomRepository.save(gr);
            }
        }
    }
    
    // Build and return response
    return convertToResponse(savedLesson);
}

public LessonResponse update(UserPrincipal principal, Integer id, LessonUpdateRequest request) {
    // Similar validation logic
    // If groups array is empty, delete existing groups
    // If groups array has items, replace existing groups
    
    Lesson lesson = lessonRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Lesson not found"));
    
    // Update main lesson fields
    lesson.setDayOfWeek(request.dayOfWeek());
    lesson.setHour(request.hour());
    lesson.setPeriod(request.period());
    lesson.setFrequency(request.frequency());
    lesson.setLessonCount(request.lessonCount());
    
    lesson = lessonRepository.save(lesson);
    
    // Handle classes
    lessonClassRepository.deleteByLessonId(id);
    for (Integer classId : request.classId()) {
        Class classEntity = classService.findById(classId);
        LessonClass lc = new LessonClass();
        lc.setLesson(lesson);
        lc.setClassEntity(classEntity);
        lessonClassRepository.save(lc);
    }
    
    // Handle groups
    lessonGroupDetailRepository.deleteByLessonId(id);
    if (request.groups() != null && !request.groups().isEmpty()) {
        // Similar group creation logic as in create()
    }
    
    return convertToResponse(lesson);
}
```

### Step 3: Update Response Converter

```java
private LessonResponse convertToResponse(Lesson lesson) {
    // Get all classes for this lesson
    List<LessonClass> lessonClasses = lessonClassRepository.findByLessonId(lesson.getId());
    List<ClassResponse> classes = lessonClasses.stream()
        .map(lc -> classService.toResponse(lc.getClassEntity()))
        .collect(Collectors.toList());
    
    // Get main lesson rooms
    List<Room> rooms = lessonRoomRepository.findByLessonId(lesson.getId())
        .stream()
        .map(LessonRoom::getRoom)
        .collect(Collectors.toList());
    
    List<RoomResponse> roomResponses = rooms.stream()
        .map(roomService::toResponse)
        .collect(Collectors.toList());
    
    // Get group details
    List<LessonGroupDetail> groupDetails = lessonGroupDetailRepository
        .findByLessonId(lesson.getId());
    
    List<GroupLessonDetailResponse> groupResponses = groupDetails.stream()
        .map(gd -> {
            List<Room> groupRooms = lessonGroupDetailRoomRepository
                .findByGroupDetailId(gd.getId())
                .stream()
                .map(LessonGroupDetailRoom::getRoom)
                .collect(Collectors.toList());
            
            return new GroupLessonDetailResponse(
                groupService.toResponse(gd.getGroup()),
                teacherService.toResponse(gd.getTeacher()),
                subjectService.toResponse(gd.getSubject()),
                groupRooms.stream()
                    .map(roomService::toResponse)
                    .collect(Collectors.toList())
            );
        })
        .collect(Collectors.toList());
    
    return new LessonResponse(
        lesson.getId(),
        classes.size() > 0 ? classService.toResponse(classes.get(0)) : null,
        teacherService.toResponse(lesson.getTeacher()),
        roomResponses,
        subjectService.toResponse(lesson.getSubject()),
        null,  // group field (main group if concept applies)
        groupResponses,
        lesson.getLessonCount(),
        lesson.getDayOfWeek(),
        lesson.getHour(),
        lesson.getPeriod(),
        lesson.getFrequency(),
        lesson.getCreatedDate(),
        lesson.getUpdatedDate()
    );
}
```

### Step 4: Update REST Endpoints

```java
@RestController
@RequestMapping("/api/lessons/v1")
@RequiredArgsConstructor
public class LessonController {
    
    private final LessonService lessonService;
    
    @PostMapping
    public ResponseEntity<LessonResponse> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody LessonRequest request) {
        LessonResponse response = lessonService.create(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @PutMapping
    public ResponseEntity<LessonResponse> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody LessonUpdateRequest request) {
        LessonResponse response = lessonService.update(principal, request.id(), request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    public ResponseEntity<Page<LessonResponse>> getAll(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<LessonResponse> response = lessonService.getAll(principal.orgId(), page, size);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<LessonResponse>> getAllList(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<LessonResponse> response = lessonService.getAllList(principal.orgId());
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id) {
        lessonService.delete(principal.orgId(), id);
        return ResponseEntity.noContent().build();
    }
}
```

### Step 5: Add Validation

```java
@Component
public class LessonValidator {
    
    public void validateCreate(LessonRequest request) {
        if (request.classId() == null || request.classId().isEmpty()) {
            throw new ValidationException("At least one class must be selected");
        }
        
        if (request.teacherId() == null) {
            throw new ValidationException("Teacher must be selected");
        }
        
        if (request.subjectId() == null) {
            throw new ValidationException("Subject must be selected");
        }
        
        if (request.dayOfWeek() == null) {
            throw new ValidationException("Day of week must be specified");
        }
        
        if (request.hour() == null || request.hour() < 1 || request.hour() > 12) {
            throw new ValidationException("Hour must be between 1 and 12");
        }
        
        if (request.period() == null || request.period() < 1) {
            throw new ValidationException("Period must be positive");
        }
        
        if (request.lessonCount() == null || request.lessonCount() < 1) {
            throw new ValidationException("Lesson count must be positive");
        }
        
        // Validate groups if provided
        if (request.groups() != null && !request.groups().isEmpty()) {
            for (GroupLessonDetail group : request.groups()) {
                if (group.groupId() == null) {
                    throw new ValidationException("Group ID is required");
                }
                if (group.teacherId() == null) {
                    throw new ValidationException("Group teacher must be specified");
                }
                if (group.subjectId() == null) {
                    throw new ValidationException("Group subject must be specified");
                }
            }
        }
    }
}
```

---

## 🧪 Testing

### Unit Tests
```java
@Test
void createLessonWithMultipleClasses() {
    LessonRequest request = new LessonRequest(
        List.of(1, 2, 3),  // Multiple classes
        10,
        List.of(1, 2),
        15,
        2,
        DayOfWeek.MONDAY,
        3,
        LessonFrequency.WEEKLY,
        1,
        null
    );
    
    LessonResponse response = lessonService.create(principal, request);
    
    assertNotNull(response.id());
    assertEquals(List.of(1, 2, 3).size(), response.classes().size());
    assertNull(response.groupDetails());  // No groups
}

@Test
void createLessonWithGroupAssignments() {
    List<GroupLessonDetail> groups = List.of(
        new GroupLessonDetail(101, 11, 16, List.of(3)),
        new GroupLessonDetail(102, 12, 17, List.of(4))
    );
    
    LessonRequest request = new LessonRequest(
        List.of(1),
        10,
        List.of(1, 2),
        15,
        2,
        DayOfWeek.MONDAY,
        3,
        LessonFrequency.WEEKLY,
        1,
        groups
    );
    
    LessonResponse response = lessonService.create(principal, request);
    
    assertNotNull(response.id());
    assertEquals(2, response.groupDetails().size());
    assertEquals(11, response.groupDetails().get(0).teacher().id());
}
```

### Integration Tests
```java
@Test
@Transactional
void testLessonCRUDWithGroups() {
    // Create
    LessonRequest create = new LessonRequest(...);
    LessonResponse created = lessonService.create(principal, create);
    assertNotNull(created.id());
    
    // Read
    LessonResponse retrieved = lessonService.getById(created.id());
    assertEquals(created.id(), retrieved.id());
    
    // Update
    LessonUpdateRequest update = new LessonUpdateRequest(...);
    LessonResponse updated = lessonService.update(principal, created.id(), update);
    assertNotNull(updated.id());
    
    // Delete
    lessonService.delete(principal.orgId(), created.id());
    assertThrows(NotFoundException.class, 
        () -> lessonService.getById(created.id()));
}
```

---

## 📋 Checklist

- [ ] Database schema updated
- [ ] Entities created/updated
- [ ] Repositories created
- [ ] Service layer implemented
- [ ] Controller endpoints updated
- [ ] Validation added
- [ ] Response converter updated
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Performance tested
- [ ] Security audit passed

---

## 🔄 Backward Compatibility

### If supporting old API format:

```java
// Accept both old (single) and new (array) format
public record LessonRequest(
    @JsonAlias({"classId", "classIds"})
    List<Integer> classId,  // Always array internally
    // ...
) {}

// In deserializer:
private LessonRequest deserialize(JsonNode node) {
    List<Integer> classIds;
    
    if (node.has("classId")) {
        if (node.get("classId").isArray()) {
            classIds = // parse array
        } else {
            classIds = List.of(node.get("classId").asInt());  // Convert single to array
        }
    }
    
    return new LessonRequest(classIds, ...);
}
```

---

## 📈 Migration Path

### Phase 1: Dual Support (if needed)
- Backend accepts both old and new formats
- Old code continues working
- New code uses new format

### Phase 2: Deprecation
- Old format still works but logged
- Documentation encourages new format
- Timeline for removal announced

### Phase 3: Removal
- Old format no longer accepted
- All code updated
- Documentation updated

---

## 🔗 References

### Frontend
- `GROUP_LESSON_INTEGRATION.md` - Frontend implementation details
- `GROUP_LESSON_UI_GUIDE.md` - UI specifications

### Database
- `lesson` table: Main lesson entity
- `lesson_class` table: Lesson-class relationships
- `lesson_group_detail` table: Group-specific assignments
- `lesson_group_detail_room` table: Group-specific rooms

### API
- `POST /api/lessons/v1` - Create lesson
- `PUT /api/lessons/v1` - Update lesson
- `GET /api/lessons/v1` - Get paginated
- `GET /api/lessons/v1/all` - Get all
- `DELETE /api/lessons/v1/{id}` - Delete

---

## ❓ FAQ

**Q: Do I need to update the database immediately?**
A: If supporting multiple classes per lesson (new feature), yes. If only supporting groups in existing single-class structure, may need minimal changes.

**Q: Is this a breaking change?**
A: Yes, classId changed from number to array. Old code needs migration.

**Q: Can groups be null?**
A: Yes, groups field is optional. If not provided, API behaves like before.

**Q: What about existing lessons?**
A: Existing lessons with single classId need migration to array format: `5` → `[5]`

**Q: Should I use optimistic locking?**
A: Yes, if already implemented. Add version field to prevent concurrent updates.

---

**Last Updated**: January 24, 2026  
**Status**: Ready for Implementation  
**Next**: Coordinate with Frontend team for synchronized deployment
