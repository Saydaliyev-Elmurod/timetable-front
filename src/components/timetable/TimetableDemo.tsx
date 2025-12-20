import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AdvancedTimetableGrid } from './AdvancedTimetableGrid';
import { LessonRequirementsForm } from './LessonRequirementsForm';
import { ScheduledLessonDto, LessonRequest } from '@/types/advancedTimetable';

// Mock Data for demonstration
const INITIAL_SCHEDULE: ScheduledLessonDto[] = [
    // 1. Standard Weekly Lesson (Math, Mon 9:00)
    {
        id: '1',
        subjectName: 'Mathematics',
        teacherName: 'Mr. Smith',
        groupNames: '10A',
        roomName: '101',
        dayIndex: 0, // Mon
        hourIndex: 1, // 9:00 (1st slot)
        period: 1,
        weekIndex: null // Weekly
    },

    // 2. Bi-Weekly Split (Physics Lab)
    // Week A: Physics (Lab 1) - 2 hours
    {
        id: '2a',
        subjectName: 'Physics (Lab)',
        teacherName: 'Dr. Brown',
        groupNames: '10A',
        roomName: 'Lab 1',
        dayIndex: 1, // Tue
        hourIndex: 1, // 9:00
        period: 2, // Double period
        weekIndex: 0 // Week A only
    },
    // Week B: Biology (Lab 2) - 2 hours (Sharing same slot!)
    {
        id: '2b',
        subjectName: 'Biology (Lab)',
        teacherName: 'Ms. Green',
        groupNames: '10A',
        roomName: 'Lab 2',
        dayIndex: 1, // Tue
        hourIndex: 1, // 9:00
        period: 2, // Double period
        weekIndex: 1 // Week B only
    },

    // 3. Multi-period Lesson (Art, Fri)
    {
        id: '3',
        subjectName: 'Art & Design',
        teacherName: 'Ms. Jones',
        groupNames: '10A',
        roomName: 'Art Studio',
        dayIndex: 4, // Fri
        hourIndex: 4, // 12:00
        period: 3, // Triple period
        weekIndex: null
    },

    // 4. Single Slot Mix
    // Wed Slot 3: History (Week A)
    {
        id: '4a',
        subjectName: 'History',
        teacherName: 'Mr. White',
        groupNames: '10A',
        roomName: '102',
        dayIndex: 2, // Wed
        hourIndex: 3,
        period: 1,
        weekIndex: 0
    },
    // Wed Slot 3: Geography (Week B)
    {
        id: '4b',
        subjectName: 'Geography',
        teacherName: 'Mrs. Black',
        groupNames: '10A',
        roomName: '103',
        dayIndex: 2, // Wed
        hourIndex: 3,
        period: 1,
        weekIndex: 1
    }
];

export const TimetableDemo: React.FC = () => {
    const [schedule, setSchedule] = useState<ScheduledLessonDto[]>(INITIAL_SCHEDULE);

    const handleLessonMove = (lessonId: string, newDay: number, newHour: number) => {
        setSchedule(prev => prev.map(lesson => {
            if (lesson.id === lessonId) {
                return {
                    ...lesson,
                    dayIndex: newDay,
                    hourIndex: newHour
                };
            }
            return lesson;
        }));
    };

    const handleRequirementSubmit = (req: LessonRequest) => {
        // Logic to convert requirement to lesson cards (simplified for demo)
        console.log("New Requirement:", req);
        alert(`Received request for ${req.subject} (${req.totalWeeklyHours} hrs). In a real app, this would send to backend to generate/optimize.`);
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="min-h-screen bg-gray-100 p-8 font-sans">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">IntelliSchedule Advanced View</h1>
                    <p className="text-slate-500">Demonstrating Bi-Weekly (A/B) Support & Multi-Period Drag-and-Drop</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Left Panel: Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        <LessonRequirementsForm onSubmit={handleRequirementSubmit} />

                        <div className="bg-white p-4 rounded-lg shadow text-sm space-y-2">
                            <h3 className="font-bold text-gray-700">Legend</h3>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-indigo-200"></div>
                                <span>Week A (Top-Left)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-orange-200"></div>
                                <span>Week B (Bottom-Right)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-gray-200 border border-gray-300"></div>
                                <span>Weekly (Full)</span>
                            </div>
                            <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                                <p>Try dragging the "Physics" or "History" blocks. Notice how they interact with valid/invalid slots based on A/B compatibility.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: The Grid */}
                    <div className="lg:col-span-3 h-[800px]">
                        <AdvancedTimetableGrid
                            schedule={schedule}
                            onLessonMove={handleLessonMove}
                        />
                    </div>

                </div>
            </div>
        </DndProvider>
    );
};
