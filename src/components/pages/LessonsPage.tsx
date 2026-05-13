import React, { useState, useEffect } from 'react';
import EtLessonsPage, { initLessonsData } from './EtLessonsPage';
import { LessonService } from '@/lib/lessons';
import { toast } from 'sonner';

export default function LessonsPage() {
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const metadata = await LessonService.getAllWithMetadata();
        
        const classes = metadata.classes.map(c => c.name);
        
        const subjects = metadata.subjects.map(s => ({
          id: s.id.toString(),
          name: s.name,
          short: s.shortName || s.name,
          ck: '#EEF2FF,#4338CA,#4F46E5' // Default color
        }));
        
        const teachers = metadata.teachers.map(t => ({
          id: t.id.toString(),
          name: t.fullName,
          avatar: t.fullName.split(' ').map(n => n[0]).join('').substring(0, 2),
          tone: '#4F46E5', // Default color
          subs: t.subjects?.map(s => s.id.toString()) || [],
          cap: 20, // Default cap
          load: 0 // Will be computed by EtLessonsPage
        }));
        
        const rooms = metadata.rooms.map(r => ({
          id: r.id.toString(),
          no: r.name,
          type: r.type || 'std',
          label: r.name,
          fits: '*'
        }));
        
        const lessons = metadata.lessons.map(l => {
          let teacherVal: any = l.teacherId ? l.teacherId.toString() : '';
          
          if (l.groups && l.groups.length > 0) {
            teacherVal = {
              groups: l.groups.map(g => ({
                label: `Guruh ${g.groupId}`,
                tid: g.teacherId?.toString() || '',
                room: g.roomIds && g.roomIds.length > 0 ? g.roomIds[0].toString() : ''
              }))
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

        initLessonsData(classes, subjects, teachers, rooms, lessons);
        setDataLoaded(true);
      } catch (err) {
        console.error("Failed to load lessons data", err);
        toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
      }
    }
    loadData();
  }, []);

  const handleSave = async (rows: any[]) => {
    toast.success("Ma'lumotlar saqlandi (Demo)");
    console.log("Rows to save:", rows);
    // Real implementation would sync back to the LessonService.
  };

  if (!dataLoaded) return <div className="flex items-center justify-center h-full">Yuklanmoqda...</div>;

  return <EtLessonsPage onSave={handleSave} />;
}
