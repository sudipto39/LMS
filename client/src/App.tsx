// import { useState, useEffect, useCallback } from 'react';
// import type { Role, Page } from './types';
// import { Sidebar } from './components/Sidebar';
// import { Topbar, Toast } from './components/ui';
// import { Landing } from './screens/Landing';
// import { Login } from './screens/Login';
// import { Signup } from './screens/Signup';
// import {
//   StudentDashboard, StudentProjects, CreateProject, StudentProjectDetail,
//   StudentSubmissions, StudentMessages, SupervisorDashboard, SupervisorProjectDetail,
//   SupervisorReviews, SupervisorGrades, SupervisorMessages, AdminDashboard, AdminUsers,
//   AdminBatches, AdminGiteaSettings, AdminAuditLogs, ActivityPage,
//   SettingsPage, ProfilePage
// } from './screens/Dashboards';
// import { ChevronLeft } from './components/Icons';
// import { preventClickjacking, startSessionTimeout, clearSessionTimeout, secureStorage } from './utils/security';

// const roleNames: Record<Role, string> = {
//   student: 'Rahul Sharma',
//   supervisor: 'Dr. Anita Desai',
//   admin: 'Admin User',
// };

// const defaultPages: Record<Role, Page> = {
//   student: 'student-dashboard',
//   supervisor: 'supervisor-dashboard',
//   admin: 'admin-dashboard',
// };

// // Define parent pages for back navigation
// const parentPages: Partial<Record<Page, Page>> = {
//   'login': 'landing',
//   'signup': 'login',
//   'student-projects': 'student-dashboard',
//   'student-create-project': 'student-projects',
//   'student-project-detail': 'student-projects',
//   'student-submissions': 'student-dashboard',
//   'student-messages': 'student-dashboard',
//   'student-profile': 'student-dashboard',
//   'supervisor-project-detail': 'supervisor-dashboard',
//   'supervisor-projects': 'supervisor-dashboard',
//   'supervisor-reviews': 'supervisor-dashboard',
//   'supervisor-grades': 'supervisor-dashboard',
//   'supervisor-messages': 'supervisor-dashboard',
//   'supervisor-profile': 'supervisor-dashboard',
//   'admin-users': 'admin-dashboard',
//   'admin-batches': 'admin-dashboard',
//   'admin-gitea-settings': 'admin-dashboard',
//   'admin-audit-logs': 'admin-dashboard',
//   'admin-profile': 'admin-dashboard',
//   'activity': 'student-dashboard', // will be overridden by role
//   'settings': 'student-dashboard', // will be overridden by role
// };

// // Pages that are "root" dashboards (no back button needed)
// const rootPages: Page[] = ['landing', 'login', 'signup', 'student-dashboard', 'supervisor-dashboard', 'admin-dashboard'];

// // Page titles for breadcrumb
// const pageTitles: Partial<Record<Page, string>> = {
//   'student-dashboard': 'Dashboard',
//   'student-projects': 'My Projects',
//   'student-create-project': 'Create Project',
//   'student-project-detail': 'Project Detail',
//   'student-submissions': 'Submissions',
//   'student-messages': 'Messages',
//   'student-profile': 'Profile',
//   'supervisor-dashboard': 'Dashboard',
//   'supervisor-projects': 'Projects',
//   'supervisor-project-detail': 'Project Detail',
//   'supervisor-reviews': 'Reviews',
//   'supervisor-grades': 'Grades',
//   'supervisor-messages': 'Messages',
//   'supervisor-profile': 'Profile',
//   'admin-dashboard': 'Dashboard',
//   'admin-users': 'Users',
//   'admin-batches': 'Batches',
//   'admin-gitea-settings': 'Gitea Settings',
//   'admin-audit-logs': 'Audit Logs',
//   'admin-profile': 'Profile',
//   'activity': 'Activity',
//   'settings': 'Settings',
// };

// export function App() {
//   const [page, setPage] = useState<Page>('landing');
//   const [history, setHistory] = useState<Page[]>(['landing']);
//   const [role, setRole] = useState<Role>('student');
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [sessionWarning, setSessionWarning] = useState(false);
//   const [darkMode, setDarkMode] = useState(() => {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem('giteaforge-dark') === 'true';
//     }
//     return false;
//   });

