import { useState, useEffect, useCallback } from "react";
import type {
  Page,
  Project,
  ActivityItem,
} from "@/types";
import dataService from "@/services/dataService";
import { getGiteaURL } from "@/api/client";
const API_URL = import.meta.env.VITE_API_BASE_URL;

import {
  KPICard,
  StatusPill,
  ProgressBar,
  ActivityTimeline,
  TechTag,
  InactivityBadge,
  Button,
  Modal,
  Toast,
  MilestoneStatusPill,
} from "@/components/ui";
import {
  FolderGit2,
  Clock,
  AlertTriangle,
  Eye,
  Plus,
  ExternalLink,
  GitBranch,
  Send,
  CheckCircle2,
  Award,
  Users,
  Calendar,
  Download,
  Filter,
  Terminal,
  Copy,
  ArrowUpRight,
  XCircle,
  Server,
  Webhook,
  FileText,
  BookOpen,
  Search,
  Upload,
  RefreshCw,
  ListChecks,
  MessageSquare,
} from "@/components/Icons";
import { User as UserIcon } from "lucide-react";
import { cn } from "@/utils/cn";

const GITEA_URL = getGiteaURL() || "https://gitea.example.com";

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("token");

  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// Shared styling class shortcuts
const card =
  "rounded-lg border border-neutral-200 dark:border-[#30363d] bg-white dark:bg-[#161b22]";
const cardHover =
  card + " hover:border-neutral-300 dark:hover:border-[#484f58] transition";
const kpiGrid = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5";
const mainGrid = "grid lg:grid-cols-3 gap-6 xl:gap-8";
const twoColGrid = "grid lg:grid-cols-2 gap-6 xl:gap-8";
const threeColGrid = "grid sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6";
const heading = "text-neutral-900 dark:text-[#f0f6fc]";
const subtext = "text-neutral-500 dark:text-[#8b949e]";
const mutedText = "text-neutral-400 dark:text-[#484f58]";
const bodyText = "text-neutral-600 dark:text-[#8b949e]";
const tableHead =
  "border-b border-neutral-100 dark:border-[#30363d] bg-neutral-50/50 dark:bg-[#161b22]";
const tableRow =
  "border-b border-neutral-50 dark:border-[#21262d] hover:bg-neutral-50/50 dark:hover:bg-[#21262d]/50 transition";
const thCell =
  "font-medium text-neutral-500 dark:text-[#484f58] text-xs uppercase tracking-wider";
const inputClass =
  "w-full rounded-md border border-neutral-300 dark:border-[#30363d] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#0d1117] text-neutral-900 dark:text-[#f0f6fc] placeholder:text-neutral-400 dark:placeholder:text-[#484f58]";
const selectClass =
  "w-full rounded-md border border-neutral-300 dark:border-[#30363d] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#0d1117] text-neutral-900 dark:text-[#f0f6fc]";
const sectionBorder = "border-b border-neutral-100 dark:border-[#30363d]";
const infoBox =
  "bg-neutral-50 dark:bg-[#0d1117] rounded-md border border-neutral-200 dark:border-[#30363d]";

// Loading Spinner component
function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 dark:border-[#30363d] border-t-blue-500" />
        <span className="text-sm text-neutral-500 dark:text-[#8b949e]">
          {text}
        </span>
      </div>
    </div>
  );
}

