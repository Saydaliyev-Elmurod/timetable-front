import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SubjectService } from '@/lib/subjects';
import { TeacherService } from '@/lib/teachers';
import { ClassService } from '@/lib/classes';
import { RoomService } from '@/lib/rooms';
import { logger } from '../../lib/logger';

export interface AddLessonData {
  teachers: any[];
  subjects: any[];
  classes: any[];
  rooms: any[];
  isLoading: boolean;
}

export function useAddLessonData(open: boolean): AddLessonData {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [teachersData, subjectsData, classesData, roomsData] = await Promise.all([
          TeacherService.getAll().catch((e) => {
            logger.error('Failed to fetch modal teachers:', e);
            return [];
          }),
          SubjectService.getAll().catch((e) => {
            logger.error('Failed to fetch modal subjects:', e);
            return [];
          }),
          ClassService.getAll().catch((e) => {
            logger.error('Failed to fetch modal classes:', e);
            return [];
          }),
          RoomService.getAll().catch((e) => {
            logger.error('Failed to fetch modal rooms:', e);
            return [];
          }),
        ]);

        if (cancelled) return;

        setTeachers(teachersData || []);
        setSubjects(subjectsData || []);
        setClasses(classesData || []);
        setRooms(roomsData || []);
      } catch (error) {
        logger.error('Failed to fetch data:', error);
        toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [open]);

  return { teachers, subjects, classes, rooms, isLoading };
}