//   // Anti-clickjacking protection on mount
//   useEffect(() => {
//     try { preventClickjacking(); } catch { /* handled */ }
//   }, []);

//   // Apply dark class to <html> element
//   useEffect(() => {
//     const html = document.documentElement;
//     if (darkMode) {
//       html.classList.add('dark');
//     } else {
//       html.classList.remove('dark');
//     }
//     localStorage.setItem('giteaforge-dark', String(darkMode));
//   }, [darkMode]);

//   // Session timeout management — auto-logout after 30 min inactivity
//   useEffect(() => {
//     const isLoggedIn = !['landing', 'login', 'signup'].includes(page);
//     if (isLoggedIn) {
//       const handleActivity = () => {
//         setSessionWarning(false);
//         startSessionTimeout(
//           30 * 60 * 1000, // 30 minutes
//           () => {
//             // Session expired — force logout
//             secureStorage.clear();
//             localStorage.removeItem('giteaforge_token');
//             localStorage.removeItem('giteaforge_refresh_token');
//             setPage('login');
//             setHistory(['login']);
//           },
//           5 * 60 * 1000, // Show warning 5 min before
//           () => setSessionWarning(true),
//         );
//       };

//       handleActivity(); // Start on mount

//       // Reset timer on user activity
//       const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
//       events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));

//       return () => {
//         events.forEach(e => window.removeEventListener(e, handleActivity));
//         clearSessionTimeout();
//       };
//     }
//   }, [page]);

//   // Navigate to a page (push to history)
//   const navigateTo = useCallback((newPage: Page) => {
//     setHistory(prev => [...prev, newPage]);
//     setPage(newPage);
//   }, []);

//   // Go back to previous page
//   const goBack = useCallback(() => {
//     setHistory(prev => {
//       if (prev.length <= 1) return prev;
//       const newHistory = prev.slice(0, -1);
//       setPage(newHistory[newHistory.length - 1]);
//       return newHistory;
//     });
//   }, []);

//   // Get the parent page considering current role
//   const getParentPage = useCallback((currentPage: Page): Page | null => {
//     if (rootPages.includes(currentPage)) return null;

//     // For shared pages like 'activity' and 'settings', use role-specific dashboard
//     if (currentPage === 'activity' || currentPage === 'settings') {
//       return defaultPages[role];
//     }

//     return parentPages[currentPage] || null;
//   }, [role]);

//   // Check if we can go back
//   const canGoBack = history.length > 1 && !rootPages.includes(page);

//   // Build breadcrumb
//   const getBreadcrumbs = useCallback((): { label: string; page: Page | null }[] => {
//     const crumbs: { label: string; page: Page | null }[] = [];
//     let current: Page | null = page;

//     while (current) {
//       crumbs.unshift({
//         label: pageTitles[current] || current,
//         page: current === page ? null : current,
//       });
//       current = getParentPage(current);
//     }

//     return crumbs;
//   }, [page, getParentPage]);

//   const handleLogin = (r: Role) => {
//     setRole(r);
//     const dashPage = defaultPages[r];
//     setHistory([dashPage]);
//     setPage(dashPage);
//   };

//   const handleLogout = () => {
//     setPage('landing');
//     setHistory(['landing']);
//     setSidebarOpen(false);
//   };

//   // Landing and Login/Signup are full-page (no sidebar/topbar)
//   if (page === 'landing') {
//     return <Landing onNavigate={navigateTo} darkMode={darkMode} setDarkMode={setDarkMode} />;
//   }

//   if (page === 'login') {
//     return <Login onLogin={handleLogin} onNavigate={navigateTo} goBack={goBack} darkMode={darkMode} setDarkMode={setDarkMode} />;
//   }

//   if (page === 'signup') {
//     return <Signup onNavigate={navigateTo} goBack={goBack} darkMode={darkMode} setDarkMode={setDarkMode} />;
//   }

