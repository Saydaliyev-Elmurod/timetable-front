import { useTranslation } from '@/i18n/index';

// ... (other imports)

export default function LessonsPage() {
  const { t } = useTranslation();
  const [lessons, setLessons] = useState<InternalLesson[]>([]);
  // ... (rest of the state declarations)

  // Fetch lessons from API
  const fetchLessons = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await LessonService.getAll();
      // Convert API format to internal format
      const converted = data.map((lesson: LessonResponse) => ({
        id: lesson.id,
        subject: lesson.subject?.name || t('lessons.unknown_subject'),
        teacher: lesson.teacher?.fullName || t('lessons.unknown_teacher'),
        class: lesson.class?.shortName || lesson.class?.name || t('lessons.unknown_class'),
        day: lesson.dayOfWeek,
        startTime: `${lesson.hour}:00`,
        endTime: `${lesson.hour + 1}:00`,
        period: lesson.period,
        frequency: `${lesson.lessonCount}x`,
        room: lesson.rooms?.map(r => r.name).join(', ') || t('lessons.no_room'),
        duration: '45 min'
      }));
      setLessons(converted);
      setTotalElements(data.length);
      setTotalPages(1);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast.error(t('lessons.failed_to_load_lessons'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // ... (useEffect and other functions)

  const handleDelete = async (id: number) => {
    try {
      await LessonService.delete(id);
      setLessons(lessons.filter((l) => l.id !== id));
      toast.success(t('lessons.lesson_deleted_successfully'));
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      toast.error(t('lessons.failed_to_delete_lesson'));
    }
  };

  const handleSubmit = async (lessonData: LessonSubmitData) => {
    try {
      // ... (logic for fetching data and creating lessonRequest)

      // Call the API - create or update
      if (editingLesson && editingLesson.id) {
        await LessonService.update(editingLesson.id, lessonRequest);
        toast.success(t('lessons.lesson_updated_successfully'));
      } else {
        await LessonService.create(lessonRequest);
        toast.success(t('lessons.lesson_created_successfully'));
      }

      // ... (logic for refreshing lessons)
    } catch (error) {
      console.error('Failed to save lesson:', error);
      if (editingLesson) {
        toast.error(t('lessons.failed_to_update_lesson'));
      } else {
        toast.error(t('lessons.failed_to_create_lesson'));
      }
    }
    
    setEditingLesson(null);
    setIsDialogOpen(false);
  };

  const renderLessonCard = (item: GroupedData, type: ViewType) => {
    const isExpanded = expandedCards.has(item.id);
    
    return (
      <Card key={item.id} className="mb-4">
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleCardExpansion(item.id)}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    {type === 'classes' && (
                      <>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {t('lessons.lessons_count').replace('{{count}}', String(item.totalLessons))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {t('lessons.total_periods').replace('{{count}}', String(item.totalPeriods))}
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          {t('lessons.teachers_count').replace('{{count}}', String(item.teachers))}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {t('lessons.subjects_count').replace('{{count}}', String(item.subjects))}
                        </span>
                      </>
                    )}
                    {type === 'teachers' && (
                      <>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {t('lessons.classes_count').replace('{{count}}', String(item.classes))}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {t('lessons.lessons_count').replace('{{count}}', String(item.totalLessons))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {t('lessons.total_periods').replace('{{count}}', String(item.totalPeriods))}
                        </span>
                      </>
                    )}
                      {type === 'subjects' && (
                      <>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          {t('lessons.teachers_count').replace('{{count}}', String(item.teachers))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {t('lessons.classes_count').replace('{{count}}', String(item.classes))}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {t('lessons.lessons_count').replace('{{count}}', String(item.totalLessons))}
                        </span>
                      </>
                    )}
                    {type === 'rooms' && (
                      <>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          {t('lessons.teachers_count', { count: item.teachers })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {t('lessons.classes_count', { count: item.classes })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {t('lessons.total_periods', { count: item.totalPeriods })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {type === 'classes' && (
                    <Button size="sm" onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleAdd(item.name);
                    }}>
                      <Plus className="h-4 w-4 mr-1" />
                      {t('lessons.add_lesson_for_class')}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {type === 'classes' && (
                      <>
                        <TableHead>{t('lessons.subject')}</TableHead>
                        <TableHead>{t('lessons.teacher')}</TableHead>
                        <TableHead>{t('lessons.frequency')}</TableHead>
                        <TableHead>{t('lessons.room')}</TableHead>
                        <TableHead>{t('lessons.duration')}</TableHead>
                        <TableHead className="text-right">{t('lessons.actions')}</TableHead>
                      </>
                    )}
                    {type === 'teachers' && (
                      <>
                        <TableHead>{t('lessons.class')}</TableHead>
                        <TableHead>{t('lessons.subject')}</TableHead>
                        <TableHead>{t('lessons.frequency')}</TableHead>
                        <TableHead>{t('lessons.room')}</TableHead>
                        <TableHead>{t('lessons.duration')}</TableHead>
                        <TableHead className="text-right">{t('lessons.actions')}</TableHead>
                      </>
                    )}
                    {type === 'subjects' && (
                      <>
                        <TableHead>{t('lessons.teacher')}</TableHead>
                        <TableHead>{t('lessons.class')}</TableHead>
                        <TableHead>{t('lessons.frequency')}</TableHead>
                        <TableHead>{t('lessons.room')}</TableHead>
                        <TableHead>{t('lessons.duration')}</TableHead>
                        <TableHead className="text-right">{t('lessons.actions')}</TableHead>
                      </>
                    )}
                    {type === 'rooms' && (
                      <>
                        <TableHead>{t('lessons.class')}</TableHead>
                        <TableHead>{t('lessons.subject')}</TableHead>
                        <TableHead>{t('lessons.teacher')}</TableHead>
                        <TableHead>{t('lessons.frequency')}</TableHead>
                        <TableHead>{t('lessons.duration')}</TableHead>
                        <TableHead className="text-right">{t('lessons.actions')}</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.lessons.map((lesson: InternalLesson) => (
                    <TableRow key={lesson.id}>
                      {/* ... (table cells with lesson data) */}
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(lesson)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(lesson.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    {t('lessons.export_csv')}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    {t('lessons.bulk_import')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2>{t('lessons.title')}</h2>
            <p className="text-muted-foreground">
              {t('lessons.description')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={toggleExpandAll}
              className="flex items-center gap-2"
            >
              {allExpanded ? (
                <>
                  <Minimize className="h-4 w-4" />
                  {t('lessons.collapse_all')}
                </>
              ) : (
                <>
                  <Expand className="h-4 w-4" />
                  {t('lessons.expand_all')}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('lessons.classes')}
            </TabsTrigger>
            <TabsTrigger value="teachers" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              {t('lessons.teachers')}
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t('lessons.subjects')}
            </TabsTrigger>
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t('lessons.rooms')}
            </TabsTrigger>
          </TabsList>

          {/* ... (TabsContent) */}
        </Tabs>

        {/* Global Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {t('lessons.export_csv')}
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              {t('lessons.bulk_import')}
            </Button>
          </div>
          <Button onClick={() => handleAdd()}>
            <Plus className="mr-2 h-4 w-4" />
            {t('lessons.add_lesson')}
          </Button>
        </div>
      </div>

      {/* ... (Tips & Tricks Sidebar) */}
    </div>
  );
}