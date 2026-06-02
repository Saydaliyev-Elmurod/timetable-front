import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from '@/i18n/index';
import { organizationApi } from '@/api/organizationApi';
import { setLanguage, type AppLanguage } from '@/lib/lang';
import { BrandMark } from './brand/Brand';
import { NavRailIcon, type NavIconName } from './nav/NavRailIcon';
import {
  LogOut,
  User as UserIcon,
  Languages,
  Check,
  Loader2,
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

  // B variant — har bo'limga moslashtirilgan ikon (NavRailIcon nomi).
  const organizationItems: { id: string; label: string; icon: NavIconName }[] = [
    { id: 'organization', label: t('dashboard.organization'), icon: 'maktab' },
  ];

  const navigationItems: { id: string; label: string; icon: NavIconName }[] = [
    { id: 'classes', label: t('dashboard.classes'), icon: 'sinflar' },
    { id: 'teachers', label: t('dashboard.teachers'), icon: 'oqituvchilar' },
    { id: 'subjects', label: t('dashboard.subjects'), icon: 'fanlar' },
    { id: 'rooms', label: t('dashboard.rooms'), icon: 'xonalar' },
    { id: 'lessons', label: t('dashboard.lessons'), icon: 'darslar' },
    { id: 'timetables', label: t('dashboard.timetables'), icon: 'jadvallari' },
  ];

  // Rail pastidagi avatar uchun bosh harflar (maks. 2 ta).
  const initials = (user?.name || user?.email || 'U')
    .split(/\s+/)
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Bitta nav element — ikon + ostidagi qisqa label, faol holatda indigo accent.
  const renderNavItem = (item: { id: string; label: string; icon: NavIconName }) => {
    const isActive = currentPage === item.id;
    return (
      <button
        key={item.id}
        onClick={() => setCurrentPage(item.id)}
        title={item.label}
        className={`flex flex-col items-center gap-1 rounded-[10px] px-1 py-[9px] transition-colors ${
          isActive
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <NavRailIcon name={item.icon} size={20} stroke={isActive ? 2 : 1.75} />
        <span
          className={`max-w-[60px] truncate text-center text-[10.5px] leading-tight ${
            isActive ? 'font-bold' : 'font-medium'
          }`}
        >
          {item.label}
        </span>
      </button>
    );
  };

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
      {/* Sidebar — B variant: kompakt ikon-rail (76px), har doim ko'rinadi */}
      <aside className="w-[76px] shrink-0 bg-white border-r border-slate-200 flex flex-col items-center py-3.5">
        {/* Brand glyph */}
        <BrandMark size={36} className="mb-[18px]" />

        {/* Navigation — Maktab guruhi, nozik chiziq, keyin Boshqaruv guruhi */}
        <nav className="flex flex-col gap-0.5 w-full flex-1 overflow-y-auto px-2">
          {organizationItems.map(renderNavItem)}
          <div className="h-px bg-slate-200 mx-2 my-1.5" />
          {navigationItems.map(renderNavItem)}
        </nav>

        {/* Foydalanuvchi avatari → profil */}
        <button
          onClick={() => setCurrentPage('profile')}
          title={user?.name || user?.email || ''}
          className="mt-2.5 h-[34px] w-[34px] rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white grid place-items-center text-xs font-extrabold"
        >
          {initials}
        </button>
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