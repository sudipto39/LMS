import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";

import {
  projectsApi,
  coursesApi,
  batchesApi,
  activitiesApi,
  adminApi,
  usersApi,
  milestonesApi,
} from "./api";
import { env } from "./config/env";
import { sanitizeCsvCell } from "./utils/security";
import { Card } from "./components/common/UIPrimitives";

// Modular Common Components
import Navbar from "./components/common/Navbar";
import Sidebar from "./components/common/Sidebar";
import LandingPage from "./components/landing/LandingPage";

// Modular Auth Container
import AuthContainer from "./components/auth/AuthContainer";

// Modular Modals
import CreateProjectModal from "./components/modals/CreateProjectModal";
import TeamModal from "./components/modals/TeamModal";
import GradeModal from "./components/modals/GradeModal";
import ProjectSettingsModal from "./components/modals/ProjectSettingsModal";
import CourseModal from "./components/modals/CourseModal";
import BatchModal from "./components/modals/BatchModal";
import UserModal from "./components/modals/UserModal";
import DeleteUserModal from "./components/modals/DeleteUserModal";
import AssignSupervisorModal from "./components/modals/AssignSupervisorModal";
import CsvImportModal from "./components/modals/CsvImportModal";
import CreateLabAssignmentModal from "./components/modals/CreateLabAssignmentModal";
import BatchSubmissionsRosterModal from "./components/modals/BatchSubmissionsRosterModal";

// Modular Screen Views
import StudentDashboard from "./screens/StudentDashboard";
import SupervisorDashboard from "./screens/SupervisorDashboard";
import AdminDashboard from "./screens/AdminDashboard";
import ProjectsScreen from "./screens/ProjectsScreen";
import ProjectDetailScreen from "./screens/ProjectDetailScreen";
import MilestonesScreen from "./screens/MilestonesScreen";
import SubmissionsScreen from "./screens/SubmissionsScreen";
import PendingReviewsScreen from "./screens/PendingReviewsScreen";
import GradesScreen from "./screens/GradesScreen";
import BatchesScreen from "./screens/BatchesScreen";
import UsersScreen from "./screens/UsersScreen";
import GiteaConfigScreen from "./screens/GiteaConfigScreen";
import ActivityScreen from "./screens/ActivityScreen";
import AuditLogsScreen from "./screens/AuditLogsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import CodeSandboxScreen from "./screens/CodeSandboxScreen";
import LabAssignmentsScreen, { DEMO_LAB_ASSIGNMENTS } from "./screens/LabAssignmentsScreen";
import ProblemStatementsScreen from "./screens/ProblemStatementsScreen";
import ProposeProblemStatementModal from "./components/modals/ProposeProblemStatementModal";
import ReviewProblemStatementsModal from "./components/modals/ReviewProblemStatementsModal";
import ReviewSupervisorRequestsModal from "./components/modals/ReviewSupervisorRequestsModal";
import { problemStatementsApi, labsApi } from "./api";
import type { ProblemStatement } from "./types";
import { DEFAULT_PROBLEM_STATEMENTS } from "./data/mockData";
export { DEFAULT_PROBLEM_STATEMENTS };

// Excel Export Engine
import {
  exportStudentProjectsToExcel,
  exportGroupProjectsToExcel,
  exportGradesToExcel,
  type StudentProjectRow,
  type GradeRow,
} from "./utils/excelExport";
import type {
  Project,
  Milestone,
  MilestoneAttachment,
  Feedback,
  Course,
  Batch,
  User,
  ActivityItem,
  AuditLogItem,
  Role,
  LabAssignment,
} from "./types";

// ── Role Authorization Guard ──────────────────────────────────────────────────
const RoleGuard = ({
  allowed,
  currentRole,
  children,
}: {
  allowed: Role[];
  currentRole: Role;
  children: React.ReactNode;
}) => {
  if (!allowed.includes(currentRole)) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto space-y-3 mt-10">
        <div className="h-12 w-12 rounded-full grid place-items-center bg-[#ef4444]/10 text-[#ef4444] mx-auto">
          <ShieldAlert size={24} />
        </div>
        <h3 className="font-bold text-[16px]">Access Restricted</h3>
        <p className="text-[12px]" style={{ color: "var(--t2)" }}>
          Your account role (
          <span className="font-semibold capitalize">
            {currentRole.toLowerCase()}
          </span>
          ) does not have authorization to view this section.
        </p>
      </Card>
    );
  }
  return <>{children}</>;
};

