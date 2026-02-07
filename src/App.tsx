import { useState, useEffect } from 'react';
import type { Role, Page } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/ui';
import { Landing } from './screens/Landing';
import { Login } from './screens/Login';
import {
  StudentDashboard, StudentProjects, CreateProject, StudentProjectDetail,
  StudentSubmissions, ProfessorDashboard, ProfessorProjectDetail,
  ProfessorReviews, ProfessorGrades, AdminDashboard, AdminUsers,
  AdminBatches, AdminGiteaSettings, AdminAuditLogs, ActivityPage,
  SettingsPage, ProfilePage
} from './screens/Dashboards';

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

export function App() {
  const [page, setPage] = useState<Page>('landing');
  const [role, setRole] = useState<Role>('student');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('giteaforge-dark') === 'true';
    }
    return false;
  });

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

  const handleLogin = (r: Role) => {
    setRole(r);
    setPage(defaultPages[r]);
  };

  const handleLogout = () => {
    setPage('landing');
    setSidebarOpen(false);
  };

  // Landing and Login are full-page (no sidebar/topbar)
  if (page === 'landing') {
    return <Landing onNavigate={setPage} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  if (page === 'login') {
    return <Login onLogin={handleLogin} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  // Render the appropriate screen content
  const renderContent = () => {
    switch (page) {
      case 'student-dashboard':
        return <StudentDashboard onNavigate={setPage} />;
      case 'student-projects':
        return <StudentProjects onNavigate={setPage} />;
      case 'student-create-project':
        return <CreateProject onNavigate={setPage} />;
      case 'student-project-detail':
        return <StudentProjectDetail onNavigate={setPage} />;
      case 'student-submissions':
        return <StudentSubmissions onNavigate={setPage} />;
      case 'student-profile':
        return <ProfilePage />;
      case 'professor-dashboard':
        return <ProfessorDashboard onNavigate={setPage} />;
      case 'professor-projects':
        return <ProfessorDashboard onNavigate={setPage} />;
      case 'professor-project-detail':
        return <ProfessorProjectDetail onNavigate={setPage} />;
      case 'professor-reviews':
        return <ProfessorReviews onNavigate={setPage} />;
      case 'professor-grades':
        return <ProfessorGrades onNavigate={setPage} />;
      case 'professor-profile':
        return <ProfilePage />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={setPage} />;
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
        return <StudentDashboard onNavigate={setPage} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-[#0d1117]">
      <Sidebar
        role={role}
        currentPage={page}
        onNavigate={setPage}
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
        />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
