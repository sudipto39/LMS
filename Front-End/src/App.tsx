import { useState, useEffect, useCallback } from 'react';
import type { Role, Page } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar, Toast } from './components/ui';
import { Landing } from './screens/Landing';
import { Login } from './screens/Login';
import { Signup } from './screens/Signup';
import {
  StudentDashboard, StudentProjects, CreateProject, StudentProjectDetail,
  StudentSubmissions, StudentMessages, ProfessorDashboard, ProfessorProjectDetail,
  ProfessorReviews, ProfessorGrades, ProfessorMessages, AdminDashboard, AdminUsers,
  AdminBatches, AdminGiteaSettings, AdminAuditLogs, ActivityPage,
  SettingsPage, ProfilePage
} from './screens/Dashboards';
import { ChevronLeft } from './components/Icons';
import { preventClickjacking, startSessionTimeout, clearSessionTimeout, secureStorage } from './utils/security';

const roleNames: Record<Role, string> = {
  student: 'Rahul Sharma',
  professor: 'Dr. Anita Desai',
  admin: 'Admin User',
};

const defaultPages: Record<Role, Page> = {
  student: 'student-dashboard',
  professor: 'professor-dashboard',
  admin: 'admin-dashboard',
};

// Define parent pages for back navigation
const parentPages: Partial<Record<Page, Page>> = {
  'login': 'landing',
  'signup': 'login',
  'student-projects': 'student-dashboard',
  'student-create-project': 'student-projects',
  'student-project-detail': 'student-projects',
  'student-submissions': 'student-dashboard',
  'student-messages': 'student-dashboard',
  'student-profile': 'student-dashboard',
  'professor-projects': 'professor-dashboard',
  'professor-project-detail': 'professor-dashboard',
  'professor-reviews': 'professor-dashboard',
  'professor-grades': 'professor-dashboard',
  'professor-messages': 'professor-dashboard',
  'professor-profile': 'professor-dashboard',
  'admin-users': 'admin-dashboard',
  'admin-batches': 'admin-dashboard',
  'admin-gitea-settings': 'admin-dashboard',
  'admin-audit-logs': 'admin-dashboard',
  'admin-profile': 'admin-dashboard',
  'activity': 'student-dashboard', // will be overridden by role
  'settings': 'student-dashboard', // will be overridden by role
};

// Pages that are "root" dashboards (no back button needed)
const rootPages: Page[] = ['landing', 'login', 'signup', 'student-dashboard', 'professor-dashboard', 'admin-dashboard'];

// Page titles for breadcrumb
const pageTitles: Partial<Record<Page, string>> = {
  'student-dashboard': 'Dashboard',
  'student-projects': 'My Projects',
  'student-create-project': 'Create Project',
  'student-project-detail': 'Project Detail',
  'student-submissions': 'Submissions',
  'student-messages': 'Messages',
  'student-profile': 'Profile',
  'professor-dashboard': 'Dashboard',
  'professor-projects': 'Projects',
  'professor-project-detail': 'Project Detail',
  'professor-reviews': 'Reviews',
  'professor-grades': 'Grades',
  'professor-messages': 'Messages',
  'professor-profile': 'Profile',
  'admin-dashboard': 'Dashboard',
  'admin-users': 'Users',
  'admin-batches': 'Batches',
  'admin-gitea-settings': 'Gitea Settings',
  'admin-audit-logs': 'Audit Logs',
  'admin-profile': 'Profile',
  'activity': 'Activity',
  'settings': 'Settings',
};