function MainApp() {
  const { user, role, isAuthenticated, isLoading, logout, exploreDemo, users, setUsers } =
    useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Anti-flash overlay: covers the dashboard mount on auth transitions ──────
  const prevIsAuthRef = useRef(false);
  const [isEnteringApp, setIsEnteringApp] = useState(false);

  useEffect(() => {
    if (!prevIsAuthRef.current && isAuthenticated) {
      // Just became authenticated (demo or real login) — show cover overlay
      setIsEnteringApp(true);
      const t = setTimeout(() => setIsEnteringApp(false), 550);
      return () => clearTimeout(t);
    }
    prevIsAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Navigation and Views State
  const [authView, setAuthView] = useState<"landing" | "auth">("landing");
  const [authInitialMode, setAuthInitialMode] = useState<"login" | "register">("login");
  const [mobileOpen, setMobileOpen] = useState(false);
  // Full sidebar menu bar as default
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Supported top-level route mapping
  const VALID_PAGES: Record<string, string> = {
    dashboard: "dashboard",
    ideas: "ideas",
    "problem-statements": "ideas",
    projects: "projects",
    milestones: "milestones",
    submissions: "submissions",
    pending: "pending",
    reviews: "pending",
    grades: "grades",
    batches: "batches",
    users: "users",
    gitea: "gitea",
    activity: "activity",
    audit: "audit",
    "audit-logs": "audit",
    profile: "profile",
    labs: "labs",
    sandbox: "sandbox",
  };

  // Derive active project ID and page directly from URL — single source of truth, eliminates state tearing & page flicker
  const projectMatch = location.pathname.match(/^\/projects\/([^/]+)/);
  const selectedProjectId = projectMatch ? projectMatch[1] : null;

  const cleanPath = location.pathname.replace(/^\/+|\/+$/g, "");
  const firstSegment = cleanPath.split("/")[0] || "dashboard";
  const page = VALID_PAGES[firstSegment] || "dashboard";

  const navigateToPage = useCallback(
    (destPage: string, targetId?: string) => {
      let targetUrl = destPage === "dashboard" ? "/dashboard" : `/${destPage}`;
      if (destPage === "milestones" && targetId) {
        targetUrl = `/milestones?milestoneId=${encodeURIComponent(targetId)}`;
      }
      if (location.pathname !== targetUrl || targetId) {
        navigate(targetUrl, { state: targetId ? { milestoneId: targetId } : undefined });
      }
    },
    [location.pathname, navigate]
  );

  const handleSelectProject = useCallback(
    (id: string, tab: string = "overview") => {
      const currentOrigin = location.pathname.startsWith("/projects/")
        ? (location.state as any)?.from || "/projects"
        : location.pathname + location.search;

      navigate(`/projects/${id}/${tab}`, {
        state: { from: currentOrigin },
      });
    },
    [location.pathname, location.search, location.state, navigate]
  );

  const handleBackFromProject = useCallback(() => {
    const fromState = (location.state as any)?.from;
    const isSafeRelativeUrl =
      typeof fromState === "string" &&
      fromState.startsWith("/") &&
      !fromState.startsWith("//") &&
      !fromState.includes("\\") &&
      !fromState.toLowerCase().includes("javascript:");

    if (isSafeRelativeUrl && !fromState.startsWith(`/projects/${selectedProjectId}`)) {
      navigate(fromState);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/projects");
    }
  }, [location.state, navigate, selectedProjectId]);



  // Core Data State
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>(DEFAULT_PROBLEM_STATEMENTS);
  const [labAssignments, setLabAssignments] = useState<LabAssignment[]>(DEMO_LAB_ASSIGNMENTS);

  // Modals Visibility State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeModalProject, setGradeModalProject] = useState<Project | null>(null);
  const [showProjectSettingsModal, setShowProjectSettingsModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<User | null>(null);
  const [showAssignSupervisorModal, setShowAssignSupervisorModal] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [showCreateLabModal, setShowCreateLabModal] = useState(false);
  const [initialSubjectForCreateLab, setInitialSubjectForCreateLab] = useState<string | undefined>(undefined);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [selectedAssignmentIdForRoster, setSelectedAssignmentIdForRoster] = useState<string | null>(null);
  const [activeLabForSandbox, setActiveLabForSandbox] = useState<LabAssignment | null>(null);
  const [showProposeIdeaModal, setShowProposeIdeaModal] = useState(false);
  const [showReviewIdeasModal, setShowReviewIdeasModal] = useState(false);
  const [showSupervisorRequestsModal, setShowSupervisorRequestsModal] = useState(false);
  const [selectedProblemStatementForCreate, setSelectedProblemStatementForCreate] = useState<ProblemStatement | null>(null);
  const [lastCreatedStatement, setLastCreatedStatement] = useState<ProblemStatement | null>(null);
  const [catalogRefreshKey, setCatalogRefreshKey] = useState(0);
  const [pendingIdeasCount, setPendingIdeasCount] = useState(0);
  const [pendingSupervisorRequestsCount, setPendingSupervisorRequestsCount] = useState(0);

  // Supervisors List
  const supervisors = (users || []).filter((u) => u && u.role === "SUPERVISOR");

  // Selected Active Project
  const activeProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0] || null;

  // ── Main Content Viewport Scroll Reference & Auto-Reset ────────────────────
  const mainScrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page, selectedProjectId]);

  // ── Global Modal Body Scroll Lock (Prevents Background Movement) ─────────
  const isAnyModalOpen =
    showCreateModal ||
    showTeamModal ||
    showGradeModal ||
    showProjectSettingsModal ||
    showCourseModal ||
    showBatchModal ||
    showUserModal ||
    showDeleteUserModal ||
    showAssignSupervisorModal ||
    showCsvImportModal ||
    showCreateLabModal ||
    showRosterModal ||
    showProposeIdeaModal ||
    showReviewIdeasModal ||
    showSupervisorRequestsModal;

  useEffect(() => {
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isAnyModalOpen]);

  // ── Modular Project Loader (Callable on mount and after mutations) ─────────
  const loadProjects = useCallback(async () => {
    try {
      let projList: any[] = [];
      if (role === "STUDENT") {
        const res = await projectsApi.getMyProjects();
        if (res?.data) projList = res.data;
      } else if (role === "SUPERVISOR") {
        const res = await projectsApi.getSupervisedProjects();
        if (res?.data) projList = res.data;
      } else if (role === "ADMIN") {
        const res = await projectsApi.getAllProjects();
        if (res?.data) projList = res.data;
      }

      if (Array.isArray(projList)) {
        const normalizedProjects: Project[] = projList.map((p: any) => {
          const rawMilestones = Array.isArray(p.milestones) ? p.milestones : [];
          const mappedMilestones: Milestone[] = rawMilestones.map((m: any, idx: number) => ({
            id: m.id || `m-${p.id}-${idx}`,
            projectId: p.id,
            projectTitle: p.title,
            title: m.title,
            description: m.description,
            status: m.status || "PENDING",
            order: typeof m.order === "number" ? m.order : idx + 1,
            due: m.dueDate ? new Date(m.dueDate).toLocaleDateString() : m.due || "TBD",
            submittedAt: m.submittedAt ? new Date(m.submittedAt).toLocaleDateString() : m.status === "APPROVED" || m.status === "SUBMITTED" ? "27/8/2026" : undefined,
            files: Array.isArray(m.attachments) ? m.attachments.length : m.files || 0,
            note: m.studentNotes || m.feedback || m.note || "Milestone deliverable",
            attachments: Array.isArray(m.attachments)
              ? m.attachments
              : m.files > 0
              ? [{ name: `${m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-deliverable.pdf`, size: 2450000 }]
              : [],
          }));

          const rawMembers = Array.isArray(p.members) ? p.members.map((m: any) => m.user || m).filter(Boolean) : [];
          const rawTeam = Array.isArray(p.team) && p.team.length > 0 ? p.team : [];
          const team = rawTeam.length > 0
            ? rawTeam
            : p.owner
            ? [p.owner, ...rawMembers.filter((u: any) => u && u.id !== p.owner?.id)]
            : rawMembers;

          return {
            ...p,
            desc: p.desc || p.description || "",
            description: p.description || p.desc || "",
            techs: Array.isArray(p.techs)
              ? p.techs
              : Array.isArray(p.technologies)
              ? p.technologies
              : [],
            technologies: Array.isArray(p.technologies)
              ? p.technologies
              : Array.isArray(p.techs)
              ? p.techs
              : [],
            team,
            milestones: mappedMilestones,
            repoUrl: (() => {
              const giteaRoot = env.GITEA_URL;
              const raw = p.repoUrl || (p.repoName ? `${giteaRoot}/${p.owner?.giteaUsername || "user"}/${p.repoName}.git` : "gitea.univ.edu/project.git");
              return raw.replace(/^http:\/\/(localhost|127\.0\.0\.1):3000/, giteaRoot);
            })(),
            supervisor:
              typeof p.supervisor === "string" &&
              p.supervisor !== "Unassigned" &&
              p.supervisor !== "Pending Admin Allocation"
                ? p.supervisor
                : p.supervisor?.name
                ? p.supervisor.name
                : p.requestedSupervisor?.name
                ? `${p.requestedSupervisor.name} (Requested)`
                : p.supervisorRequestStatus === "PENDING"
                ? "Advisor Requested (Pending Admin Approval)"
                : "Unassigned",
            supervisorId: p.supervisorId || p.supervisor?.id || "",
            requestedSupervisor: p.requestedSupervisor,
            requestedSupervisorId: p.requestedSupervisorId,
            supervisorRequestStatus: p.supervisorRequestStatus,
            supervisorRequestReason: p.supervisorRequestReason,
            problemStatement: p.problemStatement,
            problemStatementId: p.problemStatementId,
            progress: typeof p.progress === "number" ? p.progress : 0,
          };
        });

        setProjects(normalizedProjects);
        const allMils = normalizedProjects.flatMap((p: any) => p.milestones || []);
        setMilestones(allMils);
      } else {
        setProjects([]);
        setMilestones([]);
      }
    } catch (err) {
      console.warn("Could not load projects for role:", role, err);
      setProjects([]);
      setMilestones([]);
    }
  }, [role, user?.id]);

  // ── Admin Pending Queues Sync ──────────────────────────────────────────────
  const loadAdminQueues = useCallback(async () => {
    if (role !== "ADMIN") return;
    try {
      const [pendingIdeasRes, supervisorReqRes] = await Promise.allSettled([
        problemStatementsApi.getPendingAdmin(),
        adminApi.getSupervisorRequests(),
      ]);
      if (pendingIdeasRes.status === "fulfilled" && pendingIdeasRes.value?.data) {
        setPendingIdeasCount(pendingIdeasRes.value.data.length);
      }
      if (supervisorReqRes.status === "fulfilled" && supervisorReqRes.value?.data) {
        setPendingSupervisorRequestsCount(supervisorReqRes.value.data.length);
      }
    } catch {
      // Keeps graceful defaults
    }
  }, [role]);

  // ── Auto-Sync Live Data When Navigating Pages ──────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
      if (role === "ADMIN") {
        loadAdminQueues();
      }
      if (page === "activity" || page === "dashboard") {
        (async () => {
          try {
            let actRes: any;
            if (role === "ADMIN") {
              actRes = await activitiesApi.getAdminActivities();
            } else if (role === "SUPERVISOR") {
              actRes = await activitiesApi.getSupervisorActivities();
            } else {
              actRes = await activitiesApi.getMyActivities();
            }
            if (actRes?.data && Array.isArray(actRes.data)) {
              setActivities(actRes.data);
            } else {
              setActivities([]);
            }
          } catch (err) {
            console.warn("Could not reload activities on page navigation:", err);
          }
        })();
      }
    }
  }, [page, isAuthenticated, role, loadProjects, loadAdminQueues]);

  // ── Live Backend Data Sync (Mount & Auth) ──────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      setProjects([]);
      setMilestones([]);
      setFeedbacks([]);
      setActivities([]);
      setAuditLogs([]);
      return;
    }

    const loadLiveData = async () => {
      await Promise.allSettled([
        // 1. Courses & Batches
        (async () => {
          try {
            const [courseRes, batchRes] = await Promise.allSettled([
              coursesApi.getAllCourses(),
              batchesApi.getAllBatches(),
            ]);
            if (courseRes.status === "fulfilled" && courseRes.value?.data) {
              setCourses(courseRes.value.data);
            }
            if (batchRes.status === "fulfilled" && batchRes.value?.data) {
              setBatches(batchRes.value.data);
            }
          } catch {
            // Keeps graceful defaults
          }
        })(),

        // 2. Projects & Milestones by Role
        loadProjects(),

        // 3. Live Activities (Role Specific)
        (async () => {
          try {
            let actRes: any;
            if (role === "ADMIN") {
              actRes = await activitiesApi.getAdminActivities();
            } else if (role === "SUPERVISOR") {
              actRes = await activitiesApi.getSupervisorActivities();
            } else {
              actRes = await activitiesApi.getMyActivities();
            }
            if (actRes?.data && Array.isArray(actRes.data)) {
              setActivities(actRes.data);
            } else {
              setActivities([]);
            }
          } catch (err) {
            console.warn("Could not load activities:", err);
            setActivities([]);
          }
        })(),

        // 4. Live Users & Audit Logs (Admin) or Supervisors List (Non-Admin)
        (async () => {
          if (role === "ADMIN") {
            try {
              const [audRes, usersRes] = await Promise.allSettled([
                adminApi.getAuditLogs(),
                adminApi.getAllUsers(),
              ]);
              if (audRes.status === "fulfilled" && audRes.value?.data && Array.isArray(audRes.value.data) && audRes.value.data.length > 0) {
                const liveLogs: AuditLogItem[] = audRes.value.data.map((l: any) => ({
                  id: l.id,
                  time: l.createdAt || l.time
                    ? new Date(l.createdAt || l.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Just now",
                  user:
                    typeof l.user === "object" && l.user !== null
                      ? l.user.name || "System"
                      : typeof l.user === "string"
                      ? l.user
                      : "System",
                  action: l.action || l.type || "SYSTEM_EVENT",
                  desc: l.desc || l.description || "System activity recorded",
                }));
                setAuditLogs(liveLogs);
              }
              if (usersRes.status === "fulfilled" && usersRes.value?.data && Array.isArray(usersRes.value.data) && usersRes.value.data.length > 0) {
                const liveUsers: User[] = usersRes.value.data.map((u: any) => ({
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  role: u.role,
                  avatar:
                    u.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      u.name || u.email || "User"
                    )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`,
                  dept: u.dept || u.department || "CSE",
                  idNo: u.idNo || u.universityId || "CS1001",
                  batch: u.batch || (u.role === "STUDENT" ? "General Batch" : "Academic Staff"),
                  phoneNumber: u.phoneNumber || "",
                  universityId: u.universityId || u.idNo || "",
                }));
                setUsers(liveUsers);
              }

              // Problem Statements & Supervisor Requests Queues
              try {
                const [pendingIdeasRes, supervisorReqRes] = await Promise.allSettled([
                  problemStatementsApi.getPendingAdmin(),
                  adminApi.getSupervisorRequests(),
                ]);
                if (pendingIdeasRes.status === "fulfilled" && pendingIdeasRes.value?.data) {
                  setPendingIdeasCount(pendingIdeasRes.value.data.length);
                }
                if (supervisorReqRes.status === "fulfilled" && supervisorReqRes.value?.data) {
                  setPendingSupervisorRequestsCount(supervisorReqRes.value.data.length);
                }
              } catch {
                // Keeps graceful defaults
              }
            } catch (err) {
              console.warn("Could not load admin users/audit logs:", err);
            }
          } else {
            try {
              const supRes = await usersApi.getSupervisors();
              if (supRes?.data && Array.isArray(supRes.data) && supRes.data.length > 0) {
                setUsers((prev) => {
                  const liveSups: User[] = supRes.data!.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    email: s.email,
                    role: "SUPERVISOR" as const,
                    avatar:
                      s.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        s.name || s.email || "Supervisor"
                      )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`,
                    dept: s.dept || s.department || "CSE",
                    idNo: s.idNo || s.universityId || "FAC-100",
                    batch: "Academic Staff",
                  }));
                  const nonSups = prev.filter((u) => u.role !== "SUPERVISOR");
                  return [...liveSups, ...nonSups];
                });
              }
            } catch (err) {
              console.warn("Could not load supervisors:", err);
            }
          }
        })(),

        // 5. Problem Statements & Lab Assignments for Global Omni-Search
        (async () => {
          try {
            const [psRes, labsRes] = await Promise.allSettled([
              problemStatementsApi.getCatalog(),
              labsApi.getLabAssignments(),
            ]);
            if (psRes.status === "fulfilled") {
              const val: any = psRes.value;
              const list = Array.isArray(val) ? val : val?.data;
              if (Array.isArray(list) && list.length > 0) {
                setProblemStatements(list);
              }
            }
            if (labsRes.status === "fulfilled") {
              const val: any = labsRes.value;
              const list = Array.isArray(val) ? val : val?.data;
              if (Array.isArray(list) && list.length > 0) {
                setLabAssignments(list);
              }
            }
          } catch {
            // Keeps graceful defaults
          }
        })(),
      ]);
    };

    loadLiveData();
  }, [isAuthenticated, role, user?.id]);

  // ── Excel Export Handlers ──────────────────────────────────────────────────
  const buildStudentRows = (projectList: Project[]): StudentProjectRow[] => {
    return projectList.map((p) => {
      const linkedBatch = batches.find((b) => b.id === p.batchId);
      const teamArr = p.team || [];
      const studentName = teamArr[0]?.name || "Student";
      const universityId = teamArr[0]?.idNo || (teamArr[0] as any)?.universityId || "CS1001";
      const department = teamArr[0]?.dept || (teamArr[0] as any)?.department || "CSE";
      const pMilestones = milestones.filter((m) => m.projectId === p.id);
      const approvedCount = pMilestones.filter((m) => m.status === "APPROVED").length;

      return {
        studentName,
        universityId,
        department,
        projectTitle: p.title,
        technologies: (p.techs || p.technologies || []).join(", "),
        status: p.status,
        progress: p.progress || 0,
        supervisor: p.supervisor || "Unassigned",
        batch: linkedBatch ? linkedBatch.name : p.batch || "General",
        startDate: "2026-08-01",
        endDate: "2026-12-15",
        milestonesTotal: pMilestones.length || 4,
        milestonesApproved: approvedCount,
      };
    });
  };

  const handleExportStudentsExcel = () => {
    const rows = buildStudentRows(projects);
    exportStudentProjectsToExcel(rows);
    showToast("Exported student projects to Excel (.xls)");
  };

  const handleExportGroupsExcel = () => {
    const rows = buildStudentRows(projects);
    exportGroupProjectsToExcel(rows);
    showToast("Exported group projects by batch (.xls)");
  };

  const handleExportGradesExcel = () => {
    const gradeRows: GradeRow[] = projects.map((p) => ({
      studentName: (p.team || [])[0]?.name || "Student",
      projectTitle: p.title,
      score: p.grade === "A+" ? 95 : p.grade === "A" ? 88 : p.grade === "B+" ? 78 : 85,
      grade: p.grade || "A",
      status: p.status,
      supervisorFeedback: p.feedback || "Approved with distinction.",
      gradedAt: new Date().toISOString().slice(0, 10),
      codeQuality: 92,
      documentation: 90,
      presentation: 94,
      innovation: 88,
      teamwork: 95,
    }));
    exportGradesToExcel(gradeRows);
    showToast("Exported capstone grades scorecard (.xls)");
  };

  const handleExportCsv = () => {
    const headers = [
      "ID",
      "Title",
      "Status",
      "Progress",
      "Supervisor",
      "Technologies",
    ];
    const rows = projects.map((p) =>
      [
        sanitizeCsvCell(p.id),
        sanitizeCsvCell(p.title),
        sanitizeCsvCell(p.status),
        sanitizeCsvCell(`${p.progress || 0}%`),
        sanitizeCsvCell(p.supervisor || "Unassigned"),
        sanitizeCsvCell((p.techs || p.technologies || []).join(";")),
      ].join(",")
    );

    const csvData = [headers.map(sanitizeCsvCell).join(","), ...rows].join(
      "\r\n"
    );
    const blob = new Blob(["\uFEFF" + csvData], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `giteaforge_projects_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Exported projects securely to CSV ✅");
  };

  // ── Milestone Actions ──────────────────────────────────────────────────────
  const handleStartMilestone = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "IN_PROGRESS" } : m))
    );
    showToast("Milestone started");
  };

  const handleSubmitMilestone = (id: string, notes: string, fileCount: number, uploadedAttachments?: MilestoneAttachment[]) => {
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: "SUBMITTED",
              note: notes || m.note,
              files: fileCount,
              submittedAt: new Date().toLocaleDateString(),
              attachments: uploadedAttachments || m.attachments || [],
            }
          : m
      )
    );
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        type: "milestone",
        scope: "personal",
        msg: "submitted deliverables for",
        time: "Just now",
        user: user?.name || "Student",
        avatar:
          user?.avatar ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
            user?.name || "Student"
          )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`,
        project: activeProject?.title || "Capstone Project",
        detail: `Attached ${fileCount} file(s): ${notes || "Milestone deliverables"}`,
      },
      ...prev,
    ]);
  };

  const handleApproveMilestone = async (id: string) => {
    try {
      await milestonesApi.approveMilestone(id);
    } catch {
      // Graceful local sync
    }
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "APPROVED" } : m))
    );
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        user: user?.name || "Supervisor",
        action: "MILESTONE_APPROVE",
        desc: `Approved milestone on project`,
      },
      ...prev,
    ]);
    showToast("Milestone approved ✅");
  };

  const handleRejectMilestone = async (id: string, reason: string) => {
    try {
      await milestonesApi.rejectMilestone(id, reason);
    } catch {
      // Graceful local sync
    }
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: "REJECTED", note: reason } : m
      )
    );
    showToast("Milestone marked as REJECTED with feedback remarks");
  };

  // ── Feedback Actions ───────────────────────────────────────────────────────
  const handleAddFeedback = (text: string) => {
    const newFb: Feedback = {
      id: `fb-${Date.now()}`,
      projectId: activeProject?.id || "",
      author: user?.name || "User",
      avatar:
        user?.avatar ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          user?.name || "User"
        )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`,
      role: role,
      content: text,
      time: "Just now",
      resolved: false,
    };
    setFeedbacks((prev) => [newFb, ...prev]);
    showToast("Feedback posted to project board");
  };

  const handleReplyFeedback = (feedbackId: string, text: string) => {
    setFeedbacks((prev) =>
      prev.map((fb) =>
        fb.id === feedbackId
          ? {
              ...fb,
              replies: [
                ...(fb.replies || []),
                {
                  id: `rep-${Date.now()}`,
                  author: user?.name || "User",
                  avatar:
                    user?.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      user?.name || "User"
                    )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`,
                  role: role,
                  content: text,
                  time: "Just now",
                },
              ],
            }
          : fb
      )
    );
    showToast("Reply added to thread");
  };

  const handleToggleResolveFeedback = (feedbackId: string) => {
    setFeedbacks((prev) =>
      prev.map((fb) =>
        fb.id === feedbackId ? { ...fb, resolved: !fb.resolved } : fb
      )
    );
    showToast("Feedback thread status updated");
  };

  // ── If Session is Restoring, show sleek loading indicator ──────────────────
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ background: "var(--bg, #0b1117)", color: "var(--t1, #f0f6fc)" }}
      >
        <div className="h-9 w-9 rounded-full border-2 border-[#06b6d4] border-t-transparent animate-spin" />
        <span className="text-[13px] font-semibold text-[#8aafbb]">Loading GiteaForge...</span>
      </div>
    );
  }

  // ── If Not Authenticated, show Landing or Auth Container ───────────────────
  if (!isAuthenticated) {
    if (authView === "landing") {
      return (
        <LandingPage
          onSignIn={() => {
            setAuthInitialMode("login");
            setAuthView("auth");
          }}
          onGetStarted={() => {
            setAuthInitialMode("register");
            setAuthView("auth");
          }}
          onExploreDemo={(demoRole) => {
            exploreDemo(demoRole);
          }}
        />
      );
    }

    return (
      <AuthContainer
        initialMode={authInitialMode}
        onReturnToLanding={() => setAuthView("landing")}
        courses={courses}
        batches={batches}
        onAuthComplete={() => {
          navigateToPage("dashboard");
        }}
      />
    );
  }

  // ── Authenticated App Shell ────────────────────────────────────────────────
  return (
    <div
      className="h-screen w-full text-[13px] flex overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--t1)" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); *{font-family:Inter,sans-serif} .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}
      @keyframes gf-fade-cover { 0%,60% { opacity:1; } 100% { opacity:0; } }`}</style>

      {/* Anti-flash overlay — covers dashboard mount whenever auth state transitions */}
      {isEnteringApp && (
        <div
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center gap-3 pointer-events-none"
          style={{
            background: "var(--bg, #0b1117)",
            animation: "gf-fade-cover 0.55s ease-in-out forwards",
          }}
        >
          <div className="h-9 w-9 rounded-full border-2 border-[#06b6d4] border-t-transparent animate-spin" />
          <span className="text-[13px] font-semibold text-[#8aafbb]">Entering Dashboard...</span>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        page={page}
        setPage={(p) => navigateToPage(p)}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        projectCount={projects.length}
        inProgressMilestoneCount={
          milestones.filter((m) => m.status === "IN_PROGRESS").length
        }
        pendingReviewCount={
          milestones.filter((m) => m.status === "SUBMITTED").length
        }
        userCount={users.length}
        batchCount={batches.length}
        onSignOut={logout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col h-full min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        } overflow-hidden`}
      >
        <Navbar
          page={selectedProjectId ? "Project Detail" : page}
          setPage={(p) => navigateToPage(p)}
          search={search}
          setSearch={setSearch}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          setMobileOpen={setMobileOpen}
          projects={projects}
          milestones={milestones}
          users={users}
          problemStatements={problemStatements}
          labAssignments={labAssignments}
          batches={batches}
          courses={courses}
          activities={activities}
          onSelectProject={(id) => handleSelectProject(id)}
          onSelectLab={(lab) => {
            setActiveLabForSandbox(lab);
            navigateToPage("sandbox");
          }}
          onSelectProblemStatement={(statement) => {
            setSelectedProblemStatementForCreate(statement);
            navigateToPage("ideas");
          }}
        />

        <main
          ref={mainScrollRef}
          className="flex-1 p-3 sm:p-5 lg:p-6 pb-20 md:pb-6 overflow-y-auto scroll-smooth overscroll-contain touch-pan-y"
        >
          {/* PROJECT DETAIL SCREEN */}
          {selectedProjectId && activeProject ? (
            <ErrorBoundary name="Project View">
              <ProjectDetailScreen
                project={activeProject}
                milestones={milestones.filter((m) => m.projectId === activeProject.id)}
                feedbacks={feedbacks.filter((f) => f.projectId === activeProject.id)}
                files={(activeProject as any).files || []}
                onBack={handleBackFromProject}
                onOpenTeamModal={() => setShowTeamModal(true)}
                onOpenGradeModal={() => {
                  setGradeModalProject(activeProject);
                  setShowGradeModal(true);
                }}
                onOpenSettingsModal={() => setShowProjectSettingsModal(true)}
                onStartMilestone={handleStartMilestone}
                onApproveMilestone={handleApproveMilestone}
                onRejectMilestone={handleRejectMilestone}
                onAddFeedback={handleAddFeedback}
                onReplyFeedback={handleReplyFeedback}
                onToggleResolveFeedback={handleToggleResolveFeedback}
                onNavigate={(dest, targetId) => navigateToPage(dest, targetId)}
              />
            </ErrorBoundary>
          ) : (
            <>
              {/* DASHBOARDS */}
              {page === "dashboard" && role === "STUDENT" && (
                <StudentDashboard
                  projects={projects}
                  milestones={milestones}
                  activities={activities}
                  onOpenCreateModal={() => setShowCreateModal(true)}
                  onSelectProject={(id) => handleSelectProject(id)}
                  onNavigate={(dest) => navigateToPage(dest)}
                />
              )}

              {page === "dashboard" && role === "SUPERVISOR" && (
                <SupervisorDashboard
                  projects={projects}
                  milestones={milestones}
                  activities={activities}
                  onApproveMilestone={handleApproveMilestone}
                  onOpenGradeModal={(proj) => {
                    setGradeModalProject(proj);
                    setShowGradeModal(true);
                  }}
                  onOpenProposeModal={() => setShowProposeIdeaModal(true)}
                  onNavigate={(dest) => navigateToPage(dest)}
                />
              )}

              {page === "dashboard" && role === "ADMIN" && (
                <AdminDashboard
                  users={users}
                  projects={projects}
                  batches={batches}
                  courses={courses}
                  auditLogs={auditLogs}
                  onExportCsv={handleExportCsv}
                  onOpenCsvModal={() => setShowCsvImportModal(true)}
                  onOpenAssignModal={() => setShowAssignSupervisorModal(true)}
                  onOpenCreateLab={() => setShowCreateLabModal(true)}
                  onOpenReviewIdeasModal={() => setShowReviewIdeasModal(true)}
                  onOpenSupervisorRequestsModal={() => setShowSupervisorRequestsModal(true)}
                  pendingIdeasCount={pendingIdeasCount}
                  pendingSupervisorRequestsCount={pendingSupervisorRequestsCount}
                  onNavigate={(dest) => navigateToPage(dest)}
                />
              )}

              {/* PROBLEM STATEMENTS & HACKATHON IDEA BANK SCREEN */}
              {page === "ideas" && (
                <ProblemStatementsScreen
                  onSelectStatementForProject={(statement) => {
                    setSelectedProblemStatementForCreate(statement);
                    setShowCreateModal(true);
                  }}
                  onOpenProposeModal={() => setShowProposeIdeaModal(true)}
                  lastCreatedStatement={lastCreatedStatement}
                  userProjects={projects}
                  catalogRefreshKey={catalogRefreshKey}
                  externalSearchQuery={search}
                />
              )}

              {/* PROJECTS SCREEN */}
              {page === "projects" && (
                <ProjectsScreen
                  projects={projects}
                  onSelectProject={(id) => handleSelectProject(id)}
                  onOpenCreateModal={() => setShowCreateModal(true)}
                  onExportStudentsExcel={handleExportStudentsExcel}
                  onExportGroupsExcel={handleExportGroupsExcel}
                  onExportGradesExcel={handleExportGradesExcel}
                  onExportCsv={handleExportCsv}
                  onOpenSupervisorRequestsModal={() => setShowSupervisorRequestsModal(true)}
                  searchQuery={search}
                />
              )}

              {/* MILESTONES SCREEN */}
              {page === "milestones" && (
                <RoleGuard allowed={["STUDENT", "ADMIN"]} currentRole={role}>
                  <MilestonesScreen
                    milestones={milestones}
                    onSubmitMilestone={handleSubmitMilestone}
                    onStartMilestone={handleStartMilestone}
                    searchQuery={search}
                    initialMilestoneId={
                      new URLSearchParams(location.search).get("milestoneId") ||
                      (location.state as any)?.milestoneId ||
                      undefined
                    }
                  />
                </RoleGuard>
              )}

              {/* SUBMISSIONS SCREEN */}
              {page === "submissions" && (
                <RoleGuard allowed={["STUDENT", "ADMIN"]} currentRole={role}>
                  <SubmissionsScreen milestones={milestones} />
                </RoleGuard>
              )}

              {/* PENDING REVIEWS SCREEN */}
              {page === "pending" && (
                <RoleGuard allowed={["SUPERVISOR", "ADMIN"]} currentRole={role}>
                  <PendingReviewsScreen
                    milestones={milestones}
                    projects={projects}
                    onApproveMilestone={handleApproveMilestone}
                    onRejectMilestone={handleRejectMilestone}
                    onOpenGradeModal={(proj) => {
                      setGradeModalProject(proj);
                      setShowGradeModal(true);
                    }}
                  />
                </RoleGuard>
              )}

              {/* GRADES SCREEN */}
              {page === "grades" && (
                <RoleGuard allowed={["SUPERVISOR", "ADMIN"]} currentRole={role}>
                  <GradesScreen
                    projects={projects}
                    onOpenGradeModal={(proj) => {
                      setGradeModalProject(proj);
                      setShowGradeModal(true);
                    }}
                    onExportGradesExcel={handleExportGradesExcel}
                  />
                </RoleGuard>
              )}

              {/* BATCHES & COURSES SCREEN */}
              {page === "batches" && (
                <RoleGuard allowed={["ADMIN"]} currentRole={role}>
                  <BatchesScreen
                    courses={courses}
                    batches={batches}
                    projects={projects}
                    users={users}
                    onOpenCourseModal={() => setShowCourseModal(true)}
                    onOpenBatchModal={() => setShowBatchModal(true)}
                    onDeleteCourse={(id) =>
                      setCourses((prev) => prev.filter((c) => c.id !== id))
                    }
                    onDeleteBatch={(id) =>
                      setBatches((prev) => prev.filter((b) => b.id !== id))
                    }
                    externalSearchQuery={search}
                  />
                </RoleGuard>
              )}

              {/* USERS & ROLES SCREEN */}
              {page === "users" && (
                <RoleGuard allowed={["ADMIN"]} currentRole={role}>
                  <UsersScreen
                    users={users}
                    onOpenCreateUserModal={() => {
                      setSelectedUserForEdit(null);
                      setShowUserModal(true);
                    }}
                    onOpenEditModal={(u) => {
                      setSelectedUserForEdit(u);
                      setShowUserModal(true);
                    }}
                    onOpenDeleteModal={(u) => {
                      setSelectedUserForDelete(u);
                      setShowDeleteUserModal(true);
                    }}
                    onOpenCsvModal={() => setShowCsvImportModal(true)}
                    externalSearchQuery={search}
                  />
                </RoleGuard>
              )}

              {/* GITEA CONFIG SCREEN */}
              {page === "gitea" && (
                <RoleGuard allowed={["ADMIN"]} currentRole={role}>
                  <GiteaConfigScreen />
                </RoleGuard>
              )}

              {/* ACTIVITY STREAM SCREEN */}
              {page === "activity" && <ActivityScreen activities={activities} />}

              {/* AUDIT LOGS SCREEN */}
              {page === "audit" && (
                <RoleGuard allowed={["ADMIN"]} currentRole={role}>
                  <AuditLogsScreen auditLogs={auditLogs} />
                </RoleGuard>
              )}

              {/* PROFILE SCREEN */}
              {page === "profile" && <ProfileScreen />}

              {/* LAB EXPERIMENTS & BATCH ASSIGNMENTS SCREEN */}
              {page === "labs" && (
                <LabAssignmentsScreen
                  batches={batches}
                  onOpenCreateModal={(subjectPreset) => {
                    setInitialSubjectForCreateLab(subjectPreset);
                    setShowCreateLabModal(true);
                  }}
                  onOpenRosterModal={(id) => {
                    setSelectedAssignmentIdForRoster(id);
                    setShowRosterModal(true);
                  }}
                  onOpenSandboxWithAssignment={(lab) => {
                    setActiveLabForSandbox(lab);
                    navigateToPage("sandbox");
                  }}
                  searchQuery={search}
                />
              )}

              {/* CODE SANDBOX SCREEN (STANDALONE & LAB SOLVER) */}
              {page === "sandbox" && (
                <CodeSandboxScreen
                  labAssignment={activeLabForSandbox}
                  onExitLabMode={() => {
                    setActiveLabForSandbox(null);
                    navigateToPage("labs");
                  }}
                  onLabSubmitted={() => {
                    showToast("Lab experiment solution submitted successfully! 🎉");
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* MODALS */}
      <CreateProjectModal
        show={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedProblemStatementForCreate(null);
        }}
        courses={courses}
        batches={batches}
        projects={projects}
        supervisors={supervisors}
        selectedProblemStatement={selectedProblemStatementForCreate}
        onCreateProject={async (newP) => {
          setProjects((prev) => [newP, ...prev]);
          showToast(`Project "${newP.title}" created successfully! 🚀`);
          await loadProjects();
          if (role === "ADMIN") {
            await loadAdminQueues();
          }
          setCatalogRefreshKey((k) => k + 1);
        }}
      />

      {activeProject && (
        <TeamModal
          show={showTeamModal}
          onClose={() => setShowTeamModal(false)}
          project={activeProject}
          allUsers={users}
          onAddMember={(newMem) => {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === activeProject.id
                  ? { ...p, team: [...p.team, newMem] }
                  : p
              )
            );
          }}
          onRemoveMember={(memId) => {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === activeProject.id
                  ? { ...p, team: p.team.filter((m) => m.id !== memId) }
                  : p
              )
            );
          }}
        />
      )}

      <GradeModal
        show={showGradeModal}
        onClose={() => setShowGradeModal(false)}
        project={gradeModalProject}
        onSaveGrade={(projId, grade, remarks) => {
          setProjects((prev) =>
            prev.map((p) =>
              p.id === projId
                ? {
                    ...p,
                    grade,
                    feedback: remarks || p.feedback,
                    status: "APPROVED",
                    progress: 100,
                  }
                : p
            )
          );
        }}
      />

      {activeProject && (
        <ProjectSettingsModal
          show={showProjectSettingsModal}
          onClose={() => setShowProjectSettingsModal(false)}
          project={activeProject}
          onUpdateProject={(id, title, desc) => {
            setProjects((prev) =>
              prev.map((p) => (p.id === id ? { ...p, title, desc } : p))
            );
          }}
          onDeleteProject={(id) => {
            setProjects((prev) => prev.filter((p) => p.id !== id));
            navigate("/projects");
          }}
        />
      )}

      <CourseModal
        show={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        onCourseCreated={(c) => setCourses([...courses, c])}
      />

      <BatchModal
        show={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        courses={courses}
        onBatchCreated={(b) => setBatches([...batches, b])}
      />

      <UserModal
        show={showUserModal}
        onClose={() => setShowUserModal(false)}
        user={selectedUserForEdit}
        batches={batches}
        onUserSaved={(savedUser, isNew) => {
          if (isNew) {
            setUsers((prev) => [savedUser, ...prev]);
          } else {
            setUsers((prev) =>
              prev.map((u) => (u.id === savedUser.id ? savedUser : u))
            );
          }
        }}
      />

      <DeleteUserModal
        show={showDeleteUserModal}
        onClose={() => setShowDeleteUserModal(false)}
        user={selectedUserForDelete}
        onUserDeleted={(userId) => {
          setUsers((prev) => prev.filter((u) => u.id !== userId));
        }}
      />

      <AssignSupervisorModal
        show={showAssignSupervisorModal}
        onClose={() => setShowAssignSupervisorModal(false)}
        projects={projects}
        supervisors={supervisors}
        onAssigned={async (projId, supervisor) => {
          // Optimistic instant state update for immediate UI response
          setProjects((prev) =>
            prev.map((p) =>
              p.id === projId
                ? { ...p, supervisor: supervisor.name, supervisorId: supervisor.id }
                : p
            )
          );
          // Authoritative background re-fetch to ensure complete server sync
          await loadProjects();
          if (role === "ADMIN") {
            await loadAdminQueues();
          }
          setCatalogRefreshKey((k) => k + 1);
        }}
      />

      <CsvImportModal
        show={showCsvImportModal}
        onClose={() => setShowCsvImportModal(false)}
        onImportComplete={() => {
          if (role === "ADMIN") {
            adminApi
              .getAllUsers()
              .then((res) => {
                if (res?.data && res.data.length > 0) {
                  setUsers(
                    res.data.map((u: any) => ({
                      ...u,
                      avatar:
                        u.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          u.name || u.email || "User"
                        )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`,
                      dept: u.dept || u.department || "CSE",
                      idNo: u.idNo || u.universityId || "CS1001",
                      batch: u.batch || "General",
                    }))
                  );
                }
              })
              .catch(() => {});
          }
        }}
      />

      {/* LAB EXPERIMENT MODALS */}
      <CreateLabAssignmentModal
        show={showCreateLabModal}
        onClose={() => {
          setShowCreateLabModal(false);
          setInitialSubjectForCreateLab(undefined);
        }}
        batches={batches}
        initialSubject={initialSubjectForCreateLab}
        onAssignmentCreated={() => {
          // Trigger refresh
        }}
      />

      {selectedAssignmentIdForRoster && (
        <BatchSubmissionsRosterModal
          show={showRosterModal}
          onClose={() => {
            setShowRosterModal(false);
            setSelectedAssignmentIdForRoster(null);
          }}
          assignmentId={selectedAssignmentIdForRoster}
        />
      )}

      {/* PROBLEM STATEMENTS & SUPERVISOR ALLOCATION MODALS */}
      <ProposeProblemStatementModal
        show={showProposeIdeaModal}
        onClose={() => setShowProposeIdeaModal(false)}
        onCreated={async (st) => {
          setLastCreatedStatement(st);
          setCatalogRefreshKey((k) => k + 1);
          if (role === "ADMIN") {
            await loadAdminQueues();
          }
          showToast("Problem statement submitted for review!");
        }}
      />

      <ReviewProblemStatementsModal
        show={showReviewIdeasModal}
        onClose={() => setShowReviewIdeasModal(false)}
        onUpdated={async () => {
          await loadAdminQueues();
          await loadProjects();
          setCatalogRefreshKey((k) => k + 1);
        }}
      />

      <ReviewSupervisorRequestsModal
        show={showSupervisorRequestsModal}
        onClose={() => setShowSupervisorRequestsModal(false)}
        supervisors={supervisors}
        onUpdated={async () => {
          await loadProjects();
          await loadAdminQueues();
          setCatalogRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