//   // Render the appropriate screen content
//   const renderContent = () => {
//     switch (page) {
//       case 'student-dashboard':
//         return <StudentDashboard onNavigate={navigateTo} />;
//       case 'student-projects':
//         return <StudentProjects onNavigate={navigateTo} />;
//       case 'student-create-project':
//         return <CreateProject onNavigate={navigateTo} />;
//       case 'student-project-detail':
//         return <StudentProjectDetail onNavigate={navigateTo} />;
//       case 'student-submissions':
//         return <StudentSubmissions onNavigate={navigateTo} />;
//       case 'student-messages':
//         return <StudentMessages />;
//       case 'student-profile':
//         return <ProfilePage />;
//       case 'supervisor-dashboard':
//         return <SupervisorDashboard onNavigate={navigateTo} />;
//       case 'supervisor-projects':
//         return <SupervisorDashboard onNavigate={navigateTo} />;
//       case 'supervisor-project-detail':
//         return <SupervisorProjectDetail onNavigate={navigateTo} />;
//       case 'supervisor-reviews':
//         return <SupervisorReviews onNavigate={navigateTo} />;
//       case 'supervisor-grades':
//         return <SupervisorGrades onNavigate={navigateTo} />;
//       case 'supervisor-messages':
//         return <SupervisorMessages />;
//       case 'supervisor-profile':
//         return <ProfilePage />;
//       case 'admin-dashboard':
//         return <AdminDashboard onNavigate={navigateTo} />;
//       case 'admin-users':
//         return <AdminUsers />;
//       case 'admin-batches':
//         return <AdminBatches />;
//       case 'admin-gitea-settings':
//         return <AdminGiteaSettings />;
//       case 'admin-audit-logs':
//         return <AdminAuditLogs />;
//       case 'admin-profile':
//         return <ProfilePage />;
//       case 'activity':
//         return <ActivityPage />;
//       case 'settings':
//         return <SettingsPage />;
//       default:
//         return <StudentDashboard onNavigate={navigateTo} />;
//     }
//   };

//   const breadcrumbs = getBreadcrumbs();

//   return (
//     <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-[#0d1117]">
//       <Sidebar
//         role={role}
//         currentPage={page}
//         onNavigate={navigateTo}
//         open={sidebarOpen}
//         onClose={() => setSidebarOpen(false)}
//       />
//       <div className="flex flex-1 flex-col overflow-hidden">
//         <Topbar
//           sidebarOpen={sidebarOpen}
//           setSidebarOpen={setSidebarOpen}
//           darkMode={darkMode}
//           setDarkMode={setDarkMode}
//           userName={roleNames[role]}
//           userRole={role}
//           onLogout={handleLogout}
//           onProfileClick={() => {
//             // Navigate to role-specific profile page
//             const profilePage: Page = role === 'student' ? 'student-profile'
//               : role === 'supervisor' ? 'supervisor-profile'
//               : 'admin-profile';
//             navigateTo(profilePage);
//           }}
//         />
//         {/* Breadcrumb + Back Button Bar */}
//         {(canGoBack || breadcrumbs.length > 1) && (
//           <div className="flex items-center gap-2 px-4 lg:px-6 py-2 border-b border-neutral-100 dark:border-[#21262d] bg-white dark:bg-[#161b22]">
//             {canGoBack && (
//               <button
//                 onClick={goBack}
//                 className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition mr-2"
//               >
//                 <ChevronLeft className="h-4 w-4" />
//                 Back
//               </button>
//             )}
//             {canGoBack && breadcrumbs.length > 1 && (
//               <span className="text-neutral-300 dark:text-[#30363d]">|</span>
//             )}
//             <nav className="flex items-center gap-1 text-sm overflow-x-auto">
//               {breadcrumbs.map((crumb, i) => (
//                 <span key={i} className="flex items-center gap-1 whitespace-nowrap">
//                   {i > 0 && <span className="text-neutral-300 dark:text-[#484f58]">/</span>}
//                   {crumb.page ? (
//                     <button
//                       onClick={() => navigateTo(crumb.page!)}
//                       className="text-blue-600 dark:text-blue-400 hover:underline"
//                     >
//                       {crumb.label}
//                     </button>
//                   ) : (
//                     <span className="text-neutral-600 dark:text-[#8b949e] font-medium">{crumb.label}</span>
//                   )}
//                 </span>
//               ))}
//             </nav>
//           </div>
//         )}
//         <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 xl:p-10">
//           <div className="w-full max-w-[1800px] mx-auto">
//             {renderContent()}
//           </div>
//         </main>
//       </div>

