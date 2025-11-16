import React, { useState } from 'react';
import {
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  FileText,
  CalendarDays,
  Settings,
  LogOut,
  User as UserIcon,
  Languages,
  Check,
  Building2,
  DoorOpen
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
import OrganizationPage from './pages/OrganizationPage';
import ClassesPage from './pages/ClassesPage';
import ClassSetupPage from './pages/ClassSetupPage';
import DocsClassesPage from './pages/DocsClassesPage';
import TeachersPage from './pages/TeachersPage';
import SubjectsPage from './pages/SubjectsPage';
import RoomsPage from './pages/RoomsPage';
import LessonsPage from './pages/LessonsPage';
import TemplatesPage from './pages/TemplatesPage';
import TimetablesPage from './pages/TimetablesPage';
import TimetableViewPage from './pages/TimetableViewPage';
import TimetableViewPageWithAPI from './pages/TimetableViewPageWithAPI';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import { User } from '@/types/common';

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
  language: string;
  onLanguageChange: (language: string) => void;
}

export default function Dashboard({ user, onLogout, language, onLanguageChange }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState('organization');

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'uz', name: 'O\'zbek', flag: '🇺🇿' }
  ];

  const organizationItems = [
    { id: 'organization', label: 'Organization', icon: Building2 },
  ];

  const navigationItems = [
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'teachers', label: 'Teachers', icon: Users },
    { id: 'subjects', label: 'Subjects', icon: GraduationCap },
    { id: 'rooms', label: 'Rooms', icon: DoorOpen },
    { id: 'lessons', label: 'Lessons', icon: Calendar },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'timetables', label: 'Timetables', icon: CalendarDays },
  ];

  const renderPage = React.useMemo(() => {
    switch (currentPage) {
      case 'organization':
        return <OrganizationPage />;
      case 'classes':
        return <ClassesPage onNavigate={setCurrentPage} />;
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
      case 'templates':
        return <TemplatesPage />;
      case 'timetables':
        return <TimetablesPage onNavigate={setCurrentPage} />;
      case 'timetable-view':
        return <TimetableViewPage onNavigate={setCurrentPage} />;
      case 'settings':
        return <SettingsPage />;
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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-sidebar-border">
          <h2 className="text-sidebar-foreground">School Timetable</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-3">
          {/* Organization Section */}
          <div className="space-y-1">
            <div className="px-3 py-2">
              <h3 className="text-xs uppercase tracking-wider text-sidebar-foreground/60 font-semibold">
                Organization
              </h3>
            </div>
            {organizationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <Separator className="bg-sidebar-border" />

          {/* Main Navigation Section */}
          <div className="space-y-1">
            <div className="px-3 py-2">
              <h3 className="text-xs uppercase tracking-wider text-sidebar-foreground/60 font-semibold">
                Management
              </h3>
            </div>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Settings at bottom */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={() => setCurrentPage('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              currentPage === 'settings'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div>
            <h1 className="text-foreground">
              {navigationItems.find(item => item.id === currentPage)?.label || 
               currentPage === 'settings' ? 'Settings' : 
               currentPage === 'profile' ? 'Profile' : ''}
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
                <DropdownMenuLabel>Select Language</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => onLanguageChange(lang.code)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                    {language === lang.code && (
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
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCurrentPage('profile')}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentPage('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {renderPage}
        </main>
      </div>
    </div>
  );
}