export function App() {
  const [page, setPage] = useState<Page>('landing');
  const [history, setHistory] = useState<Page[]>(['landing']);
  const [role, setRole] = useState<Role>('student');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('giteaforge-dark') === 'true';
    }
    return false;
  });

  // Anti-clickjacking protection on mount
  useEffect(() => {
    try { preventClickjacking(); } catch { /* handled */ }
  }, []);

  // Apply dark class to <html> element
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('giteaforge-dark', String(darkMode));
  }, [darkMode]);

  // Session timeout management — auto-logout after 30 min inactivity
  useEffect(() => {
    const isLoggedIn = !['landing', 'login', 'signup'].includes(page);
    if (isLoggedIn) {
      const handleActivity = () => {
        setSessionWarning(false);
        startSessionTimeout(
          30 * 60 * 1000, // 30 minutes
          () => {
            // Session expired — force logout
            secureStorage.clear();
            localStorage.removeItem('giteaforge_token');
            localStorage.removeItem('giteaforge_refresh_token');
            setPage('login');
            setHistory(['login']);
          },
          5 * 60 * 1000, // Show warning 5 min before
          () => setSessionWarning(true),
        );
      };

      handleActivity(); // Start on mount

      // Reset timer on user activity
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));

      return () => {
        events.forEach(e => window.removeEventListener(e, handleActivity));
        clearSessionTimeout();
      };
    }
  }, [page]);

  // Navigate to a page (push to history)
  const navigateTo = useCallback((newPage: Page) => {
    setHistory(prev => [...prev, newPage]);
    setPage(newPage);
  }, []);

  // Go back to previous page
  const goBack = useCallback(() => {
    setHistory(prev => {
      if (prev.length <= 1) return prev;
      const newHistory = prev.slice(0, -1);
      setPage(newHistory[newHistory.length - 1]);
      return newHistory;
    });
  }, []);

  // Get the parent page considering current role
  const getParentPage = useCallback((currentPage: Page): Page | null => {
    if (rootPages.includes(currentPage)) return null;
    
    // For shared pages like 'activity' and 'settings', use role-specific dashboard
    if (currentPage === 'activity' || currentPage === 'settings') {
      return defaultPages[role];
    }
    
    return parentPages[currentPage] || null;
  }, [role]);

  // Check if we can go back
  const canGoBack = history.length > 1 && !rootPages.includes(page);

  // Build breadcrumb
  const getBreadcrumbs = useCallback((): { label: string; page: Page | null }[] => {
    const crumbs: { label: string; page: Page | null }[] = [];
    let current: Page | null = page;
    
    while (current) {
      crumbs.unshift({
        label: pageTitles[current] || current,
        page: current === page ? null : current,
      });
      current = getParentPage(current);
    }
    
    return crumbs;
  }, [page, getParentPage]);

  const handleLogin = (r: Role) => {
    setRole(r);
    const dashPage = defaultPages[r];
    setHistory([dashPage]);
    setPage(dashPage);
  };

  const handleLogout = () => {
    setPage('landing');
    setHistory(['landing']);
    setSidebarOpen(false);
  };

  // Landing and Login/Signup are full-page (no sidebar/topbar)
  if (page === 'landing') {
    return <Landing onNavigate={navigateTo} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  if (page === 'login') {
    return <Login onLogin={handleLogin} onNavigate={navigateTo} goBack={goBack} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  if (page === 'signup') {
    return <Signup onNavigate={navigateTo} goBack={goBack} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  // Render the appropriate screen content
  const renderContent = () => {
    switch (page) {
      case 'student-dashboard':
        return <StudentDashboard onNavigate={navigateTo} />;
      case 'student-projects':
        return <StudentProjects onNavigate={navigateTo} />;
      case 'student-create-project':
        return <CreateProject onNavigate={navigateTo} />;
      case 'student-project-detail':
        return <StudentProjectDetail onNavigate={navigateTo} />;
      case 'student-submissions':
        return <StudentSubmissions onNavigate={navigateTo} />;
      case 'student-messages':
        return <StudentMessages />;
      case 'student-profile':
        return <ProfilePage />;
      case 'professor-dashboard':
        return <ProfessorDashboard onNavigate={navigateTo} />;
      case 'professor-projects':
        return <ProfessorDashboard onNavigate={navigateTo} />;
      case 'professor-project-detail':
        return <ProfessorProjectDetail onNavigate={navigateTo} />;
      case 'professor-reviews':
        return <ProfessorReviews onNavigate={navigateTo} />;
      case 'professor-grades':
        return <ProfessorGrades onNavigate={navigateTo} />;
      case 'professor-messages':
        return <ProfessorMessages />;
      case 'professor-profile':
        return <ProfilePage />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={navigateTo} />;
      case 'admin-users':
        return <AdminUsers />;
      case 'admin-batches':
        return <AdminBatches />;
      case 'admin-gitea-settings':
        return <AdminGiteaSettings />;
      case 'admin-audit-logs':
        return <AdminAuditLogs />;
      case 'admin-profile':
        return <ProfilePage />;
      case 'activity':
        return <ActivityPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <StudentDashboard onNavigate={navigateTo} />;
    }
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-[#0d1117]">
      <Sidebar
        role={role}
        currentPage={page}
        onNavigate={navigateTo}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          userName={roleNames[role]}
          userRole={role}
          onLogout={handleLogout}
          onProfileClick={() => {
            // Navigate to role-specific profile page
            const profilePage: Page = role === 'student' ? 'student-profile' 
              : role === 'professor' ? 'professor-profile' 
              : 'admin-profile';
            navigateTo(profilePage);
          }}
        />
        {/* Breadcrumb + Back Button Bar */}
        {(canGoBack || breadcrumbs.length > 1) && (
          <div className="flex items-center gap-2 px-4 lg:px-6 py-2 border-b border-neutral-100 dark:border-[#21262d] bg-white dark:bg-[#161b22]">
            {canGoBack && (
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition mr-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            )}
            {canGoBack && breadcrumbs.length > 1 && (
              <span className="text-neutral-300 dark:text-[#30363d]">|</span>
            )}
            <nav className="flex items-center gap-1 text-sm overflow-x-auto">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1 whitespace-nowrap">
                  {i > 0 && <span className="text-neutral-300 dark:text-[#484f58]">/</span>}
                  {crumb.page ? (
                    <button
                      onClick={() => navigateTo(crumb.page!)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-neutral-600 dark:text-[#8b949e] font-medium">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>
        )}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 xl:p-10">
          <div className="w-full max-w-[1800px] mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Session timeout warning */}
      {sessionWarning && (
        <Toast
          message="Your session will expire in 5 minutes due to inactivity. Move your mouse or press a key to stay logged in."
          type="info"
          onClose={() => setSessionWarning(false)}
        />
      )}
    </div>
  );
}