//       {/* Session timeout warning */}
//       {sessionWarning && (
//         <Toast
//           message="Your session will expire in 5 minutes due to inactivity. Move your mouse or press a key to stay logged in."
//           type="info"
//           onClose={() => setSessionWarning(false)}
//         />
//       )}
//     </div>
//   );
// }
import { useState, useEffect, useCallback } from "react";
import type { Role, Page } from "./types";
import { Sidebar } from "./components/Sidebar";
import { Topbar, Toast } from "./components/ui";
import { Landing } from "./screens/Landing";
import { Login } from "./screens/Login";
import { Signup } from "./screens/Signup";
import {
  StudentDashboard,
  StudentProjects,
  CreateProject,
  StudentProjectDetail,
  StudentSubmissions,
  StudentMessages,
  SupervisorDashboard,
  SupervisorProjectDetail,
  SupervisorReviews,
  SupervisorGrades,
  SupervisorMessages,
  AdminDashboard,
  AdminUsers,
  AdminBatches,
  AdminGiteaSettings,
  AdminAuditLogs,
  ActivityPage,
  SettingsPage,
  ProfilePage,
} from "./screens/Dashboards";
import { ChevronLeft } from "./components/Icons";
import {
  preventClickjacking,
  startSessionTimeout,
  clearSessionTimeout,
  secureStorage,
} from "./utils/security";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TOKEN_KEY = "token";

const defaultPages: Record<Role, Page> = {
  student: "student-dashboard",
  supervisor: "supervisor-dashboard",
  admin: "admin-dashboard",
};

const parentPages: Partial<Record<Page, Page>> = {
  login: "landing",
  signup: "login",
  "student-projects": "student-dashboard",
  "student-create-project": "student-projects",
  "student-project-detail": "student-projects",
  "student-submissions": "student-dashboard",
  "student-messages": "student-dashboard",
  "student-profile": "student-dashboard",
  "supervisor-projects": "supervisor-dashboard",
  "supervisor-project-detail": "supervisor-dashboard",
  "supervisor-reviews": "supervisor-dashboard",
  "supervisor-grades": "supervisor-dashboard",
  "supervisor-messages": "supervisor-dashboard",
  "supervisor-profile": "supervisor-dashboard",
  "admin-users": "admin-dashboard",
  "admin-batches": "admin-dashboard",
  "admin-gitea-settings": "admin-dashboard",
  "admin-audit-logs": "admin-dashboard",
  "admin-profile": "admin-dashboard",
  activity: "student-dashboard",
  settings: "student-dashboard",
};

const rootPages: Page[] = [
  "landing",
  "login",
  "signup",
  "student-dashboard",
  "supervisor-dashboard",
  "admin-dashboard",
];

const pageTitles: Partial<Record<Page, string>> = {
  "student-dashboard": "Dashboard",
  "student-projects": "My Projects",
  "student-create-project": "Create Project",
  "student-project-detail": "Project Detail",
  "student-submissions": "Submissions",
  "student-messages": "Messages",
  "student-profile": "Profile",
  "supervisor-dashboard": "Dashboard",
  "supervisor-projects": "Projects",
  "supervisor-project-detail": "Project Detail",
  "supervisor-reviews": "Reviews",
  "supervisor-grades": "Grades",
  "supervisor-messages": "Messages",
  "supervisor-profile": "Profile",
  "admin-dashboard": "Dashboard",
  "admin-users": "Users",
  "admin-batches": "Batches",
  "admin-gitea-settings": "Gitea Settings",
  "admin-audit-logs": "Audit Logs",
  "admin-profile": "Profile",
  activity: "Activity",
  settings: "Settings",
};

