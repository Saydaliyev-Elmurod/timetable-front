// Mock API utilities to simulate backend responses
// This allows the UI to work without a real backend server

interface TimeSlot {
  dayOfWeek: string;
  lessons: number[];
}

// Simulate network delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory storage for mock data
let mockSubjects: any[] = [
  {
    id: 1,
    name: 'Mathematics',
    shortName: 'MATH',
    emoji: '🔢',
    color: '#3b82f6',
    weight: 9,
    availabilities: [
      { dayOfWeek: 'MONDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'TUESDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'WEDNESDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'THURSDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'FRIDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'SATURDAY', lessons: [] },
      { dayOfWeek: 'SUNDAY', lessons: [] },
    ],
  },
  {
    id: 2,
    name: 'English Literature',
    shortName: 'ENG',
    emoji: '📚',
    color: '#10b981',
    weight: 6,
    availabilities: [
      { dayOfWeek: 'MONDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'TUESDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'WEDNESDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'THURSDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'FRIDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'SATURDAY', lessons: [] },
      { dayOfWeek: 'SUNDAY', lessons: [] },
    ],
  },
  {
    id: 3,
    name: 'Science',
    shortName: 'SCI',
    emoji: '🔬',
    color: '#8b5cf6',
    weight: 7,
    availabilities: [
      { dayOfWeek: 'MONDAY', lessons: [1, 2, 3, 4, 5, 6] },
      { dayOfWeek: 'TUESDAY', lessons: [1, 2, 3, 4, 5, 6] },
      { dayOfWeek: 'WEDNESDAY', lessons: [1, 2, 3, 4, 5, 6] },
      { dayOfWeek: 'THURSDAY', lessons: [1, 2, 3, 4, 5, 6] },
      { dayOfWeek: 'FRIDAY', lessons: [1, 2, 3, 4, 5, 6] },
      { dayOfWeek: 'SATURDAY', lessons: [] },
      { dayOfWeek: 'SUNDAY', lessons: [] },
    ],
  },
];

let mockTeachers: any[] = [
  {
    id: 1,
    fullName: 'John Smith',
    shortName: 'J.Smith',
    subjects: [mockSubjects[0], mockSubjects[3] || mockSubjects[0]],
    availabilities: [
      { dayOfWeek: 'MONDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'TUESDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'WEDNESDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'THURSDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'FRIDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'SATURDAY', lessons: [] },
      { dayOfWeek: 'SUNDAY', lessons: [] },
    ],
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
  },
  {
    id: 2,
    fullName: 'Sarah Johnson',
    shortName: 'S.Johnson',
    subjects: [mockSubjects[1]],
    availabilities: [
      { dayOfWeek: 'MONDAY', lessons: [1, 2, 3, 4, 5, 6] },
      { dayOfWeek: 'TUESDAY', lessons: [1, 2, 3, 4, 5, 6] },
      { dayOfWeek: 'WEDNESDAY', lessons: [1, 2, 3, 4, 5, 6] },
      { dayOfWeek: 'THURSDAY', lessons: [1, 2, 3, 4, 5, 6] },
      { dayOfWeek: 'FRIDAY', lessons: [1, 2, 3, 4, 5] },
      { dayOfWeek: 'SATURDAY', lessons: [] },
      { dayOfWeek: 'SUNDAY', lessons: [] },
    ],
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
  },
];

let mockRooms: any[] = [
  {
    id: 1,
    name: '101-xona',
    shortName: 'R101',
    type: 'SHARED',
    allowedSubjectIds: [],
    availabilities: [
      { dayOfWeek: 'MONDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'TUESDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'WEDNESDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'THURSDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'FRIDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'SATURDAY', lessons: [] },
      { dayOfWeek: 'SUNDAY', lessons: [] },
    ],
  },
  {
    id: 2,
    name: 'Kompyuter xonasi 1',
    shortName: 'COMP1',
    type: 'SPECIAL',
    allowedSubjectIds: [1, 2],
    availabilities: [
      { dayOfWeek: 'MONDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'TUESDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'WEDNESDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'THURSDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'FRIDAY', lessons: [1, 2, 3, 4, 5, 6, 7] },
      { dayOfWeek: 'SATURDAY', lessons: [] },
      { dayOfWeek: 'SUNDAY', lessons: [] },
    ],
  },
];

let subjectIdCounter = 4;
let teacherIdCounter = 3;
let roomIdCounter = 3;

// Mock Subject API
export const mockSubjectApi = {
  getAll: async () => {
    await delay();
    return [...mockSubjects];
  },

  getPaginated: async (page: number, size: number) => {
    await delay();
    const start = page * size;
    const end = start + size;
    const content = mockSubjects.slice(start, end);
    return {
      content,
      totalElements: mockSubjects.length,
      totalPages: Math.ceil(mockSubjects.length / size),
      size,
      number: page,
    };
  },

  getById: async (id: number) => {
    await delay();
    const subject = mockSubjects.find(s => s.id === id);
    if (!subject) throw new Error('Subject not found');
    return { ...subject };
  },

  create: async (data: any) => {
    await delay();
    const newSubject = {
      id: subjectIdCounter++,
      ...data,
    };
    mockSubjects.push(newSubject);
  },

  update: async (id: number, data: any) => {
    await delay();
    const index = mockSubjects.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Subject not found');
    mockSubjects[index] = { ...mockSubjects[index], ...data, id };
  },

  delete: async (id: number) => {
    await delay();
    mockSubjects = mockSubjects.filter(s => s.id !== id);
  },
};

// Mock Teacher API
export const mockTeacherApi = {
  getAll: async () => {
    await delay();
    return [...mockTeachers];
  },

  getPaginated: async (page: number, size: number) => {
    await delay();
    const start = page * size;
    const end = start + size;
    const content = mockTeachers.slice(start, end);
    return {
      content,
      totalElements: mockTeachers.length,
      totalPages: Math.ceil(mockTeachers.length / size),
      size,
      number: page,
    };
  },

  getById: async (id: number) => {
    await delay();
    const teacher = mockTeachers.find(t => t.id === id);
    if (!teacher) throw new Error('Teacher not found');
    return { ...teacher };
  },

  create: async (data: any) => {
    await delay();
    const subjects = mockSubjects.filter(s => data.subjects.includes(s.id));
    const newTeacher = {
      id: teacherIdCounter++,
      fullName: data.fullName,
      shortName: data.shortName,
      subjects,
      availabilities: data.availabilities,
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };
    mockTeachers.push(newTeacher);
  },

  update: async (id: number, data: any) => {
    await delay();
    const index = mockTeachers.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Teacher not found');
    const subjects = mockSubjects.filter(s => data.subjects.includes(s.id));
    mockTeachers[index] = {
      ...mockTeachers[index],
      fullName: data.fullName,
      shortName: data.shortName,
      subjects,
      availabilities: data.availabilities,
      updatedDate: new Date().toISOString(),
    };
  },

  delete: async (id: number) => {
    await delay();
    mockTeachers = mockTeachers.filter(t => t.id !== id);
  },
};

// Mock Room API
export const mockRoomApi = {
  getAll: async () => {
    await delay();
    return [...mockRooms];
  },

  getPaginated: async (page: number, size: number) => {
    await delay();
    const start = page * size;
    const end = start + size;
    const content = mockRooms.slice(start, end);
    return {
      content,
      totalElements: mockRooms.length,
      totalPages: Math.ceil(mockRooms.length / size),
      size,
      number: page,
    };
  },

  getById: async (id: number) => {
    await delay();
    const room = mockRooms.find(r => r.id === id);
    if (!room) throw new Error('Room not found');
    return { ...room };
  },

  create: async (data: any) => {
    await delay();
    const newRoom = {
      id: roomIdCounter++,
      ...data,
    };
    mockRooms.push(newRoom);
  },

  update: async (id: number, data: any) => {
    await delay();
    const index = mockRooms.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Room not found');
    mockRooms[index] = { ...mockRooms[index], ...data, id };
  },

  delete: async (id: number) => {
    await delay();
    mockRooms = mockRooms.filter(r => r.id !== id);
  },
};

// Helper to wrap API calls with error handling
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  useMock: boolean = true
): Promise<T> {
  if (!useMock) {
    // Try real API first
    try {
      return await apiCall();
    } catch (error) {
      console.warn('Real API failed, using mock data:', error);
      throw error;
    }
  }
  return apiCall();
}
