import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import EtLessonsPage, { initLessonsData } from './EtLessonsPage';
import { LessonService } from '@/lib/lessons';
import { ClassService } from '@/lib/classes';
import { SubjectService } from '@/lib/subjects';
import { TeacherService } from '@/lib/teachers';
import { RoomService } from '@/lib/rooms';
import { toast } from 'sonner';
import { LessonsWithMetadataResponse, LessonRequest, GroupLessonDetail } from '@/types/api';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';

const AddLessonModal = lazy(() => import('../AddLessonModal'));

export default function LessonsPage() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [metadata, setMetadata] = useState<LessonsWithMetadataResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Maps to help with ID conversion
  const maps = useMemo(() => {
    if (!metadata) return null;
    return {
      classByName: new Map(metadata.classes.map(c => [c.name, c])),
      subjectById: new Map(metadata.subjects.map(s => [s.id.toString(), s])),
      teacherById: new Map(metadata.teachers.map(t => [t.id.toString(), t])),
      roomById: new Map(metadata.rooms.map(r => [r.id.toString(), r])),
      classById: new Map(metadata.classes.map(c => [c.id, c]))
    };
  }, [metadata]);

  const [currentRows, setCurrentRows] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Debounced auto-save
  useEffect(() => {
    if (currentRows.length === 0) return;
    
    const timer = setTimeout(() => {
      handleSave(currentRows, true); // Silent save
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentRows]);

  const loadData = useCallback(async () => {
    try {
      const [lessonsData, classesData, subjectsData, teachersData, roomsData] = await Promise.all([
        LessonService.getPaginated(0, 1000).then(res => res.content).catch(e => {
          console.error('Failed to fetch lessons', e);
          return [];
        }),
        ClassService.getAll().catch(e => {
          console.error('Failed to fetch classes', e);
          return [];
        }),
        SubjectService.getAll().catch(e => {
          console.error('Failed to fetch subjects', e);
          return [];
        }),
        TeacherService.getAll().catch(e => {
          console.error('Failed to fetch teachers', e);
          return [];
        }),
        RoomService.getAll().catch(e => {
          console.error('Failed to fetch rooms', e);
          return [];
        })
      ]);

      setMetadata({
        lessons: lessonsData,
        classes: classesData,
        subjects: subjectsData,
        teachers: teachersData,
        rooms: roomsData
      });
      
      const classes = classesData.map(c => ({
        id: c.id,
        name: c.name,
        groups: c.groups || []
      }));
      
      const subjects = subjectsData.map(s => {
        const baseColor = s.color || '#4F46E5';
        return {
          id: s.id.toString(),
          name: s.name,
          short: s.shortName || s.name,
          ck: `${baseColor}10,${baseColor},${baseColor}`
        };
      });
      
      const teachers = teachersData.map(t => {
        const initials = t.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const hash = t.fullName.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        const hue = Math.abs(hash % 360);
        const tone = `hsl(${hue}, 65%, 45%)`;
        
        return {
          id: t.id.toString(),
          name: t.fullName,
          avatar: initials,
          tone: tone,
          subs: t.subjects?.map(s => s.id.toString()) || [],
          cap: 24,
          load: 0
        };
      });
      
      const rooms = roomsData.map(r => ({
        id: r.id.toString(),
        no: r.name,
        type: r.type?.toLowerCase() || 'std',
        label: r.name,
        fits: '*'
      }));
      
      const lessonsList = lessonsData.map(l => {
        let teacherVal: any = l.teacherId ? l.teacherId.toString() : '';
        
        if (l.groupDetails && l.groupDetails.length > 0) {
          teacherVal = {
            groups: l.groupDetails.map(g => {
              const classObj = classesData.find(c => c.id === l.classId);
              const groupObj = classObj?.groups?.find(gr => gr.id === g.groupId);
              return {
                label: groupObj?.name || `Guruh ${g.groupId}`,
                tid: g.teacherId?.toString() || '',
                room: g.roomIds && g.roomIds.length > 0 ? g.roomIds[0].toString() : ''
              };
            })
          };
        }

        return {
          id: 'L' + l.id,
          classes: [classesData.find(c => c.id === l.classId)?.name].filter(Boolean),
          subjectId: l.subjectId?.toString() || '',
          teacher: teacherVal,
          room: l.roomIds && l.roomIds.length > 0 ? l.roomIds[0].toString() : '',
          hours: l.lessonCount || 1,
          dur: l.period || 1
        };
      });

      // initLessonsData(classes, subjects, teachers, rooms, lessonsList); // Still call it for legacy reasons
      setDataLoaded(true);
      return { classes, subjects, teachers, rooms, lessonsList };
    } catch (err) {
      console.error("Failed to load lessons data", err);
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
      return null;
    }
  }, []);

  const dataProps = useMemo(() => {
    if (!metadata) return null;
    
    const classes = metadata.classes.map(c => ({
      id: c.id,
      name: c.name,
      groups: c.groups || []
    }));
    
    const subjects = metadata.subjects.map(s => {
      const baseColor = s.color || '#4F46E5';
      return {
        id: s.id.toString(),
        name: s.name,
        short: s.shortName || s.name,
        ck: `${baseColor}10,${baseColor},${baseColor}`
      };
    });
    
    const teachers = metadata.teachers.map(t => {
      const initials = t.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const hash = t.fullName.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
      const hue = Math.abs(hash % 360);
      const tone = `hsl(${hue}, 65%, 45%)`;
      return {
        id: t.id.toString(),
        name: t.fullName,
        avatar: initials,
        tone: tone,
        subs: t.subjects?.map(s => s.id.toString()) || [],
        cap: 24, load: 0
      };
    });
    
    const rooms = metadata.rooms.map(r => ({
      id: r.id.toString(),
      no: r.name,
      type: r.type?.toLowerCase() || 'std',
      label: r.name,
      fits: '*'
    }));
    
    const initialLessons = metadata.lessons.map(l => {
      let teacherVal: any = l.teacherId ? l.teacherId.toString() : '';
      if (l.groupDetails && l.groupDetails.length > 0) {
        teacherVal = {
          groups: l.groupDetails.map(g => {
            const classObj = metadata.classes.find(c => c.id === l.classId);
            const groupObj = classObj?.groups?.find(gr => gr.id === g.groupId);
            return {
              label: groupObj?.name || `Guruh ${g.groupId}`,
              tid: g.teacherId?.toString() || '',
              room: g.roomIds && g.roomIds.length > 0 ? g.roomIds[0].toString() : ''
            };
          })
        };
      }
      return {
        id: 'L' + l.id,
        classes: [metadata.classes.find(c => c.id === l.classId)?.name].filter(Boolean),
        subjectId: l.subjectId?.toString() || '',
        teacher: teacherVal,
        room: l.roomIds && l.roomIds.length > 0 ? l.roomIds[0].toString() : '',
        hours: l.lessonCount || 1,
        dur: l.period || 1
      };
    });

    return { classes, subjects, teachers, rooms, initialLessons };
  }, [metadata]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (rows: any[], silent = false) => {
    if (!maps || !metadata) return;

    try {
      if (!silent) setIsSaving(true);
      const requests: LessonRequest[] = [];

      for (const row of rows) {
        const classIds = row.classes
          .map((name: string) => maps.classByName.get(name)?.id)
          .filter(Boolean) as number[];

        if (classIds.length === 0) continue;

        const subjectId = parseInt(row.subjectId);
        if (isNaN(subjectId)) continue;

        let teacherId: number | null = null;
        let groupDetails: GroupLessonDetail[] | undefined = undefined;

        if (typeof row.teacher === 'string' && row.teacher) {
          teacherId = parseInt(row.teacher);
        } else if (row.teacher && row.teacher.groups) {
          const firstClassId = classIds[0];
          const classObj = maps.classById.get(firstClassId);
          
          groupDetails = row.teacher.groups.map((g: any) => {
            const groupObj = classObj?.groups?.find(gr => gr.name === g.label);
            if (!groupObj) return null;
            return {
              groupId: groupObj.id,
              teacherId: parseInt(g.tid) || 0,
              subjectId: subjectId,
              roomIds: g.room ? [parseInt(g.room)] : []
            };
          }).filter((g: any) => g !== null) as GroupLessonDetail[];
        }

        const roomIds = row.room ? [parseInt(row.room)] : [];

        requests.push({
          classId: classIds,
          teacherId: teacherId as any,
          roomIds: roomIds,
          subjectId: subjectId,
          lessonCount: row.hours || 1,
          period: row.dur || 1,
          groups: groupDetails
        });
      }

      await LessonService.bulkSave(requests);
      if (!silent) {
        toast.success("Darslar muvaffaqiyatli saqlandi");
        loadData();
      }
    } catch (err) {
      console.error("Failed to save lessons", err);
      if (!silent) toast.error("Saqlashda xatolik yuz berdi");
    } finally {
      if (!silent) setIsSaving(false);
    }
  };

  const handleModalSubmit = async (lessonData: any) => {
    try {
      setIsSaving(true);
      await LessonService.create(lessonRequestMapper(lessonData));
      toast.success("Dars muvaffaqiyatli qo'shildi");
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error("Failed to create lesson", error);
      toast.error("Dars qo'shishda xatolik");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to map Modal data to API Request
  const lessonRequestMapper = (data: any): LessonRequest => {
    return {
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      roomIds: data.roomIds,
      lessonCount: data.lessonCount,
      period: data.period,
      frequency: data.frequency,
      groups: data.groups
    };
  };

  if (!dataLoaded || !dataProps) return <div className="flex items-center justify-center h-full">Yuklanmoqda...</div>;

  return (
    <div className="flex flex-col h-full relative">
      {isSaving && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[200] bg-white px-4 py-2 rounded-full shadow-md border border-indigo-100 flex items-center gap-2 animate-pulse">
          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
          <span className="text-xs font-semibold text-indigo-700">Saqlanmoqda...</span>
        </div>
      )}
      
      <div className="absolute top-4 right-4 z-[100] flex gap-2">
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center gap-2"
        >
          <Plus size={18} />
          Modal orqali qo'shish
        </Button>
      </div>
      
      <EtLessonsPage 
        onSave={(rows) => handleSave(rows)}
        onRowsChange={(rows) => setCurrentRows(rows)}
        {...dataProps} 
      />

      {isModalOpen && (
        <Suspense fallback={null}>
          <AddLessonModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onSubmit={handleModalSubmit}
          />
        </Suspense>
      )}
    </div>
  );
}