export function App() {
  const [page, setPage] = useState<Page>("landing");
  const [history, setHistory] = useState<Page[]>(["landing"]);
  const [role, setRole] = useState<Role>("student");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("giteaforge-dark") === "true",
  );

  type CurrentUser = {
    id: string;
    fullName: string;
    role: "student" | "supervisor" | "admin";
  };

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    try {
      preventClickjacking();
    } catch {}
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    darkMode ? html.classList.add("dark") : html.classList.remove("dark");
    localStorage.setItem("giteaforge-dark", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const isLoggedIn = !["landing", "login", "signup"].includes(page);
    if (!isLoggedIn) return;

    const handleActivity = () => {
      setSessionWarning(false);
      startSessionTimeout(
        30 * 60 * 1000,
        () => {
          secureStorage.clear();
          localStorage.removeItem(TOKEN_KEY);
          setPage("login");
          setHistory(["login"]);
        },
        5 * 60 * 1000,
        () => setSessionWarning(true),
      );
    };

    handleActivity();
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) =>
      window.addEventListener(e, handleActivity, { passive: true }),
    );

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearSessionTimeout();
    };
  }, [page]);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      // No token, ensure we're on a public page
      if (!["landing", "login", "signup"].includes(page)) {
        setPage("landing");
        setHistory(["landing"]);
      }
      setUserLoading(false);
      return;
    }

    // Only load user if we don't have user data yet
    if (currentUser) {
      setUserLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        setUserLoading(true);
        const res = await fetch(`${API_BASE_URL}/v1/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error("Unauthorized");
        }

        const json = await res.json();
        const user = json.data?.user || json.user;

        console.log("Loaded user:", user);

        setCurrentUser({
          id: user._id,
          fullName: user.fullName || user.name,
          role: user.role,
        });

        const userRole = user.role as Role;
        setRole(userRole);
        
        console.log("User role:", userRole, "Default page:", defaultPages[userRole]);
        
        // Always redirect to the correct dashboard for the user's role
        const correctDashboard = defaultPages[userRole];
        console.log("Current page:", page, "Correct dashboard:", correctDashboard);
        
        // Set the correct dashboard page
        setHistory([correctDashboard]);
        setPage(correctDashboard);
      } catch (err) {
        console.error("Failed to load user:", err);
        handleLogout();
      } finally {
        setUserLoading(false);
      }
    };

    loadUser();
  }, [currentUser]);

  const navigateTo = useCallback((newPage: Page) => {
    setHistory((prev) => [...prev, newPage]);
    setPage(newPage);
  }, []);

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, -1);
      setPage(next[next.length - 1]);
      return next;
    });
  }, []);

  const getParentPage = useCallback(
    (current: Page): Page | null => {
      if (rootPages.includes(current)) return null;
      if (current === "activity" || current === "settings") {
        return defaultPages[role];
      }
      return parentPages[current] || null;
    },
    [role],
  );

  const canGoBack = history.length > 1 && !rootPages.includes(page);

  const breadcrumbs = (() => {
    const crumbs: { label: string; page: Page | null }[] = [];
    let cur: Page | null = page;
    while (cur) {
      crumbs.unshift({
        label: pageTitles[cur] || cur,
        page: cur === page ? null : cur,
      });
      cur = getParentPage(cur);
    }
    return crumbs;
  })();

  const handleLogin = async (r: Role) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      console.error("No token found after login");
      return;
    }

    try {
      setUserLoading(true);
      console.log("Fetching user data after login...");
      
      const res = await fetch(`${API_BASE_URL}/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch user data");
      }

      const json = await res.json();
      const user = json.data?.user || json.user;

      console.log("User data received:", user);

      const userData = {
        id: user._id,
        fullName: user.fullName || user.name,
        role: user.role,
      };

      setCurrentUser(userData);

      const userRole = user.role as Role;
      setRole(userRole);
      
      const correctDashboard = defaultPages[userRole];
      console.log("Setting page to:", correctDashboard);
      
      setHistory([correctDashboard]);
      setPage(correctDashboard);
    } catch (err) {
      console.error("Login error:", err);
      handleLogout();
    } finally {
      setUserLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setPage("landing");
    setHistory(["landing"]);
    setSidebarOpen(false);
  };

  if (page === "landing") {
    return (
      <Landing
        onNavigate={navigateTo}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  if (page === "login") {
    return (
      <Login
        onLogin={handleLogin}
        onNavigate={navigateTo}
        goBack={goBack}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  if (page === "signup") {
    return (
      <Signup
        onNavigate={navigateTo}
        goBack={goBack}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  const renderContent = () => {
    // Don't render anything until we know the user's role
    if (userLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 dark:border-[#30363d] border-t-blue-500 mx-auto mb-4" />
            <p className="text-sm text-neutral-500 dark:text-[#8b949e]">Loading...</p>
          </div>
        </div>
      );
    }

    // Verify user has access to the current page
    if (currentUser) {
      const userRole = currentUser.role;
      const pagePrefix = page.split("-")[0]; // e.g., "student", "supervisor", "admin"
      
      // Check if user is trying to access a page they shouldn't
      if (pagePrefix === "student" && userRole !== "student") {
        console.warn("Non-student trying to access student page, redirecting...");
        setTimeout(() => navigateTo(defaultPages[userRole]), 0);
        return null;
      }
      if (pagePrefix === "supervisor" && userRole !== "supervisor" && userRole !== "admin") {
        console.warn("Non-supervisor trying to access supervisor page, redirecting...");
        setTimeout(() => navigateTo(defaultPages[userRole]), 0);
        return null;
      }
      if (pagePrefix === "admin" && userRole !== "admin") {
        console.warn("Non-admin trying to access admin page, redirecting...");
        setTimeout(() => navigateTo(defaultPages[userRole]), 0);
        return null;
      }
    }

    switch (page) {
      case "student-dashboard":
        return <StudentDashboard onNavigate={navigateTo} />;
      case "student-projects":
        return <StudentProjects onNavigate={navigateTo} />;
      case "student-create-project":
        return <CreateProject onNavigate={navigateTo} />;
      case "student-project-detail":
        return <StudentProjectDetail onNavigate={navigateTo} />;
      case "student-submissions":
        return <StudentSubmissions onNavigate={navigateTo} />;
      case "student-messages":
        return <StudentMessages />;
      case "student-profile":
        return <ProfilePage />;
      case "supervisor-dashboard":
        return <SupervisorDashboard onNavigate={navigateTo} />;
      case "supervisor-projects":
        return <SupervisorDashboard onNavigate={navigateTo} />;
      case "supervisor-project-detail":
        return <SupervisorProjectDetail onNavigate={navigateTo} />;
      case "supervisor-reviews":
        return <SupervisorReviews onNavigate={navigateTo} />;
      case "supervisor-grades":
        return <SupervisorGrades onNavigate={navigateTo} />;
      case "supervisor-messages":
        return <SupervisorMessages />;
      case "supervisor-profile":
        return <ProfilePage />;
      case "admin-dashboard":
        return <AdminDashboard onNavigate={navigateTo} />;
      case "admin-users":
        return <AdminUsers />;
      case "admin-batches":
        return <AdminBatches />;
      case "admin-gitea-settings":
        return <AdminGiteaSettings />;
      case "admin-audit-logs":
        return <AdminAuditLogs />;
      case "admin-profile":
        return <ProfilePage />;
      case "activity":
        return <ActivityPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return null;
    }
  };

  // Show loading screen while fetching user data
  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50 dark:bg-[#0d1117]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 dark:border-[#30363d] border-t-blue-500 mx-auto mb-4" />
          <p className="text-sm text-neutral-500 dark:text-[#8b949e]">Loading...</p>
        </div>
      </div>
    );
  }

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
          userName={currentUser?.fullName ?? "Loading"}
          userRole={currentUser?.role ?? role}
          onLogout={handleLogout}
          onProfileClick={() => {
            if (!currentUser) return;

            const profilePage: Page =
              currentUser.role === "student"
                ? "student-profile"
                : currentUser.role === "supervisor"
                  ? "supervisor-profile"
                  : "admin-profile";

            navigateTo(profilePage);
          }}
        />

        {(canGoBack || breadcrumbs.length > 1) && (
          <div className="flex items-center gap-2 px-6 py-2 border-b bg-white dark:bg-[#161b22]">
            {canGoBack && (
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-blue-600"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <nav className="flex items-center gap-1 text-sm">
              {breadcrumbs.map((c, i) => (
                <span key={i}>
                  {i > 0 && " / "}
                  {c.page ? (
                    <button
                      onClick={() => navigateTo(c.page as Page)}
                      className="text-blue-600"
                    >
                      {c.label}
                    </button>
                  ) : (
                    <span className="text-neutral-600">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>

      {sessionWarning && (
        <Toast
          message="Your session will expire in 5 minutes due to inactivity."
          type="info"
          onClose={() => setSessionWarning(false)}
        />
      )}
    </div>
  );
}