// Error display component
function ErrorDisplay({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span className="text-red-600 dark:text-red-400 text-xl">!</span>
          </div>
        </div>
        <p className="text-neutral-600 dark:text-[#8b949e] mb-3">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-neutral-100 dark:bg-[#21262d] flex items-center justify-center">
            <span className="text-neutral-400 dark:text-[#484f58] text-2xl">
              ∅
            </span>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-[#f0f6fc] mb-1">
          {title}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-[#8b949e] mb-4">
          {description}
        </p>
        {action}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STUDENT DASHBOARD
   ═══════════════════════════════════════════════════ */
export function StudentDashboard({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const [studentProjects, setStudentProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const projectsRes = await fetch(`${API_URL}/v1/projects/me`, {
          headers: getAuthHeaders(),
          cache: "no-store",
        });

        const activitiesRes = await fetch(`${API_URL}/v1/activities/me`, {
          headers: getAuthHeaders(),
          cache: "no-store",
        });
        const projectsData = await projectsRes.json();
        setStudentProjects(projectsData.data || []);

        if (activitiesRes.status !== 304) {
          const activitiesData = await activitiesRes.json();
          setActivities(activitiesData.data || []);
        }
      } catch (err) {
        console.error("Dashboard load failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn("text-2xl font-bold", heading)}>Dashboard</h1>
          <p className={cn("text-sm mt-0.5", subtext)}>
            Welcome back. Here&apos;s your project overview.
          </p>
        </div>
        <Button onClick={() => onNavigate("student-create-project")}>
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      <div className={kpiGrid}>
        <KPICard
          title="Active Projects"
          value={studentProjects.length}
          subtitle={`${studentProjects.filter((p) => p.status === "in-progress").length} in progress`}
          icon={<FolderGit2 className="h-5 w-5" />}
          color="blue"
        />
        <KPICard
          title="Upcoming Deadline"
          value={studentProjects[0]?.deadline || "None"}
          subtitle={studentProjects[0]?.title || "No active projects"}
          icon={<Calendar className="h-5 w-5" />}
          color="yellow"
        />
        <KPICard
          title="Last Push"
          value={
            activities[0]
              ? new Date(activities[0].createdAt).toLocaleDateString()
              : "—"
          }
          subtitle="recent update"
          icon={<Clock className="h-5 w-5" />}
          color="green"
        />
        <KPICard
          title="Pending Review"
          value={studentProjects.filter((p) => p.status === "submitted").length}
          subtitle="Milestones"
          icon={<Eye className="h-5 w-5" />}
          color="purple"
        />
      </div>

      <div className={mainGrid}>
        <div className={cn("lg:col-span-2", card)}>
          <div
            className={cn(
              "flex items-center justify-between p-5",
              sectionBorder,
            )}
          >
            <h2 className={cn("text-sm font-semibold", heading)}>
              My Projects
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("student-projects")}
            >
              View All <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={tableHead}>
                  <th className={cn("text-left py-3 px-5", thCell)}>Project</th>
                  <th className={cn("text-left py-3 px-3", thCell)}>Status</th>
                  <th
                    className={cn(
                      "text-left py-3 px-3 hidden md:table-cell",
                      thCell,
                    )}
                  >
                    Progress
                  </th>
                  <th
                    className={cn(
                      "text-left py-3 px-3 hidden sm:table-cell",
                      thCell,
                    )}
                  >
                    Last Push
                  </th>
                  <th className={cn("text-left py-3 px-3", thCell)}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentProjects.map((p) => (
                  <tr key={p._id} className={tableRow}>
                    <td className="py-3 px-5">
                      <p className={cn("font-medium", heading)}>{p.title}</p>
                      <p className={cn("text-xs", mutedText)}>
                        Prof. {typeof p.supervisor === "object" && p.supervisor !== null ? (p.supervisor as any).name : p.supervisor}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="py-3 px-3 hidden md:table-cell w-40">
                      <ProgressBar value={p.progress} />
                    </td>
                    <td className="py-3 px-3 hidden sm:table-cell">
                      <InactivityBadge lastPush={p.lastPush} />
                    </td>
                    <td className="py-3 px-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          localStorage.setItem("activeProjectId", p._id);
                          onNavigate("student-project-detail");
                        }}
                      >
                        <Eye className="h-4 w-4" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
                {studentProjects.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No projects found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={card}>
          <div className={cn("p-5", sectionBorder)}>
            <h2 className={cn("text-sm font-semibold", heading)}>
              Recent Activity
            </h2>
          </div>
          <div className="p-5">
            <ActivityTimeline activities={activities} limit={5} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STUDENT PROJECTS LIST
   ═══════════════════════════════════════════════════ */
export function StudentProjects({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const fetchProjects = async () => {
  //     try {
  //       const res = await fetch(`${API_URL}/v1/projects/me`, {
  //         headers: getAuthHeaders(),
  //       });
  //       setProjects(await res.json());
  //     } catch (err) {
  //       console.error("Failed to load projects", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchProjects();
  // }, []);
  useEffect(() => {
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/v1/projects/me`, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      setProjects(data.data || []);
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
    }
  };

  fetchProjects();
}, []);

  if (loading) return <LoadingSpinner text="Loading projects..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn("text-2xl font-bold", heading)}>My Projects</h1>
          <p className={cn("text-sm", subtext)}>
            Manage and track all your projects
          </p>
        </div>
        <Button onClick={() => onNavigate("student-create-project")}>
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      <div className="grid gap-4">
        {projects.map((p) => (
          <div
            key={p._id}
            className={cn(cardHover, "p-5 cursor-pointer")}
            onClick={() => {
              localStorage.setItem("activeProjectId", p._id);
              onNavigate("student-project-detail");
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={cn("text-base font-semibold", heading)}>
                    {p.title}
                  </h3>
                  <StatusPill status={p.status} />
                </div>
                <p className={cn("text-sm mb-3", subtext)}>{p.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {((p as any).technologies || p.techStack || []).map((t: string) => (
                    <TechTag key={t} label={t} />
                  ))}
                </div>
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-4 text-xs",
                    mutedText,
                  )}
                >
                  <span className="flex items-center gap-1">
                    <UserIcon className="h-3.5 w-3.5" /> {typeof p.supervisor === "object" && p.supervisor !== null ? (p.supervisor as any).name : p.supervisor}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Due: {(p as any).endDate
                      ? new Date((p as any).endDate).toLocaleDateString()
                      : p.deadline || "—"}
                  </span>
                  <InactivityBadge lastPush={p.lastPush} />
                  {(p as any).repoUrl && (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <GitBranch className="h-3.5 w-3.5" /> Repo linked
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full sm:w-48">
                <ProgressBar value={p.progress} />
              </div>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            No projects yet. Create your first one
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CREATE PROJECT
   ═══════════════════════════════════════════════════ */
export function CreateProject({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const [step, setStep] = useState(1);
  const [repoOption, setRepoOption] = useState<"create" | "link">("create");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [supervisors, setSupervisors] = useState<
    { _id: string; name: string }[]
  >([]);
  const [courses, setCourses] = useState<
    { _id: string; name: string; batch: string }[]
  >([]);
  const [repoName, setRepoName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    batch: "",
    supervisorId: "",
    techStack: [] as string[],
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      // const token = localStorage.getItem("token");
      console.log("API_URL:", API_URL);

      const [supRes, courseRes] = await Promise.all([
        fetch(`${API_URL}/v1/supervisors/allsupervisors`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_URL}/v1/courses/allcourses`, {
          headers: getAuthHeaders(),
        }),
      ]);

      console.log(localStorage.getItem("token"));
      const supData = await supRes.json();
      const courseData = await courseRes.json();

      setSupervisors(supData.data); // ✅ important
      setCourses(courseData.data);
    };

    fetchInitialData();
  }, []);

  const toggleTech = (tech: string) => {
    setFormData((f) => ({
      ...f,
      techStack: f.techStack.includes(tech)
        ? f.techStack.filter((t) => t !== tech)
        : [...f.techStack, tech],
    }));
  };

  const handleCreateProject = useCallback(async () => {
    setIsCreating(true);
    try {
      await dataService.createProject({
        title: formData.title,
        description: formData.description,
        courseId: formData.courseId,
        batch: formData.batch,
        course: formData.batch,
        supervisorId: formData.supervisorId,
        techStack: formData.techStack,
        repoOption: repoOption === "create" ? "create_new" : "link_existing",
        repoName: repoOption === "create" ? repoName : undefined,
        existingRepoUrl: repoOption === "link" ? repoUrl : undefined,
      });
      setShowSuccess(true);
      setTimeout(() => onNavigate("student-project-detail"), 1500);
    } finally {
      setIsCreating(false);
    }
  }, [formData, repoOption, repoName, repoUrl, onNavigate]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {showSuccess && (
        <Toast
          message="Project created successfully! Repository initialized."
          onClose={() => setShowSuccess(false)}
        />
      )}

      <div>
        <h1 className={cn("text-2xl font-bold", heading)}>
          Create New Project
        </h1>
        <p className={cn("text-sm mt-0.5", subtext)}>
          Set up your project and connect a Git repository
        </p>
      </div>

      <div className="flex items-center gap-2">
        {[
          { n: 1, label: "Details" },
          { n: 2, label: "Repository" },
          { n: 3, label: "Milestones" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition",
                step >= s.n
                  ? "bg-neutral-900 dark:bg-[#f0f6fc] text-white dark:text-[#0d1117]"
                  : "bg-neutral-100 dark:bg-[#21262d] text-neutral-400 dark:text-[#484f58]",
              )}
            >
              {s.n}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                step >= s.n ? heading : mutedText,
              )}
            >
              {s.label}
            </span>
            {i < 2 && (
              <div
                className={cn(
                  "w-8 h-px",
                  step > s.n
                    ? "bg-neutral-400 dark:bg-[#8b949e]"
                    : "bg-neutral-200 dark:bg-[#30363d]",
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className={cn(card, "p-6")}>
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label
                className={cn("block text-sm font-medium mb-1.5", heading)}
              >
                Project Title *
              </label>
              <input
                value={formData.title}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Enter project title"
                className={inputClass}
              />
            </div>
            <div>
              <label
                className={cn("block text-sm font-medium mb-1.5", heading)}
              >
                Description *
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Describe your project..."
                className={inputClass}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label
                  className={cn("block text-sm font-medium mb-1.5", heading)}
                >
                  Batch / Course
                </label>
                <select
                  className={selectClass}
                  value={formData.courseId}
                  onChange={(e) => {
                    const course = courses.find(
                      (c) => c._id === e.target.value,
                    );
                    setFormData((f) => ({
                      ...f,
                      courseId: e.target.value,
                      batch: course?.batch || "",
                    }));
                  }}
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.batch})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className={cn("block text-sm font-medium mb-1.5", heading)}
                >
                  Supervisor
                </label>
                <select
                  className={selectClass}
                  value={formData.supervisorId}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, supervisorId: e.target.value }))
                  }
                >
                  <option value="">Select Supervisor</option>
                  {supervisors.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label
                className={cn("block text-sm font-medium mb-1.5", heading)}
              >
                Tech Stack
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  "React",
                  "Node.js",
                  "MongoDB",
                  "Express",
                  "Python",
                  "Django",
                  "Vue.js",
                  "Angular",
                  "PostgreSQL",
                  "MySQL",
                ].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTech(t)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs font-medium transition",
                      formData.techStack.includes(t)
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-neutral-200 dark:border-[#30363d] text-neutral-600 dark:text-[#8b949e] hover:bg-blue-50 dark:hover:bg-blue-900/30",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)}>
                Next: Repository Setup <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h3 className={cn("text-base font-semibold", heading)}>
              Repository Setup
            </h3>
            <p className={cn("text-sm", subtext)}>
              Connect your project to a Git repository on the institute Gitea
              server.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => setRepoOption("create")}
                className={cn(
                  "rounded-lg border-2 p-5 text-left transition",
                  repoOption === "create"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-neutral-200 dark:border-[#30363d] hover:border-neutral-300 dark:hover:border-[#484f58]",
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className={cn("font-semibold", heading)}>
                    Create New Repo
                  </span>
                </div>
                <p className={cn("text-xs", subtext)}>
                  Create a new private repository on institute Gitea server
                </p>
              </button>
              <button
                onClick={() => setRepoOption("link")}
                className={cn(
                  "rounded-lg border-2 p-5 text-left transition",
                  repoOption === "link"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-neutral-200 dark:border-[#30363d] hover:border-neutral-300 dark:hover:border-[#484f58]",
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className={cn("font-semibold", heading)}>
                    Link Existing Repo
                  </span>
                </div>
                <p className={cn("text-xs", subtext)}>
                  Link an existing repository from your Gitea account
                </p>
              </button>
            </div>

            {repoOption === "create" && (
              <div className={cn("space-y-3 p-4", infoBox)}>
                <div>
                  <label
                    className={cn("block text-sm font-medium mb-1", heading)}
                  >
                    Repository Name
                  </label>
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="e.g. ecommerce-platform"
                    className={inputClass}
                  />
                </div>
                <div className={cn("flex items-center gap-2 text-xs", subtext)}>
                  <Server className="h-3.5 w-3.5" />
                  <span>
                    Will be created at: {GITEA_URL.replace(/^https?:\/\//, "")}
                    /username/{repoName || "project"}
                  </span>
                </div>
              </div>
            )}

            {repoOption === "link" && (
              <div className={cn("space-y-3 p-4", infoBox)}>
                <div>
                  <label
                    className={cn("block text-sm font-medium mb-1", heading)}
                  >
                    Repository URL
                  </label>
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://gitea.ignou.local/username/repo"
                    className={inputClass}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-between pt-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next: Milestones <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h3 className={cn("text-base font-semibold", heading)}>
              Milestone Plan
            </h3>
            <p className={cn("text-sm", subtext)}>
              Define key milestones for your project (you can add more later).
            </p>
            <div className="space-y-3">
              {[
                "Project Setup & Database Design",
                "Core Features Implementation",
                "Testing & Documentation",
                "Final Submission",
              ].map((m, i) => (
                <div
                  key={m}
                  className={cn("flex items-center gap-3 px-4 py-3", infoBox)}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 dark:bg-[#30363d] text-xs font-bold text-neutral-600 dark:text-[#c9d1d9]">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    defaultValue={m}
                    className={cn(
                      "flex-1 text-sm bg-transparent outline-none",
                      heading,
                    )}
                  />
                  <input
                    type="date"
                    className={cn(
                      "text-xs bg-transparent outline-none border border-neutral-200 dark:border-[#30363d] rounded px-2 py-1",
                      subtext,
                    )}
                  />
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" /> Add Milestone
            </Button>
            <div className="flex justify-between pt-2">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleCreateProject} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Create Project
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {step === 2 && repoOption === "create" && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
            <Terminal className="h-4 w-4" /> After creation — Push your code
          </h4>
          <div className="bg-neutral-900 rounded-md p-4 text-sm font-mono text-neutral-300 space-y-1 overflow-x-auto">
            <p>
              <span className="text-green-400">$</span> git clone {GITEA_URL}
              /username/{repoName || "project"}.git
            </p>
            <p>
              <span className="text-green-400">$</span> cd{" "}
              {repoName || "project"}
            </p>
            <p>
              <span className="text-green-400">$</span> git add . && git commit
              -m &quot;initial commit&quot;
            </p>
            <p>
              <span className="text-green-400">$</span> git push origin main
            </p>
          </div>
          <button className="mt-3 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
            <Copy className="h-3.5 w-3.5" /> Copy clone URL
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PROJECT DETAIL (STUDENT VIEW)
   ═══════════════════════════════════════════════════ */
export function StudentProjectDetail({
  onNavigate: _onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const [tab, setTab] = useState<
    "overview" | "milestones" | "progress" | "files" | "feedback"
  >("overview");
  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const projectId = localStorage.getItem("activeProjectId");

  useEffect(() => {
    const fetchProjectDetail = async () => {
      try {
        const token = localStorage.getItem("token");
        const [projectRes, milestoneRes, filesRes] = await Promise.all([
          fetch(`${API_URL}/v1/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/v1/projects/${projectId}/milestones`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/v1/projects/${projectId}/files`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const projectData = await projectRes.json();
        setProject(projectData.data || projectData);

        const milestoneData = await milestoneRes.json();
        setMilestones(Array.isArray(milestoneData.data) ? milestoneData.data : Array.isArray(milestoneData) ? milestoneData : []);

        const filesData = await filesRes.json();
        setFiles(Array.isArray(filesData.data) ? filesData.data : Array.isArray(filesData) ? filesData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectDetail();
  }, [projectId]);

  if (loading || !project) return <LoadingSpinner text="Loading project..." />;

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "milestones" as const, label: "Milestones" },
    { id: "progress" as const, label: "Progress" },
    { id: "files" as const, label: "Files" },
    { id: "feedback" as const, label: "Feedback" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className={cn("text-2xl font-bold", heading)}>
              {project.title}
            </h1>
            <StatusPill status={project.status} />
          </div>
          <p className={cn("text-sm", subtext)}>{project.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <RefreshCw className="h-4 w-4" /> Update Progress
          </Button>
          <Button size="sm">
            <Send className="h-4 w-4" /> Submit Final
          </Button>
        </div>
      </div>

      <div className="border-b border-neutral-200 dark:border-[#30363d]">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition",
                tab === t.id
                  ? "border-orange-500 text-neutral-900 dark:text-[#f0f6fc]"
                  : "border-transparent text-neutral-500 dark:text-[#8b949e] hover:text-neutral-700 dark:hover:text-[#c9d1d9] hover:border-neutral-300 dark:hover:border-[#484f58]",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "overview" && (
        <div className={cn(mainGrid)}>
          <div className="lg:col-span-2 space-y-6">
            <div className={cn(card, "p-5")}>
              <h3 className={cn("font-semibold mb-4", heading)}>
                Project Information
              </h3>
              <dl className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className={cn("mb-0.5", mutedText)}>Supervisor</dt>
                  <dd className={cn("font-medium", heading)}>
                    {project.supervisor?.name || project.supervisor}
                  </dd>
                </div>
                <div>
                  <dt className={cn("mb-0.5", mutedText)}>Batch</dt>
                  <dd className={cn("font-medium", heading)}>
                    {typeof project.batch === "object" && project.batch !== null ? (project.batch as any).name : project.batch || "—"}
                  </dd>
                </div>
                <div>
                  <dt className={cn("mb-0.5", mutedText)}>Deadline</dt>
                  <dd className={cn("font-medium", heading)}>
                    {project.endDate
                      ? new Date(project.endDate).toLocaleDateString()
                      : project.deadline || "—"}
                  </dd>
                </div>
                <div>
                  <dt className={cn("mb-0.5", mutedText)}>Created</dt>
                  <dd className={cn("font-medium", heading)}>
                    {project.createdAt
                      ? new Date(project.createdAt).toLocaleDateString()
                      : "—"}
                  </dd>
                </div>
              </dl>
              <div className="mt-4">
                <dt className={cn("text-sm mb-1", mutedText)}>Tech Stack</dt>
                <div className="flex flex-wrap gap-1.5">
                  {(project.technologies || project.techStack || []).map((t: string) => (
                    <TechTag key={t} label={t} />
                  ))}
                </div>
              </div>
            </div>
            <div className={cn(card, "p-5")}>
              <h3 className={cn("font-semibold mb-3", heading)}>Repository</h3>
              {project.repoUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                    <GitBranch className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Connected
                    </span>
                  </div>
                  <div className={cn("flex items-center gap-2 p-3", infoBox)}>
                    <code
                      className={cn(
                        "text-xs flex-1 overflow-hidden text-ellipsis font-mono",
                        bodyText,
                      )}
                    >
                      {project.repoUrl}
                    </code>
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                  <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
                  <span className="text-sm text-red-600 dark:text-red-400">
                    Repository not linked
                  </span>
                  <Button variant="danger" size="sm" className="ml-auto">
                    Link Now
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <div className={cn(card, "p-5")}>
              <h3 className={cn("font-semibold mb-3", heading)}>Progress</h3>
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <svg className="h-28 w-28 -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-neutral-100 dark:text-[#21262d]"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="#2da44e"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(project.progress || 0) * 3.01} ${301 - (project.progress || 0) * 3.01}`}
                    />
                  </svg>
                  <span
                    className={cn(
                      "absolute inset-0 flex items-center justify-center text-2xl font-bold",
                      heading,
                    )}
                  >
                    {project.progress || 0}%
                  </span>
                </div>
              </div>
            </div>
            <div className={cn(card, "p-5")}>
              <h3 className={cn("font-semibold mb-3", heading)}>
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Upload className="h-4 w-4" /> Upload Document
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                >
                  <ListChecks className="h-4 w-4" /> Update Milestone
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Send className="h-4 w-4" /> Submit for Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "milestones" && (
        <div className={card}>
          <div
            className={cn(
              "p-5 flex items-center justify-between",
              sectionBorder,
            )}
          >
            <h3 className={cn("font-semibold", heading)}>Milestones</h3>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-[#21262d]">
            {milestones.map((m, i) => (
              <div
                key={m._id}
                className="flex items-start gap-4 p-5 hover:bg-neutral-50 dark:hover:bg-[#21262d]/50 transition"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    m.status === "approved"
                      ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
                      : m.status === "in-progress"
                        ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                        : "bg-neutral-100 dark:bg-[#21262d] text-neutral-400 dark:text-[#484f58]",
                  )}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={cn("text-sm font-semibold", heading)}>
                      {m.title}
                    </h4>
                    <MilestoneStatusPill status={m.status || "draft"} />
                  </div>
                  <p className={cn("text-xs mb-1", subtext)}>{m.description}</p>
                  <div
                    className={cn("flex items-center gap-3 text-xs", mutedText)}
                  >
                    {m.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {m.dueDate}
                      </span>
                    )}
                  </div>
                </div>
                {m.status === "in-progress" && (
                  <Button size="sm" variant="secondary">
                    Mark Complete
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "progress" && (
        <div className={cn(twoColGrid)}>
          <div className={cn(card, "p-5")}>
            <h3 className={cn("font-semibold mb-4", heading)}>
              Weekly Commit Activity
            </h3>
            <div className="flex items-end gap-2 h-40">
              {[3, 7, 5, 12, 8, 15, 6, 10, 4, 9, 11, 3].map((v, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600"
                    style={{ height: `${(v / 15) * 100}%` }}
                  />
                  <span className={cn("text-[9px]", mutedText)}>W{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={cn(card, "p-5")}>
            <h3 className={cn("font-semibold mb-4", heading)}>
              Recent Commits
            </h3>
            <div className="space-y-3">
              <div className="text-center text-sm text-neutral-500">
                Commits synced via Gitea
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "files" && (
        <div className={card}>
          <div
            className={cn(
              "p-5 flex items-center justify-between",
              sectionBorder,
            )}
          >
            <h3 className={cn("font-semibold", heading)}>Uploaded Documents</h3>
            <Button size="sm">
              <Upload className="h-4 w-4" /> Upload File
            </Button>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-[#21262d]">
            {files.map((f) => (
              <div
                key={f._id}
                className="flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-[#21262d]/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className={cn("text-sm font-medium", heading)}>{f.name}</p>
                  <p className={cn("text-xs", mutedText)}>{f.size}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {files.length === 0 && (
              <div className="p-6 text-center text-sm text-neutral-500">
                No files uploaded yet
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "feedback" && <FeedbackThread projectId={project._id} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STUDENT SUBMISSIONS
   ═══════════════════════════════════════════════════ */
export function StudentSubmissions({
  onNavigate: _onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/v1/me/submissions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch submissions");
        const json = await res.json();
        setSubmissions(Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []);
      } catch (err) {
        console.error("Submissions load failed", err);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  if (loading) return <LoadingSpinner text="Loading submissions..." />;

  return (
    <div className="space-y-6">
      <h1 className={cn("text-2xl font-bold", heading)}>Submissions</h1>
      <div className={card}>
        <div className="divide-y divide-neutral-100 dark:divide-[#21262d]">
          {submissions.map((s) => (
            <div
              key={s._id}
              className="flex items-center gap-4 p-5 hover:bg-neutral-50 dark:hover:bg-[#21262d]/50"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  s.status === "approved"
                    ? "bg-green-100 dark:bg-green-900/40"
                    : s.status === "in-progress"
                      ? "bg-yellow-100 dark:bg-yellow-900/40"
                      : "bg-red-100 dark:bg-red-900/40",
                )}
              >
                {s.status === "approved" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                )}
              </div>
              <div className="flex-1">
                <p className={cn("text-sm font-medium", heading)}>{s.title}</p>
                <p className={cn("text-xs", mutedText)}>
                  {s.projectTitle} ·{" "}
                  {new Date(s.submittedAt).toLocaleDateString()}
                </p>
              </div>
              <StatusPill status={s.status} />
            </div>
          ))}
          {submissions.length === 0 && (
            <div className="p-6 text-center text-sm text-neutral-500">
              No submissions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SUPERVISOR DASHBOARD
   ═══════════════════════════════════════════════════ */
export function SupervisorDashboard({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const [projects, setProjects] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("token");
      const [projectsRes, activitiesRes] = await Promise.all([
        fetch(`${API_URL}/v1/projects/supervised`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/v1/activities/supervisor`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setProjects(await projectsRes.json());
      setActivities(await activitiesRes.json());
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn("text-2xl font-bold", heading)}>Dashboard</h1>
        <p className={cn("text-sm", subtext)}>
          Welcome back. Here&apos;s your supervision overview.
        </p>
      </div>

      <div className={kpiGrid}>
        <KPICard
          title="Projects Supervised"
          value={projects.length}
          subtitle="Active students"
          icon={<FolderGit2 className="h-5 w-5" />}
          color="blue"
        />
        <KPICard
          title="Needs Review"
          value={projects.filter((p) => p.needsReview).length}
          subtitle="Pending submissions"
          icon={<Eye className="h-5 w-5" />}
          color="yellow"
        />
        <KPICard
          title="Inactive > 7 days"
          value={projects.filter((p) => p.inactiveDays > 7).length}
          subtitle="No recent commits"
          icon={<AlertTriangle className="h-5 w-5" />}
          color="red"
        />
        <KPICard
          title="Upcoming Deadlines"
          value={projects.filter((p) => p.upcomingDeadline).length}
          subtitle="Next 2 weeks"
          icon={<Calendar className="h-5 w-5" />}
          color="purple"
        />
      </div>

      <div className={mainGrid}>
        <div className="lg:col-span-2">
          <div className={card}>
            <div
              className={cn(
                "flex items-center justify-between p-5",
                sectionBorder,
              )}
            >
              <h2 className={cn("text-sm font-semibold", heading)}>
                Supervised Projects
              </h2>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" /> Filter
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={tableHead}>
                    <th className={cn("text-left py-3 px-5", thCell)}>
                      Student / Project
                    </th>
                    <th className={cn("text-left py-3 px-3", thCell)}>
                      Status
                    </th>
                    <th
                      className={cn(
                        "text-left py-3 px-3 hidden md:table-cell",
                        thCell,
                      )}
                    >
                      Progress
                    </th>
                    <th
                      className={cn(
                        "text-left py-3 px-3 hidden sm:table-cell",
                        thCell,
                      )}
                    >
                      Last Push
                    </th>
                    <th className={cn("text-left py-3 px-3", thCell)}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p._id} className={tableRow}>
                      <td className="py-3 px-5">
                        <p className={cn("font-medium", heading)}>{p.title}</p>
                        <p className={cn("text-xs", mutedText)}>
                          {p.student?.name} · {p.batch}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <StatusPill status={p.status} />
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell w-36">
                        <ProgressBar value={p.progress} size="sm" />
                      </td>
                      <td className="py-3 px-3 hidden sm:table-cell">
                        <InactivityBadge lastPush={p.lastPush} />
                      </td>
                      <td className="py-3 px-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            localStorage.setItem("activeProjectId", p._id);
                            onNavigate("supervisor-project-detail");
                          }}
                        >
                          <Eye className="h-4 w-4" /> Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {projects.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 text-center text-muted-foreground"
                      >
                        No supervised projects
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={card}>
          <div className={cn("p-5", sectionBorder)}>
            <h2 className={cn("text-sm font-semibold", heading)}>
              Activity Feed
            </h2>
          </div>
          <div className="p-5">
            <ActivityTimeline activities={activities} limit={5} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SUPERVISOR PROJECT DETAIL
   ═══════════════════════════════════════════════════ */
export function SupervisorProjectDetail({
  onNavigate: _onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const [tab, setTab] = useState<
    "summary" | "activity" | "milestones" | "files" | "grade"
  >("summary");
  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const projectId = localStorage.getItem("activeProjectId");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const [projectRes, milestoneRes, activityRes, filesRes, commentsRes] =
        await Promise.all([
          fetch(`${API_URL}/v1/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/v1/projects/${projectId}/milestones`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/v1/projects/${projectId}/activities`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/v1/projects/${projectId}/files`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/v1/projects/${projectId}/comments`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
      setProject(await projectRes.json());
      setMilestones(await milestoneRes.json());
      setActivities(await activityRes.json());
      setFiles(await filesRes.json());
      setComments(await commentsRes.json());
      setLoading(false);
    };
    fetchData();
  }, [projectId]);

  if (loading || !project) return <LoadingSpinner text="Loading project..." />;

  const tabs = [
    { id: "summary" as const, label: "Summary" },
    { id: "activity" as const, label: "Activity" },
    { id: "milestones" as const, label: "Milestones Review" },
    { id: "files" as const, label: "Files" },
    { id: "grade" as const, label: "Grade & Feedback" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className={cn("text-2xl font-bold", heading)}>
              {project.title}
            </h1>
            <StatusPill status={project.status} />
          </div>
          <p className={cn("text-sm", subtext)}>
            Student: {project.student?.name} · {project.batch}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm">
            <Terminal className="h-4 w-4" /> Clone
          </Button>
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" /> Download ZIP
          </Button>
          <Button variant="danger" size="sm">
            <XCircle className="h-4 w-4" /> Request Changes
          </Button>
          <Button variant="success" size="sm">
            <CheckCircle2 className="h-4 w-4" /> Approve
          </Button>
        </div>
      </div>

      <div className="border-b border-neutral-200 dark:border-[#30363d]">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition",
                tab === t.id
                  ? "border-orange-500 text-neutral-900 dark:text-[#f0f6fc]"
                  : "border-transparent text-neutral-500 dark:text-[#8b949e] hover:text-neutral-700 dark:hover:text-[#c9d1d9]",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "summary" && (
        <div className={cn(mainGrid)}>
          <div className="lg:col-span-2 space-y-4">
            <div className={cn(card, "p-5")}>
              <h3 className={cn("font-semibold mb-3", heading)}>
                Project Details
              </h3>
              <p className={cn("text-sm mb-4", bodyText)}>
                {project.description}
              </p>
              <dl className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className={cn("mb-0.5", mutedText)}>Student</dt>
                  <dd className={cn("font-medium", heading)}>
                    {project.student?.name}
                  </dd>
                </div>
                <div>
                  <dt className={cn("mb-0.5", mutedText)}>Batch</dt>
                  <dd className={cn("font-medium", heading)}>
                    {project.batch}
                  </dd>
                </div>
                <div>
                  <dt className={cn("mb-0.5", mutedText)}>Deadline</dt>
                  <dd className={cn("font-medium", heading)}>
                    {project.deadline}
                  </dd>
                </div>
                <div>
                  <dt className={cn("mb-0.5", mutedText)}>Last Updated</dt>
                  <dd className={cn("font-medium", heading)}>
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
              <div className="mt-4">
                <dt className={cn("text-sm mb-1", mutedText)}>Tech Stack</dt>
                <div className="flex flex-wrap gap-1.5">
                  {project.techStack?.map((t: string) => (
                    <TechTag key={t} label={t} />
                  ))}
                </div>
              </div>
            </div>
            <div className={cn(card, "p-5")}>
              <h3 className={cn("font-semibold mb-3", heading)}>Repository</h3>
              <div className={cn("flex items-center gap-2 p-3", infoBox)}>
                <GitBranch className="h-4 w-4 text-green-600 dark:text-green-400" />
                <code
                  className={cn(
                    "text-xs flex-1 overflow-hidden text-ellipsis font-mono",
                    bodyText,
                  )}
                >
                  {project.repoUrl || "No repo linked"}
                </code>
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div>
            <div className={cn(card, "p-5")}>
              <h3 className={cn("font-semibold mb-3", heading)}>Progress</h3>
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <svg className="h-28 w-28 -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-neutral-100 dark:text-[#21262d]"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="#2da44e"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(project.progress || 0) * 3.01} ${301 - (project.progress || 0) * 3.01}`}
                    />
                  </svg>
                  <span
                    className={cn(
                      "absolute inset-0 flex items-center justify-center text-2xl font-bold",
                      heading,
                    )}
                  >
                    {project.progress || 0}%
                  </span>
                </div>
              </div>
              <InactivityBadge lastPush={project.lastPush} />
            </div>
          </div>
        </div>
      )}

      {tab === "activity" && (
        <div className={cn(card, "p-5")}>
          <h3 className={cn("font-semibold mb-4", heading)}>
            Commit / Push Timeline
          </h3>
          <ActivityTimeline activities={activities} />
        </div>
      )}

      {tab === "milestones" && (
        <div
          className={cn(
            card,
            "divide-y divide-neutral-100 dark:divide-[#21262d]",
          )}
        >
          {milestones.map((m, i) => (
            <div key={m._id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-[#21262d] text-xs font-bold text-neutral-500 dark:text-[#8b949e]">
                    {i + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className={cn("text-sm font-semibold", heading)}>
                        {m.title}
                      </h4>
                      <MilestoneStatusPill status={m.status || "draft"} />
                    </div>
                    <p className={cn("text-xs", subtext)}>{m.description}</p>
                    {m.dueDate && (
                      <p
                        className={cn(
                          "text-xs mt-1 flex items-center gap-1",
                          mutedText,
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        Due: {m.dueDate}
                      </p>
                    )}
                  </div>
                </div>
                {(m.status === "completed" || m.status === "in-progress") && (
                  <div className="flex gap-2">
                    <Button variant="success" size="sm">
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                    <Button variant="danger" size="sm">
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "files" && (
        <div className={card}>
          <div
            className={cn(
              "p-5 flex items-center justify-between",
              sectionBorder,
            )}
          >
            <h3 className={cn("font-semibold", heading)}>Student Files</h3>
            <Button variant="secondary" size="sm">
              <Download className="h-4 w-4" /> Download All
            </Button>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-[#21262d]">
            {files.map((f) => (
              <div
                key={f._id}
                className="flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-[#21262d]/50"
              >
                <FileText className="h-5 w-5 text-red-500 dark:text-red-400" />
                <div className="flex-1">
                  <p className={cn("text-sm font-medium", heading)}>{f.name}</p>
                  <p className={cn("text-xs", mutedText)}>{f.size}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {files.length === 0 && (
              <div className="p-6 text-center text-sm text-neutral-500">
                No files uploaded yet
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "grade" && (
        <div className={cn(twoColGrid)}>
          <div className={cn(card, "p-5")}>
            <h3 className={cn("font-semibold mb-4", heading)}>
              Rubric Scoring
            </h3>
            <div className="space-y-4">
              {[
                { criterion: "Code Quality", max: 25 },
                { criterion: "Functionality", max: 30 },
                { criterion: "Documentation", max: 15 },
                { criterion: "Presentation", max: 10 },
                { criterion: "Innovation", max: 20 },
              ].map((r) => (
                <div key={r.criterion} className="flex items-center gap-4">
                  <label className={cn("text-sm w-32", bodyText)}>
                    {r.criterion}
                  </label>
                  <input
                    type="number"
                    max={r.max}
                    placeholder={`/ ${r.max}`}
                    className={cn(inputClass, "!w-20 text-center")}
                  />
                  <span className={cn("text-xs", mutedText)}>/ {r.max}</span>
                </div>
              ))}
              <div className="flex items-center gap-4 pt-3 border-t border-neutral-200 dark:border-[#30363d]">
                <label className={cn("text-sm font-bold w-32", heading)}>
                  Total
                </label>
                <span className={cn("text-lg font-bold", heading)}>
                  — / 100
                </span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="success"
                onClick={async () => {
                  try {
                    await dataService.approveProject(
                      project._id,
                      "85",
                      "Good work",
                    );
                    alert("Grade submitted!");
                  } catch {
                    /* handled */
                  }
                }}
              >
                <Award className="h-4 w-4" /> Submit Grade
              </Button>
            </div>
          </div>
          <div className={card}>
            <div className={cn("p-5", sectionBorder)}>
              <h3 className={cn("font-semibold", heading)}>Feedback</h3>
            </div>
            <div className="p-5 space-y-3 max-h-64 overflow-auto">
              {comments.map((c) => (
                <div key={c._id} className={cn("p-3 rounded-md", infoBox)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-xs font-semibold", heading)}>
                      {c.user?.name || c.user}
                    </span>
                    <span className={cn("text-xs", mutedText)}>
                      {new Date(c.createdAt || c.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className={cn("text-sm", bodyText)}>{c.message}</p>
                </div>
              ))}
            </div>
            <div
              className={cn(
                "p-5 flex gap-2 border-t border-neutral-100 dark:border-[#30363d]",
              )}
            >
              <input
                type="text"
                placeholder="Add feedback..."
                className={inputClass}
              />
              <Button>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SUPERVISOR REVIEWS
   ═══════════════════════════════════════════════════ */
export function SupervisorReviews({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/v1/supervisors/milestones/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(await res.json());
      setLoading(false);
    };
    fetchReviews();
  }, []);

  if (loading) return <LoadingSpinner text="Loading reviews..." />;

  return (
    <div className="space-y-6">
      <h1 className={cn("text-2xl font-bold", heading)}>Pending Reviews</h1>
      <div
        className={cn(
          card,
          "divide-y divide-neutral-100 dark:divide-[#21262d]",
        )}
      >
        {reviews.map((r) => (
          <div
            key={r._id}
            className="flex items-center gap-4 p-5 hover:bg-neutral-50 dark:hover:bg-[#21262d]/50 transition cursor-pointer"
            onClick={() => {
              localStorage.setItem("activeProjectId", r.projectId);
              onNavigate("supervisor-project-detail");
            }}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white",
                r.urgent ? "bg-yellow-500" : "bg-blue-500",
              )}
            >
              {r.studentName
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="flex-1">
              <p className={cn("text-sm font-medium", heading)}>
                {r.studentName} — {r.type}
              </p>
              <p className={cn("text-xs", mutedText)}>
                {r.projectTitle} · {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </div>
            {r.urgent && (
              <span className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2.5 py-0.5 text-xs font-medium">
                Urgent
              </span>
            )}
            <Button variant="secondary" size="sm">
              <Eye className="h-4 w-4" /> Review
            </Button>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="p-6 text-center text-sm text-neutral-500">
            No pending reviews 🎉
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SUPERVISOR GRADES
   ═══════════════════════════════════════════════════ */
export function SupervisorGrades({
  onNavigate: _onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/v1/supervisors/grades`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGrades(await res.json());
      setLoading(false);
    };
    fetchGrades();
  }, []);

  if (loading) return <LoadingSpinner text="Loading grades..." />;

  return (
    <div className="space-y-6">
      <h1 className={cn("text-2xl font-bold", heading)}>Grades</h1>
      <div className={cn(card, "overflow-hidden")}>
        <table className="w-full text-sm">
          <thead>
            <tr className={tableHead}>
              <th className={cn("text-left py-3 px-5", thCell)}>Student</th>
              <th className={cn("text-left py-3 px-3", thCell)}>Project</th>
              <th className={cn("text-left py-3 px-3", thCell)}>Score</th>
              <th className={cn("text-left py-3 px-3", thCell)}>Grade</th>
              <th className={cn("text-left py-3 px-3", thCell)}>Status</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g) => (
              <tr key={g._id} className={tableRow}>
                <td className={cn("py-3 px-5 font-medium", heading)}>
                  {g.studentName}
                </td>
                <td className={cn("py-3 px-3", bodyText)}>{g.projectTitle}</td>
                <td className={cn("py-3 px-3 font-bold", heading)}>
                  {g.score !== undefined ? `${g.score}/100` : "—"}
                </td>
                <td className="py-3 px-3">
                  {g.grade ? (
                    <span className="rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-0.5 text-xs font-bold">
                      {g.grade}
                    </span>
                  ) : (
                    <span className={mutedText}>—</span>
                  )}
                </td>
                <td className="py-3 px-3">
                  <StatusPill status={g.status} />
                </td>
              </tr>
            ))}
            {grades.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 text-center text-sm text-neutral-500"
                >
                  No grades available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ADMIN DASHBOARD
   ═══════════════════════════════════════════════════ */
export function AdminDashboard({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("token");
      const [statsRes, activityRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/v1/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/v1/activities/admin`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/v1/admin/milestones/getProjectMilestones`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setStats(await statsRes.json());
      setActivities(await activityRes.json());
      setStatusBreakdown(await statusRes.json());
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  if (loading || !stats) return <LoadingSpinner text="Loading dashboard..." />;

  // Try mapping dynamic breakdown or use generic stats mapping
  const activeProjectsList =
    statusBreakdown && statusBreakdown.length > 0
      ? statusBreakdown
      : [
          {
            label: "Draft",
            count: stats.activeProjects - stats.inProgress,
            color: "bg-neutral-400",
            pct: 20,
          },
          {
            label: "In Progress",
            count: stats.inProgress,
            color: "bg-blue-500",
            pct: 60,
          },
          {
            label: "Approved",
            count: stats.activeProjects > 0 ? 1 : 0,
            color: "bg-green-500",
            pct: 20,
          },
        ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn("text-2xl font-bold", heading)}>Admin Dashboard</h1>
        <p className={cn("text-sm", subtext)}>System overview and management</p>
      </div>

      <div className={kpiGrid}>
        <KPICard
          title="Total Users"
          value={stats.totalUsers}
          subtitle={`${stats.students} students, ${stats.supervisors} supervisors`}
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        <KPICard
          title="Active Projects"
          value={stats.activeProjects}
          subtitle={`${stats.inProgress} in progress`}
          icon={<FolderGit2 className="h-5 w-5" />}
          color="purple"
        />
        <KPICard
          title="Gitea Status"
          value={stats.giteaStatus}
          subtitle={stats.giteaHost}
          icon={<Server className="h-5 w-5" />}
          color="green"
        />
        <KPICard
          title="Pending Reviews"
          value={stats.pendingReviews}
          subtitle="Needs attention"
          icon={<Eye className="h-5 w-5" />}
          color="yellow"
        />
      </div>

      <div className={twoColGrid}>
        <div className={card}>
          <div
            className={cn(
              "p-5 flex items-center justify-between",
              sectionBorder,
            )}
          >
            <h2 className={cn("text-sm font-semibold", heading)}>
              Recent Activity
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("admin-audit-logs")}
            >
              View Logs <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="p-5">
            <ActivityTimeline activities={activities} limit={6} />
          </div>
        </div>

        <div className="space-y-6">
          <div className={cn(card, "p-5")}>
            <h2 className={cn("text-sm font-semibold mb-4", heading)}>
              Projects by Status
            </h2>
            <div className="space-y-3">
              {activeProjectsList.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={cn("text-xs w-20", bodyText)}>
                    {s.label || s._id}
                  </span>
                  <div className="flex-1 h-2 bg-neutral-100 dark:bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        s.color || "bg-blue-500",
                      )}
                      style={{ width: `${s.pct || 30}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium w-6 text-right",
                      heading,
                    )}
                  >
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={cn(card, "p-5")}>
            <h2 className={cn("text-sm font-semibold mb-3", heading)}>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="justify-start"
                onClick={() => onNavigate("admin-users")}
              >
                <Users className="h-4 w-4" /> Manage Users
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="justify-start"
                onClick={() => onNavigate("admin-batches")}
              >
                <BookOpen className="h-4 w-4" /> Batches
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="justify-start"
                onClick={() => onNavigate("admin-gitea-settings")}
              >
                <Server className="h-4 w-4" /> Gitea Config
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="justify-start"
                onClick={() => onNavigate("admin-audit-logs")}
              >
                <FileText className="h-4 w-4" /> Audit Logs
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ADMIN USERS
   ═══════════════════════════════════════════════════ */
export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "student",
    department: "",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/v1/users/getAllUsers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(await res.json());
      setLoading(false);
    };
    fetchUsers();
  }, []);

  if (loading) return <LoadingSpinner text="Loading users..." />;

  return (
    <div className="space-y-6">
      {showModal && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Add New User"
        >
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label
                  className={cn("block text-sm font-medium mb-1", heading)}
                >
                  Full Name
                </label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  className={cn("block text-sm font-medium mb-1", heading)}
                >
                  Email
                </label>
                <input
                  className={inputClass}
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label
                  className={cn("block text-sm font-medium mb-1", heading)}
                >
                  Role
                </label>
                <select
                  className={selectClass}
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value }))
                  }
                >
                  <option value="student">Student</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label
                  className={cn("block text-sm font-medium mb-1", heading)}
                >
                  Department
                </label>
                <input
                  className={inputClass}
                  value={form.department}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, department: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowModal(false)}>Create User</Button>
            </div>
          </div>
        </Modal>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn("text-2xl font-bold", heading)}>User Management</h1>
          <p className={cn("text-sm", subtext)}>{users.length} total users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> Add User
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 rounded-md border border-neutral-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-1.5 flex-1 min-w-[200px]">
          <Search className={cn("h-4 w-4", mutedText)} />
          <input
            type="text"
            placeholder="Search users..."
            className={cn(
              "bg-transparent text-sm outline-none w-full",
              heading,
            )}
          />
        </div>
        <Button variant="ghost" size="sm">
          <Filter className="h-4 w-4" /> Filters
        </Button>
      </div>

      <div className={cn(card, "overflow-hidden")}>
        <table className="w-full text-sm">
          <thead>
            <tr className={tableHead}>
              <th className={cn("text-left py-3 px-5", thCell)}>Name</th>
              <th
                className={cn(
                  "text-left py-3 px-3 hidden sm:table-cell",
                  thCell,
                )}
              >
                Email
              </th>
              <th className={cn("text-left py-3 px-3", thCell)}>Role</th>
              <th
                className={cn(
                  "text-left py-3 px-3 hidden md:table-cell",
                  thCell,
                )}
              >
                Department
              </th>
              <th className={cn("text-left py-3 px-3", thCell)}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className={tableRow}>
                <td className="py-3 px-5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-[#30363d] flex items-center justify-center text-neutral-600 dark:text-[#c9d1d9] text-xs font-semibold">
                      {u.name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className={cn("font-medium", heading)}>{u.name}</p>
                      {u.batch && (
                        <p className={cn("text-xs", mutedText)}>{u.batch}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className={cn("py-3 px-3 hidden sm:table-cell", bodyText)}>
                  {u.email}
                </td>
                <td className="py-3 px-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      u.role === "admin"
                        ? "bg-neutral-200 dark:bg-[#30363d] text-neutral-700 dark:text-[#c9d1d9]"
                        : u.role === "supervisor"
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
                    )}
                  >
                    {u.role}
                  </span>
                </td>
                <td className={cn("py-3 px-3 hidden md:table-cell", bodyText)}>
                  {u.department || "—"}
                </td>
                <td className="py-3 px-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!text-red-600 dark:!text-red-400"
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 text-center text-muted-foreground"
                >
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ADMIN BATCHES
   ═══════════════════════════════════════════════════ */
export function AdminBatches() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/v1/admin/batches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBatches(await res.json());
      setLoading(false);
    };
    fetchBatches();
  }, []);

  if (loading) return <LoadingSpinner text="Loading batches..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn("text-2xl font-bold", heading)}>
            Batches & Courses
          </h1>
          <p className={cn("text-sm", subtext)}>
            Manage academic batches and student-supervisor mappings
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" /> Create Batch
        </Button>
      </div>

      <div className={threeColGrid}>
        {batches.map((b) => (
          <div key={b._id} className={cn(cardHover, "p-5")}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className={cn("font-semibold", heading)}>{b.name}</h3>
                <p className={cn("text-xs", mutedText)}>
                  {b.supervisor?.name || b.supervisor || "—"}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  b.active
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-neutral-100 dark:bg-[#21262d] text-neutral-500 dark:text-[#8b949e]",
                )}
              >
                {b.active ? "Active" : "Archived"}
              </span>
            </div>
            <div className={cn("flex gap-4 text-sm", bodyText)}>
              <span className="flex items-center gap-1">
                <Users className={cn("h-3.5 w-3.5", mutedText)} />
                {b.studentsCount} students
              </span>
              <span className="flex items-center gap-1">
                <FolderGit2 className={cn("h-3.5 w-3.5", mutedText)} />
                {b.projectsCount} projects
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-[#30363d] flex gap-2">
              <Button variant="ghost" size="sm">
                Manage
              </Button>
              <Button variant="ghost" size="sm">
                Assign Students
              </Button>
            </div>
          </div>
        ))}
        {batches.length === 0 && (
          <div className="col-span-full text-center text-sm text-neutral-500">
            No batches found
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ADMIN GITEA SETTINGS
   ═══════════════════════════════════════════════════ */
export function AdminGiteaSettings() {
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>({
    baseUrl: "",
    apiToken: "",
    orgTemplate: "",
    defaultPermission: "write",
    webhookConfigured: false,
    status: "offline",
  });

  useEffect(() => {
    const fetchConfig = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/v1/admin/gitea/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfig(await res.json());
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    await fetch(`${API_URL}/v1/admin/gitea/config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(config),
    });
    setSaving(false);
  };

  const testConnection = async () => {
    setTesting(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/v1/admin/gitea/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        baseUrl: config.baseUrl,
        apiToken: config.apiToken,
      }),
    });
    const result = await res.json();
    setConfig((c: any) => ({
      ...c,
      status: result.ok ? "online" : "offline",
      lastChecked: new Date().toISOString(),
    }));
    setTesting(false);
  };

  if (loading) return <LoadingSpinner text="Loading configuration..." />;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className={cn("text-2xl font-bold", heading)}>
          Gitea Server Configuration
        </h1>
        <p className={cn("text-sm", subtext)}>
          Configure connection to your self-hosted Gitea instance
        </p>
      </div>

      <div className={cn(card, "p-6 space-y-5")}>
        <div
          className={cn(
            "flex items-center justify-between p-4 rounded-md border",
            config.status === "online"
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
          )}
        >
          <div className="flex items-center gap-3">
            <Server
              className={cn(
                "h-5 w-5",
                config.status === "online"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400",
              )}
            />
            <div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  config.status === "online"
                    ? "text-green-800 dark:text-green-400"
                    : "text-red-800 dark:text-red-400",
                )}
              >
                {config.status === "online"
                  ? "Server Connected"
                  : "Server Offline"}
              </p>
              {config.lastChecked && (
                <p
                  className={cn(
                    "text-xs",
                    config.status === "online"
                      ? "text-green-600 dark:text-green-500"
                      : "text-red-600 dark:text-red-500",
                  )}
                >
                  Last checked:{" "}
                  {new Date(config.lastChecked).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                config.status === "online" ? "bg-green-500" : "bg-red-500",
              )}
            />
            <span
              className={cn(
                "text-xs font-medium",
                config.status === "online"
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400",
              )}
            >
              {config.status === "online" ? "Online" : "Offline"}
            </span>
          </span>
        </div>

        <div>
          <label className={cn("block text-sm font-medium mb-1.5", heading)}>
            Gitea Base URL
          </label>
          <input
            type="url"
            value={config.baseUrl}
            onChange={(e) =>
              setConfig((c: any) => ({ ...c, baseUrl: e.target.value }))
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={cn("block text-sm font-medium mb-1.5", heading)}>
            API Token
          </label>
          <input
            type="password"
            value={config.apiToken}
            onChange={(e) =>
              setConfig((c: any) => ({ ...c, apiToken: e.target.value }))
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={cn("block text-sm font-medium mb-1.5", heading)}>
            Organization Template
          </label>
          <input
            type="text"
            value={config.orgTemplate}
            onChange={(e) =>
              setConfig((c: any) => ({ ...c, orgTemplate: e.target.value }))
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={cn("block text-sm font-medium mb-1.5", heading)}>
            Default Team Permissions
          </label>
          <select
            className={selectClass}
            value={config.defaultPermission}
            onChange={(e) =>
              setConfig((c: any) => ({
                ...c,
                defaultPermission: e.target.value,
              }))
            }
          >
            <option value="write">Write (push/pull)</option>
            <option value="read">Read only</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-[#30363d]">
          <h4 className={cn("text-sm font-semibold mb-3", heading)}>
            Webhook Configuration
          </h4>
          <div className={cn("flex items-center justify-between p-3", infoBox)}>
            <div className="flex items-center gap-2">
              <Webhook className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className={cn("text-sm", heading)}>Webhook Secret</span>
            </div>
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                config.webhookConfigured
                  ? "text-green-600 dark:text-green-400"
                  : "text-yellow-600 dark:text-yellow-400",
              )}
            >
              {config.webhookConfigured ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Configured
                </>
              ) : (
                "Not Configured"
              )}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={saveConfig} disabled={saving}>
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
          <Button
            variant="secondary"
            onClick={testConnection}
            disabled={testing}
          >
            <RefreshCw className="h-4 w-4" />{" "}
            {testing ? "Testing..." : "Test Connection"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ADMIN AUDIT LOGS
   ═══════════════════════════════════════════════════ */
export function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/v1/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(await res.json());
      setLoading(false);
    };
    fetchLogs();
  }, []);

  if (loading) return <LoadingSpinner text="Loading audit logs..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn("text-2xl font-bold", heading)}>Audit Logs</h1>
          <p className={cn("text-sm", subtext)}>
            System-wide event log for security and compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Filter className="h-4 w-4" /> Filter
          </Button>
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className={cn(card, "p-5")}>
        <ActivityTimeline activities={logs} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ACTIVITY PAGE (ALL ROLES)
   ═══════════════════════════════════════════════════ */
export function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/v1/activities/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch activities");
        const json = await res.json();
        setActivities(Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []);
      } catch (err) {
        console.error("Activity load failed", err);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  if (loading) return <LoadingSpinner text="Loading activity..." />;

  const filteredActivities =
    filter === "All"
      ? activities
      : activities.filter((a) => a.type === filter.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn("text-2xl font-bold", heading)}>
            Activity Timeline
          </h1>
          <p className={cn("text-sm", subtext)}>
            All recent events across the system
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["All", "Push", "Milestone", "Review", "Comment"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition",
                filter === f
                  ? "bg-neutral-900 dark:bg-[#f0f6fc] text-white dark:text-[#0d1117] border-neutral-900 dark:border-[#f0f6fc]"
                  : "bg-white dark:bg-[#161b22] text-neutral-500 dark:text-[#8b949e] border-neutral-300 dark:border-[#30363d] hover:bg-neutral-50 dark:hover:bg-[#21262d]",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className={cn(card, "p-5")}>
        <ActivityTimeline activities={filteredActivities} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SETTINGS PAGE (ALL ROLES)
   ═══════════════════════════════════════════════════ */
export function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/v1/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const json = await res.json();
        const user = json.data || json;
        // Normalize: backend uses 'name', frontend expects 'fullName'
        if (user.name && !user.fullName) user.fullName = user.name;
        setProfile(user);
      } catch (err) {
        console.error("Profile load failed", err);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/v1/users/updateMe`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: profile.fullName || profile.name }),
      });
      if (!res.ok) throw new Error("Save failed");
      setToast("Profile saved!");
    } catch {
      setToast("Failed to save profile");
    }
    setSaving(false);
    setTimeout(() => setToast(""), 3000);
  };

  const handleChangePassword = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/v1/auth/reset-password/${token}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword, passwordConfirm: newPassword }),
      });
      if (!res.ok) throw new Error("Password update failed");
      setToast("Password updated!");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setToast("Failed to update password");
    }
    setSaving(false);
    setTimeout(() => setToast(""), 3000);
  };

  if (!profile) return <LoadingSpinner text="Loading settings..." />;

  return (
    <div className="max-w-3xl space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
      <h1 className={cn("text-2xl font-bold", heading)}>Settings</h1>

      <div className={cn(card, "p-6 space-y-5")}>
        <h3 className={cn("font-semibold", heading)}>Profile Information</h3>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-neutral-200 dark:bg-[#30363d] flex items-center justify-center text-neutral-600 dark:text-[#c9d1d9] text-xl font-semibold">
            {profile.fullName
              ?.split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <Button variant="secondary" size="sm">
            Change Photo
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={cn("block text-sm font-medium mb-1", heading)}>
              Full Name
            </label>
            <input
              type="text"
              value={profile.fullName || ""}
              onChange={(e) =>
                setProfile((p: any) => ({ ...p, fullName: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={cn("block text-sm font-medium mb-1", heading)}>
              Email
            </label>
            <input
              type="email"
              value={profile.email || ""}
              disabled
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className={cn(card, "p-6 space-y-5")}>
        <h3 className={cn("font-semibold", heading)}>Change Password</h3>
        <div className="space-y-3">
          <div>
            <label className={cn("block text-sm font-medium mb-1", heading)}>
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={cn("block text-sm font-medium mb-1", heading)}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <Button onClick={handleChangePassword} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Updating...
            </>
          ) : (
            "Update Password"
          )}
        </Button>
      </div>

      <div className={cn(card, "p-6 space-y-5")}>
        <h3 className={cn("font-semibold", heading)}>Connected Accounts</h3>
        <div className={cn("flex items-center justify-between p-3", infoBox)}>
          <div className="flex items-center gap-3">
            <GitBranch className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className={cn("text-sm font-medium", heading)}>
                Gitea Account
              </p>
              <p className={cn("text-xs", mutedText)}>
                Connected as @{profile.giteaUsername}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" /> Connected
          </span>
        </div>
      </div>

      <div className={cn(card, "p-6 space-y-5")}>
        <h3 className={cn("font-semibold", heading)}>Notifications</h3>
        <div className="space-y-3">
          {[
            "Email notifications for push events",
            "Email on feedback received",
            "Portal notifications for deadlines",
            "Weekly activity digest",
          ].map((n) => (
            <label key={n} className="flex items-center justify-between">
              <span className={cn("text-sm", bodyText)}>{n}</span>
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-neutral-300 dark:border-[#30363d] text-blue-600 focus:ring-blue-500"
              />
            </label>
          ))}
        </div>
        <Button onClick={handleSaveProfile} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PROFILE PAGE (ALL ROLES)
   ═══════════════════════════════════════════════════ */
export function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/v1/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const json = await res.json();
        const user = json.data || json;
        // Normalize: backend uses 'name', frontend expects 'fullName'
        if (user.name && !user.fullName) user.fullName = user.name;
        setProfile(user);
      } catch (err) {
        console.error("Profile load failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading || !profile) return <LoadingSpinner text="Loading profile..." />;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className={cn("text-2xl font-bold", heading)}>Profile</h1>
      <div className={cn(card, "p-6")}>
        <div className="flex items-center gap-5 mb-6">
          <div className="h-20 w-20 rounded-full bg-neutral-200 dark:bg-[#30363d] flex items-center justify-center text-neutral-600 dark:text-[#c9d1d9] text-2xl font-semibold">
            {(profile.fullName || profile.name || "")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <h2 className={cn("text-xl font-bold", heading)}>
              {profile.fullName || profile.name}
            </h2>
            <p className={cn("text-sm", subtext)}>{profile.email}</p>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 capitalize",
                profile.role === "student"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
              )}
            >
              {profile.role}
            </span>
          </div>
        </div>
        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className={cn("mb-0.5", mutedText)}>Department</dt>
            <dd className={cn("font-medium", heading)}>
              {profile.department || "—"}
            </dd>
          </div>
          <div>
            <dt className={cn("mb-0.5", mutedText)}>Batch</dt>
            <dd className={cn("font-medium", heading)}>
              {profile.batch || "—"}
            </dd>
          </div>
          <div>
            <dt className={cn("mb-0.5", mutedText)}>Active Projects</dt>
            <dd className={cn("font-medium", heading)}>
              {profile.activeProjects ?? 0}
            </dd>
          </div>
          <div>
            <dt className={cn("mb-0.5", mutedText)}>Gitea Username</dt>
            <dd className={cn("font-medium", heading)}>
              @{profile.giteaUsername}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   REUSABLE: FEEDBACK THREAD (Real API)
   ═══════════════════════════════════════════════════ */

function FeedbackThread({ projectId }: { projectId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_URL}/v1/projects/${projectId}/feedback`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setComments(await res.json());
      } catch {
        setComments([]);
      }
      setLoading(false);
    };
    fetchFeedback();
  }, [projectId]);

  const handleSend = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/v1/projects/${projectId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      const saved = await res.json();
      setComments((prev) => [...prev, saved]);
      setNewComment("");
    } catch {
      /* handled */
    }
    setSending(false);
  };

  return (
    <div className={card}>
      <div className={cn("p-5", sectionBorder)}>
        <h3 className={cn("font-semibold", heading)}>Feedback Thread</h3>
        {loading && (
          <span className={cn("text-xs ml-2", mutedText)}>Loading...</span>
        )}
      </div>
      <div className="p-5 space-y-4">
        {comments.map((c) => (
          <div
            key={c._id}
            className={cn(
              "flex gap-3",
              c.author?.role === "student" ? "flex-row-reverse" : "",
            )}
          >
            <div
              className={cn(
                "h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white",
                c.author?.role === "supervisor"
                  ? "bg-purple-500"
                  : "bg-blue-500",
              )}
            >
              {c.author?.fullName
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div
              className={cn(
                "max-w-lg rounded-lg p-3 text-sm",
                c.author?.role === "supervisor"
                  ? "bg-neutral-100 dark:bg-[#21262d] text-neutral-800 dark:text-[#c9d1d9]"
                  : "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("font-semibold text-xs", heading)}>
                  {c.author?.fullName}
                </span>
                <span className={cn("text-xs", mutedText)}>
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p>{c.content}</p>
            </div>
          </div>
        ))}
      </div>
      <div
        className={cn(
          "p-5 flex gap-2",
          "border-t border-neutral-100 dark:border-[#30363d]",
        )}
      >
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Type your reply..."
          className={inputClass}
        />
        <Button onClick={handleSend} disabled={sending || !newComment.trim()}>
          {sending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STUDENT / SUPERVISOR MESSAGES — Chat Component
   ═══════════════════════════════════════════════════ */

export type Conversation = {
  id: string;
  name: string;
  role: string;
  project: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  online: boolean;
  avatar: string;
};

export type ChatMessage = {
  id: string;
  sender: "me" | "other";
  senderName: string;
  text: string;
  time: string;
  read: boolean;
  type: "text" | "file";
  fileName?: string;
  fileSize?: string;
};

function ChatView({
  conversations,
  userType,
}: {
  conversations: Conversation[];
  userType: "student" | "supervisor";
}) {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);

  const currentMessages = selectedChat ? messages[selectedChat] || [] : [];
  const selectedConvo = conversations.find((c) => c.id === selectedChat);

  useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/v1/chat/conversations/${selectedChat}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const json = await res.json();
      const list = json.data?.messages || json.data || [];

      setMessages((prev) => ({
        ...prev,
        [selectedChat]: list.map(
          (m: any): ChatMessage => ({
            id: m._id,
            sender: m.sender === "self" ? "me" : "other",
            senderName: m.senderUser?.fullName || "Unknown",
            text: m.type === "text" ? m.content : "",
            time: new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            read: m.read,
            type: m.type,
            fileName: m.file?.name,
            fileSize: m.file?.size,
          }),
        ),
      }));
      setLoading(false);
    };
    fetchMessages();
  }, [selectedChat]);

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedChat) return;

    const text = messageInput.trim();
    setMessageInput("");

    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      sender: "me",
      senderName: "You",
      text,
      time: "Just now",
      read: false,
      type: "text",
    };

    setMessages((prev) => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] || []), optimistic],
    }));

    try {
      const token = localStorage.getItem("token");
      await fetch(
        `${API_URL}/v1/chat/conversations/${selectedChat}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: text, type: "text" }),
        },
      );
    } catch {
      /* Optimistic handled already */
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        card,
        "flex h-[calc(100vh-180px)] min-h-[500px] overflow-hidden",
      )}
    >
      {/* Conversation List */}
      <div
        className={cn(
          "w-full sm:w-80 border-r border-neutral-200 dark:border-[#30363d] flex flex-col shrink-0",
          selectedChat && !showMobileList ? "hidden sm:flex" : "flex",
        )}
      >
        <div
          className={cn(
            "p-4 border-b border-neutral-200 dark:border-[#30363d]",
          )}
        >
          <h2 className={cn("text-sm font-semibold mb-3", heading)}>
            Conversations
          </h2>
          <div className="flex items-center gap-2 rounded-md border border-neutral-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-3 py-1.5">
            <Search className={cn("h-4 w-4", mutedText)} />
            <input
              type="text"
              placeholder="Search conversations..."
              className={cn(
                "bg-transparent text-sm outline-none w-full",
                heading,
              )}
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {conversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => {
                setSelectedChat(convo.id);
                setShowMobileList(false);
              }}
              className={cn(
                "w-full flex items-start gap-3 p-4 text-left transition border-b border-neutral-50 dark:border-[#21262d]",
                selectedChat === convo.id
                  ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 !border-l-blue-500"
                  : "hover:bg-neutral-50 dark:hover:bg-[#21262d] border-l-2 border-l-transparent",
              )}
            >
              <div className="relative shrink-0">
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold",
                    convo.role.toLowerCase() === "supervisor"
                      ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400"
                      : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
                  )}
                >
                  {convo.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                {convo.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-[#161b22]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={cn("text-sm font-semibold truncate", heading)}
                  >
                    {convo.name}
                  </span>
                  <span className={cn("text-[10px] shrink-0 ml-2", mutedText)}>
                    {convo.lastTime}
                  </span>
                </div>
                <p className={cn("text-xs mb-1", mutedText)}>{convo.project}</p>
                <p
                  className={cn(
                    "text-xs truncate",
                    convo.unread > 0
                      ? "font-medium text-neutral-700 dark:text-[#c9d1d9]"
                      : subtext,
                  )}
                >
                  {convo.lastMessage}
                </p>
              </div>
              {convo.unread > 0 && (
                <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold mt-1">
                  {convo.unread}
                </span>
              )}
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="p-6 text-center text-sm text-neutral-500">
              No conversations found
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={cn(
          "flex-1 flex flex-col",
          !selectedChat || showMobileList ? "hidden sm:flex" : "flex",
        )}
      >
        {selectedConvo ? (
          <>
            {/* Chat Header */}
            <div
              className={cn(
                "flex items-center gap-3 p-4 border-b border-neutral-200 dark:border-[#30363d]",
              )}
            >
              <button
                onClick={() => setShowMobileList(true)}
                className="sm:hidden p-1 rounded hover:bg-neutral-100 dark:hover:bg-[#21262d]"
              >
                <ArrowUpRight
                  className={cn("h-5 w-5 rotate-[225deg]", subtext)}
                />
              </button>
              <div className="relative">
                <div
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold",
                    selectedConvo.role.toLowerCase() === "supervisor"
                      ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400"
                      : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
                  )}
                >
                  {selectedConvo.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                {selectedConvo.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-[#161b22]" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={cn("text-sm font-semibold", heading)}>
                  {selectedConvo.name}
                </h3>
                <p
                  className={cn(
                    "text-xs",
                    selectedConvo.online
                      ? "text-green-600 dark:text-green-400"
                      : mutedText,
                  )}
                >
                  {selectedConvo.online ? "Online" : "Offline"} ·{" "}
                  {selectedConvo.project}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className={cn(
                    "p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-[#21262d]",
                    subtext,
                  )}
                >
                  <FolderGit2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* System message */}
              <div className="flex justify-center">
                <span
                  className={cn(
                    "text-[10px] px-3 py-1 rounded-full",
                    "bg-neutral-100 dark:bg-[#21262d]",
                    mutedText,
                  )}
                >
                  Conversation about {selectedConvo.project}
                </span>
              </div>

              {loading && (
                <p className={cn("text-xs text-center", mutedText)}>
                  Loading messages…
                </p>
              )}

              {currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.sender === "me" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[75%] sm:max-w-[65%]",
                      msg.sender === "me" ? "order-2" : "order-1",
                    )}
                  >
                    {msg.type === "file" ? (
                      <div
                        className={cn(
                          "rounded-lg p-3 border",
                          msg.sender === "me"
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "bg-white dark:bg-[#21262d] border-neutral-200 dark:border-[#30363d]",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {msg.fileName}
                            </p>
                            <p
                              className={cn(
                                "text-xs",
                                msg.sender === "me"
                                  ? "text-blue-100"
                                  : mutedText,
                              )}
                            >
                              {msg.fileSize}
                            </p>
                          </div>
                          <Download className="h-4 w-4 shrink-0 cursor-pointer hover:opacity-70" />
                        </div>
                        <p
                          className={cn(
                            "text-[10px] mt-1.5 text-right",
                            msg.sender === "me" ? "text-blue-200" : mutedText,
                          )}
                        >
                          {msg.time}
                          {msg.sender === "me" && (
                            <span className="ml-1">
                              {msg.read ? "✓✓" : "✓"}
                            </span>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "rounded-lg px-3.5 py-2.5",
                          msg.sender === "me"
                            ? "bg-blue-500 text-white"
                            : "bg-neutral-100 dark:bg-[#21262d] text-neutral-800 dark:text-[#c9d1d9]",
                        )}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <p
                          className={cn(
                            "text-[10px] mt-1.5 text-right",
                            msg.sender === "me" ? "text-blue-200" : mutedText,
                          )}
                        >
                          {msg.time}
                          {msg.sender === "me" && (
                            <span className="ml-1">
                              {msg.read ? "✓✓" : "✓"}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div
              className={cn(
                "p-4 border-t border-neutral-200 dark:border-[#30363d] bg-white dark:bg-[#161b22]",
              )}
            >
              <div className="flex items-end gap-2">
                <button
                  className={cn(
                    "p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-[#21262d] shrink-0 mb-0.5",
                    subtext,
                  )}
                >
                  <Upload className="h-5 w-5" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className={cn(
                      "w-full rounded-lg border border-neutral-300 dark:border-[#30363d] px-4 py-2.5 text-sm outline-none resize-none",
                      "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                      "bg-white dark:bg-[#0d1117] text-neutral-900 dark:text-[#f0f6fc]",
                      "placeholder:text-neutral-400 dark:placeholder:text-[#484f58]",
                    )}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!messageInput.trim()}
                  className={cn(
                    "p-2.5 rounded-lg shrink-0 mb-0.5 transition",
                    messageInput.trim()
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-neutral-100 dark:bg-[#21262d] text-neutral-400 dark:text-[#484f58] cursor-not-allowed",
                  )}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
              <p className={cn("text-[10px] mt-1.5 ml-10", mutedText)}>
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        ) : (
          /* Empty State — No conversation selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-neutral-100 dark:bg-[#21262d] flex items-center justify-center">
                  <MessageSquare className={cn("h-8 w-8", mutedText)} />
                </div>
              </div>
              <h3 className={cn("text-lg font-semibold mb-1", heading)}>
                Select a conversation
              </h3>
              <p className={cn("text-sm", subtext)}>
                Choose a conversation from the list to start chatting
                {userType === "student"
                  ? " with your supervisor"
                  : " with your students"}
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function StudentMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/v1/chat/student-conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch conversations");
        const json = await res.json();
        setConversations(json.data || []);
      } catch (err) {
        console.error("Messages load failed", err);
        setConversations([]);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className={cn("text-2xl font-bold", heading)}>Messages</h1>
        <p className={cn("text-sm", subtext)}>
          Chat with your supervisors about your projects
        </p>
      </div>
      <ChatView conversations={conversations} userType="student" />
    </div>
  );
}

export function SupervisorMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/v1/chat/supervisor-conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch conversations");
        const json = await res.json();
        setConversations(json.data || []);
      } catch (err) {
        console.error("Messages load failed", err);
        setConversations([]);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className={cn("text-2xl font-bold", heading)}>Messages</h1>
        <p className={cn("text-sm", subtext)}>
          Chat with your students about their projects
        </p>
      </div>
      <ChatView conversations={conversations} userType="supervisor" />
    </div>
  );
}
