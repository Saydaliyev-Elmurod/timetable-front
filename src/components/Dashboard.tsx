import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from '@/i18n/index';
import { organizationApi } from '@/api/organizationApi';
import { setLanguage, type AppLanguage } from '@/lib/lang';
import { BrandLogo } from './brand/Brand';
import {
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  FileText,
  CalendarDays,
  LogOut,
  User as UserIcon,
  Languages,
  Check,
  Building2,
  DoorOpen,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { User } from '@/types/common';
import { GenerationProvider } from '@/context/GenerationNotifier';

// Lazy-loaded pages — each becomes its own chunk
const OrganizationPage = lazy(() => import('./pages/OrganizationPage'));
const ClassesPage = lazy(() => import('./pages/ClassesPage'));
const ClassSetupPage = lazy(() => import('./pages/ClassSetupPage'));
const DocsClassesPage = lazy(() => import('./pages/DocsClassesPage'));
const TeachersPage = lazy(() => import('./pages/TeachersPage'));
const SubjectsPage = lazy(() => import('./pages/SubjectsPage'));
const RoomsPage = lazy(() => import('./pages/RoomsPage'));
const LessonsPage = lazy(() => import('./pages/LessonsPage'));
const TimetablesPage = lazy(() => import('./pages/TimetablesPage'));
const TimetableViewPage = lazy(() => import('./pages/TimetableViewPage'));
const TimetableViewPageWithAPI = lazy(() => import('./pages/TimetableViewPageWithAPI'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  );
}

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const { t, locale, setLocale } = useTranslation();
  const [currentPage, setCurrentPage] = useState('organization');
  // Chap nav sidebar yopiq/ochiq holati.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'uz', name: 'O\'zbek', flag: '🇺🇿' }
  ];

  // On login, adopt the language saved on the company (DB source of truth).
  useEffect(() => {
    organizationApi.get()
      .then((c) => {
        if (c?.lang) {
          setLanguage(c.lang);
          setLocale(c.lang);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch language: update UI immediately and persist to the company in DB.
  const handleSelectLanguage = (code: AppLanguage) => {
    setLanguage(code); // write localStorage first so the request below sends the new Accept-Language
    setLocale(code);
    organizationApi.updateLang(code);
  };

  const organizationItems = [
    { id: 'organization', label: t('dashboard.organization'), icon: Building2 },
  ];

  const navigationItems = [
    { id: 'classes', label: t('dashboard.classes'), icon: BookOpen },
    { id: 'teachers', label: t('dashboard.teachers'), icon: Users },
    { id: 'subjects', label: t('dashboard.subjects'), icon: GraduationCap },
    { id: 'rooms', label: t('dashboard.rooms'), icon: DoorOpen },
    { id: 'lessons', label: t('dashboard.lessons'), icon: Calendar },
    { id: 'timetables', label: t('dashboard.timetables'), icon: CalendarDays },
  ];

  const renderPage = React.useMemo(() => {
    switch (currentPage) {
      case 'organization':
        return <OrganizationPage />;
      case 'classes':
        return <ClassesPage />;
      case 'class-setup':
        return <ClassSetupPage onNavigate={setCurrentPage} />;
      case 'docs-classes':
        return <DocsClassesPage onNavigate={setCurrentPage} />;
      case 'teachers':
        return <TeachersPage />;
      case 'subjects':
        return <SubjectsPage />;
      case 'rooms':
        return <RoomsPage />;
      case 'lessons':
        return <LessonsPage />;
      case 'timetables':
        return <TimetablesPage onNavigate={setCurrentPage} />;
      case 'timetable-view':
        return <TimetableViewPage onNavigate={setCurrentPage} />;
      case 'profile':
        return <ProfilePage user={user} />;
      default:
        // Handle timetable-view-{id} routes - use API-powered component
        if (currentPage.startsWith('timetable-view-')) {
          const timetableId = currentPage.replace('timetable-view-', '');
          return <TimetableViewPageWithAPI timetableId={timetableId} onNavigate={setCurrentPage} />;
        }
        return <OrganizationPage />;
    }
  }, [currentPage, user]);

  return (
    <GenerationProvider onNavigate={setCurrentPage}>
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200`}>
        {/* Logo/Brand + collapse toggle */}
        <div className={`border-b border-sidebar-border flex items-center ${sidebarCollapsed ? 'justify-center p-4' : 'justify-between p-6'}`}>
          {!sidebarCollapsed && <BrandLogo size={28} />}
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            title={sidebarCollapsed ? 'Ochish' : 'Yopish'}
            className="p-1.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-3">
          {/* Organization Section */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <div className="px-3 py-2">
                <h3 className="text-xs uppercase tracking-wider text-sidebar-foreground/60 font-semibold">
                  {t('dashboard.organization')}
                </h3>
              </div>
            )}
            {organizationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    sidebarCollapsed ? 'justify-center' : ''
                  } ${
                    currentPage === item.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>

          <Separator className="bg-sidebar-border" />

          {/* Main Navigation Section */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <div className="px-3 py-2">
                <h3 className="text-xs uppercase tracking-wider text-sidebar-foreground/60 font-semibold">
                  {t('dashboard.management')}
                </h3>
              </div>
            )}
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    sidebarCollapsed ? 'justify-center' : ''
                  } ${
                    currentPage === item.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div>
            <h1 className="text-foreground">
              {navigationItems.find(item => item.id === currentPage)?.label ||
               organizationItems.find(item => item.id === currentPage)?.label ||
               (currentPage === 'profile' ? t('dashboard.profile') : '')}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Languages className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{t('dashboard.select_language')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code as AppLanguage)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                    {locale === lang.code && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback>
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user?.name || user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t('dashboard.my_account')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCurrentPage('profile')}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  {t('dashboard.profile')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('dashboard.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content — PageContainer (in each page) owns its padding/max-width */}
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<PageLoader />}>
            {renderPage}
          </Suspense>
        </main>
      </div>
    </div>
    </GenerationProvider>
  );
}