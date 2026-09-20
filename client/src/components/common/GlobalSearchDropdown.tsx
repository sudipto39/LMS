// src/components/common/GlobalSearchDropdown.tsx
import React, { useMemo } from "react";
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  Code2,
  Users,
  Layers,
  FileText,
  User as UserIcon,
  Settings,
  ArrowRight,
  Sparkles,
  Search,
  FlaskConical,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import { Pill } from "./UIPrimitives";
import { DEMO_LAB_ASSIGNMENTS } from "../../screens/LabAssignmentsScreen";
import { DEFAULT_PROBLEM_STATEMENTS } from "../../data/mockData";
import type {
  Project,
  Milestone,
  User,
  ProblemStatement,
  LabAssignment,
  Batch,
  Course,
} from "../../types";

interface NavShortcut {
  key: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  roles?: string[];
}

export interface GlobalSearchDropdownProps {
  searchQuery: string;
  onClearSearch: () => void;
  projects?: Project[];
  milestones?: Milestone[];
  users?: User[];
  problemStatements?: ProblemStatement[];
  labAssignments?: LabAssignment[];
  batches?: Batch[];
  courses?: Course[];
  currentRole?: string;
  onNavigatePage: (page: string) => void;
  onSelectProject: (projectId: string) => void;
  onSelectLab?: (lab: LabAssignment) => void;
  onSelectProblemStatement?: (statement: ProblemStatement) => void;
}

export const GlobalSearchDropdown: React.FC<GlobalSearchDropdownProps> = ({
  searchQuery,
  onClearSearch,
  projects = [],
  milestones = [],
  users = [],
  problemStatements = [],
  labAssignments = [],
  batches = [],
  courses = [],
  currentRole = "STUDENT",
  onNavigatePage,
  onSelectProject,
  onSelectLab,
  onSelectProblemStatement,
}) => {
  const q = (typeof searchQuery === "string" ? searchQuery : "").toLowerCase().trim();
  if (!q) return null;

  const queryTokens = useMemo(() => (q ? q.split(/\s+/).filter(Boolean) : []), [q]);

  // Safe Fallback Data Sources
  const safeProjects = useMemo(() => (Array.isArray(projects) ? projects : []), [projects]);
  const safeMilestones = useMemo(() => (Array.isArray(milestones) ? milestones : []), [milestones]);
  const safeUsers = useMemo(() => (Array.isArray(users) ? users : []), [users]);
  const safeBatches = useMemo(() => (Array.isArray(batches) ? batches : []), [batches]);
  const safeCourses = useMemo(() => (Array.isArray(courses) ? courses : []), [courses]);

  const effectiveLabs = useMemo(() => {
    const list = Array.isArray(labAssignments) && labAssignments.length > 0 ? labAssignments : DEMO_LAB_ASSIGNMENTS;
    return Array.isArray(list) ? list : [];
  }, [labAssignments]);

  const effectiveIdeas = useMemo(() => {
    const list = Array.isArray(problemStatements) && problemStatements.length > 0 ? problemStatements : DEFAULT_PROBLEM_STATEMENTS;
    return Array.isArray(list) ? list : [];
  }, [problemStatements]);

  // 1. Navigation Shortcuts
  const allNavShortcuts: NavShortcut[] = [
    { key: "dashboard", label: "Dashboard", desc: "Main overview & metrics", icon: FolderKanban },
    { key: "projects", label: "Projects Directory", desc: "Capstone repositories & teams", icon: FolderKanban },
    { key: "ideas", label: "Idea Bank", desc: "Browse, propose & claim project challenges", icon: Lightbulb },
    { key: "labs", label: "Virtual Lab Experiments", desc: "Judge0 automated code benchmarks", icon: FlaskConical },
    { key: "sandbox", label: "Judge0 Remote IDE", desc: "Live code execution sandbox", icon: Code2 },
    { key: "milestones", label: "Milestones", desc: "Deliverables & submission roadmap", icon: Clock, roles: ["STUDENT", "ADMIN"] },
    { key: "submissions", label: "My Submissions", desc: "Review submitted files & archives", icon: CheckCircle2, roles: ["STUDENT", "ADMIN"] },
    { key: "pending", label: "Pending Reviews", desc: "Evaluate student milestone submissions", icon: Clock, roles: ["SUPERVISOR", "ADMIN"] },
    { key: "grades", label: "Capstone Grades", desc: "Rubrics & evaluation scoresheets", icon: CheckCircle2, roles: ["SUPERVISOR", "ADMIN"] },
    { key: "batches", label: "Batches & Courses", desc: "University curriculum & cohort groups", icon: Layers, roles: ["ADMIN"] },
    { key: "users", label: "User Governance", desc: "Provision accounts & role assignments", icon: Users, roles: ["ADMIN"] },
    { key: "gitea", label: "Gitea Server Config", desc: "GCP Compute Engine instance settings", icon: Settings, roles: ["ADMIN"] },
    { key: "audit", label: "System Audit Logs", desc: "Real-time security & access logs", icon: FileText, roles: ["ADMIN"] },
    { key: "profile", label: "Profile & SSH Keys", desc: "Account security, Gitea SSH keys & PAT", icon: UserIcon },
  ];

  const matchedNav = useMemo(() => {
    return allNavShortcuts.filter(
      (n) =>
        (!n.roles || n.roles.includes(currentRole)) &&
        (n.label.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q) || n.key.toLowerCase().includes(q))
    );
  }, [allNavShortcuts, currentRole, q]);

  // 2. Matching Projects
  const isProjectTerm = ["project", "projects", "capstone", "repo", "repos", "repository"].some(
    (t) => q === t || q.includes(t) || t.includes(q)
  );

  const matchedProjects = useMemo(() => {
    const nonProjectTokens = queryTokens.filter(
      (tok) => !["project", "projects", "capstone", "repo", "repos", "repository"].includes(tok)
    );
    return safeProjects.filter((p) => {
      if (!p) return false;
      const content = `${p.title || ""} ${p.desc || ""} ${p.description || ""} ${p.repoName || ""} ${(p.techs || p.technologies || []).join(" ")} ${typeof p.supervisor === "string" ? p.supervisor : (p.supervisor as any)?.name || ""} ${p.status || ""}`.toLowerCase();
      if (content.includes(q)) return true;
      if (isProjectTerm) {
        if (nonProjectTokens.length === 0) return true;
        return nonProjectTokens.every((tok) => content.includes(tok));
      }
      return queryTokens.every((tok) => content.includes(tok));
    });
  }, [safeProjects, q, queryTokens, isProjectTerm]);

  // 3. Matching Virtual Lab Experiments
  const isLabTerm = [
    "lab",
    "labs",
    "experiment",
    "experiments",
    "virtual lab",
    "virtual labs",
    "judge0",
    "benchmark",
    "benchmarks",
    "practical",
    "coding lab",
  ].some((t) => q === t || q.includes(t) || t.includes(q));

  const matchedLabs = useMemo(() => {
    const nonLabTokens = queryTokens.filter(
      (tok) => !["lab", "labs", "experiment", "experiments", "virtual", "judge0", "benchmark", "benchmarks", "practical", "coding"].includes(tok)
    );
    return effectiveLabs.filter((l) => {
      if (!l) return false;
      const content = `${l.title || ""} ${l.subject || ""} ${l.objective || ""} ${l.description || ""} ${l.language || ""} ${l.batch?.name || ""}`.toLowerCase();
      if (content.includes(q)) return true;
      if (isLabTerm) {
        if (nonLabTokens.length === 0) return true;
        return nonLabTokens.every((tok) => content.includes(tok));
      }
      return queryTokens.every((tok) => content.includes(tok));
    });
  }, [effectiveLabs, q, queryTokens, isLabTerm]);

  // 4. Matching Idea Bank & Problem Statements
  const isIdeaTerm = [
    "idea",
    "ideas",
    "problem",
    "problems",
    "statement",
    "statements",
    "bank",
    "proposal",
    "proposals",
    "challenge",
    "challenges",
  ].some((t) => q === t || q.includes(t) || t.includes(q));

  const matchedIdeas = useMemo(() => {
    const nonIdeaTokens = queryTokens.filter(
      (tok) => !["idea", "ideas", "problem", "problems", "statement", "statements", "bank", "proposal", "proposals", "challenge", "challenges"].includes(tok)
    );
    return effectiveIdeas.filter((ps) => {
      if (!ps) return false;
      const content = `${ps.title || ""} ${ps.description || ""} ${ps.domain || ""} ${(ps.technologies || []).join(" ")} ${ps.difficulty || ""} ${ps.creator?.name || ""}`.toLowerCase();
      if (content.includes(q)) return true;
      if (isIdeaTerm) {
        if (nonIdeaTokens.length === 0) return true;
        return nonIdeaTokens.every((tok) => content.includes(tok));
      }
      return queryTokens.every((tok) => content.includes(tok));
    });
  }, [effectiveIdeas, q, queryTokens, isIdeaTerm]);

  // 5. Matching Batches & Courses
  const isBatchTerm = ["batch", "batches", "cohort", "cohorts", "course", "courses", "curriculum"].some(
    (t) => q === t || q.includes(t) || t.includes(q)
  );

  const matchedBatches = useMemo(() => {
    const nonBatchTokens = queryTokens.filter(
      (tok) => !["batch", "batches", "cohort", "cohorts", "course", "courses", "curriculum"].includes(tok)
    );

    const bMatches = safeBatches.filter((b) => {
      if (!b) return false;
      const content = `${b.name || ""} ${b.courseName || ""} ${b.startYear || ""} ${b.endYear || ""}`.toLowerCase();
      if (content.includes(q)) return true;
      if (isBatchTerm) {
        if (nonBatchTokens.length === 0) return true;
        return nonBatchTokens.every((tok) => content.includes(tok));
      }
      return queryTokens.every((tok) => content.includes(tok));
    });

    const cMatches = safeCourses.filter((c) => {
      if (!c) return false;
      const content = `${c.title || ""} ${c.code || ""} ${c.school || ""} ${c.description || ""}`.toLowerCase();
      if (content.includes(q)) return true;
      if (isBatchTerm) {
        if (nonBatchTokens.length === 0) return true;
        return nonBatchTokens.every((tok) => content.includes(tok));
      }
      return queryTokens.every((tok) => content.includes(tok));
    });

    return { batches: bMatches, courses: cMatches };
  }, [safeBatches, safeCourses, q, queryTokens, isBatchTerm]);

  // 6. Matching Milestones
  const isMilestoneTerm = ["milestone", "milestones", "deliverable", "deliverables", "roadmap", "deadline"].some(
    (t) => q === t || q.includes(t) || t.includes(q)
  );

  const matchedMilestones = useMemo(() => {
    const nonMsTokens = queryTokens.filter(
      (tok) => !["milestone", "milestones", "deliverable", "deliverables", "roadmap", "deadline"].includes(tok)
    );
    return safeMilestones.filter((m) => {
      if (!m) return false;
      const content = `${m.title || ""} ${m.note || ""} ${m.status || ""} ${m.due || ""}`.toLowerCase();
      if (content.includes(q)) return true;
      if (isMilestoneTerm) {
        if (nonMsTokens.length === 0) return true;
        return nonMsTokens.every((tok) => content.includes(tok));
      }
      return queryTokens.every((tok) => content.includes(tok));
    });
  }, [safeMilestones, q, queryTokens, isMilestoneTerm]);

  // 7. Matching Users (Students / Faculty)
  const isUserTerm = ["user", "users", "student", "students", "supervisor", "supervisors", "admin", "admins", "people", "faculty"].some(
    (t) => q === t || q.includes(t) || t.includes(q)
  );

  const matchedUsers = useMemo(() => {
    const nonUserTokens = queryTokens.filter(
      (tok) => !["user", "users", "student", "students", "supervisor", "supervisors", "admin", "admins", "people", "faculty"].includes(tok)
    );
    return safeUsers.filter((u) => {
      if (!u) return false;
      const content = `${u.name || ""} ${u.email || ""} ${u.idNo || ""} ${u.universityId || ""} ${u.dept || ""} ${u.role || ""}`.toLowerCase();
      if (content.includes(q)) return true;
      if (isUserTerm) {
        if (nonUserTokens.length === 0) return true;
        return nonUserTokens.every((tok) => content.includes(tok));
      }
      return queryTokens.every((tok) => content.includes(tok));
    });
  }, [safeUsers, q, queryTokens, isUserTerm]);

  const hasAnyResults =
    matchedProjects.length > 0 ||
    matchedLabs.length > 0 ||
    matchedIdeas.length > 0 ||
    matchedBatches.batches.length > 0 ||
    matchedBatches.courses.length > 0 ||
    matchedMilestones.length > 0 ||
    matchedUsers.length > 0 ||
    matchedNav.length > 0;

  return (
    <div
      className="absolute top-full right-0 mt-2 w-[92vw] sm:w-[480px] max-h-[520px] overflow-y-auto rounded-2xl border shadow-2xl z-50 p-3 space-y-3 backdrop-blur-2xl transition-all"
      style={{
        background: "var(--srf)",
        borderColor: "var(--bdr)",
        color: "var(--t1)",
      }}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between px-2 pt-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--t2)" }}>
        <span className="flex items-center gap-1.5">
          <Sparkles size={12} style={{ color: "var(--acc)" }} /> Omni-Search Results
        </span>
        <span>Esc to close</span>
      </div>

      {!hasAnyResults && (
        <div className="text-center py-8 px-4 space-y-2">
          <Search size={28} className="mx-auto opacity-30" />
          <div className="text-[13px] font-medium">No results found for &ldquo;{searchQuery}&rdquo;</div>
          <div className="text-[11px]" style={{ color: "var(--t2)" }}>
            Try searching by project title, milestone, lab experiment, university ID, or screen name
          </div>
        </div>
      )}

      {/* ── PROJECTS RESULTS ────────────────────────────────────────────── */}
      {matchedProjects.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider px-2" style={{ color: "var(--t2)" }}>
            Projects ({matchedProjects.length})
          </div>
          {matchedProjects.slice(0, 3).map((p) => (
            <div
              key={p.id}
              onClick={() => {
                onSelectProject(p.id);
                onClearSearch();
              }}
              className="p-2.5 rounded-xl border hover:border-[var(--acc)] cursor-pointer flex items-center justify-between gap-3 transition group"
              style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="h-8 w-8 rounded-lg grid place-items-center flex-shrink-0"
                  style={{ background: "#0891b215", color: "#0891b2" }}
                >
                  <FolderKanban size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold truncate group-hover:text-[var(--acc)] transition">
                    {p.title}
                  </div>
                  <div className="text-[10px] truncate" style={{ color: "var(--t2)" }}>
                    {(p.techs || p.technologies || []).slice(0, 3).join(", ") || "Capstone Project"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Pill color={p.status === "APPROVED" ? "#22c55e" : "#0891b2"}>
                  {p.status || "ACTIVE"}
                </Pill>
                <ArrowRight size={12} className="opacity-40 group-hover:opacity-100 transition" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── LAB EXPERIMENTS RESULTS ─────────────────────────────────────── */}
      {matchedLabs.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider px-2" style={{ color: "var(--t2)" }}>
            Lab Experiments ({matchedLabs.length})
          </div>
          {matchedLabs.slice(0, 3).map((lab) => (
            <div
              key={lab.id}
              onClick={() => {
                if (onSelectLab) onSelectLab(lab);
                onNavigatePage("labs");
                onClearSearch();
              }}
              className="p-2.5 rounded-xl border hover:border-[var(--acc)] cursor-pointer flex items-center justify-between gap-3 transition group"
              style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="h-8 w-8 rounded-lg grid place-items-center flex-shrink-0"
                  style={{ background: "#ec489915", color: "#ec4899" }}
                >
                  <FlaskConical size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold truncate group-hover:text-[var(--acc)] transition">
                    {lab.title}
                  </div>
                  <div className="text-[10px] truncate" style={{ color: "var(--t2)" }}>
                    {lab.subject || "Lab Experiment"} • {lab.language?.toUpperCase() || "ALL"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Pill color={lab.status === "PUBLISHED" ? "#22c55e" : "#64748b"}>
                  {lab.status || "LIVE"}
                </Pill>
                <ArrowRight size={12} className="opacity-40 group-hover:opacity-100 transition" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── IDEA BANK & PROBLEM STATEMENTS ──────────────────────────────── */}
      {matchedIdeas.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider px-2" style={{ color: "var(--t2)" }}>
            Idea Bank & Problem Statements ({matchedIdeas.length})
          </div>
          {matchedIdeas.slice(0, 3).map((ps) => (
            <div
              key={ps.id}
              onClick={() => {
                if (onSelectProblemStatement) onSelectProblemStatement(ps);
                onNavigatePage("ideas");
                onClearSearch();
              }}
              className="p-2.5 rounded-xl border hover:border-[var(--acc)] cursor-pointer flex items-center justify-between gap-3 transition group"
              style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="h-8 w-8 rounded-lg grid place-items-center flex-shrink-0"
                  style={{ background: "#f59e0b15", color: "#f59e0b" }}
                >
                  <Lightbulb size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold truncate group-hover:text-[var(--acc)] transition">
                    {ps.title}
                  </div>
                  <div className="text-[10px] truncate" style={{ color: "var(--t2)" }}>
                    {ps.domain || "Problem Statement"} • {(ps.technologies || []).slice(0, 2).join(", ")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Pill color={ps.difficulty === "ADVANCED" ? "#ef4444" : ps.difficulty === "INTERMEDIATE" ? "#f59e0b" : "#10b981"}>
                  {ps.difficulty || "IDEA"}
                </Pill>
                <ArrowRight size={12} className="opacity-40 group-hover:opacity-100 transition" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── BATCHES & COURSES ───────────────────────────────────────────── */}
      {(matchedBatches.batches.length > 0 || matchedBatches.courses.length > 0) && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider px-2" style={{ color: "var(--t2)" }}>
            Batches & Courses ({matchedBatches.batches.length + matchedBatches.courses.length})
          </div>
          {matchedBatches.batches.slice(0, 2).map((b) => (
            <div
              key={b.id}
              onClick={() => {
                onNavigatePage("batches");
                onClearSearch();
              }}
              className="p-2.5 rounded-xl border hover:border-[var(--acc)] cursor-pointer flex items-center justify-between gap-3 transition group"
              style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="h-8 w-8 rounded-lg grid place-items-center flex-shrink-0"
                  style={{ background: "#3b82f615", color: "#3b82f6" }}
                >
                  <Layers size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold truncate group-hover:text-[var(--acc)] transition">
                    {b.name}
                  </div>
                  <div className="text-[10px] truncate" style={{ color: "var(--t2)" }}>
                    {b.courseName || "Batch"} • Cohort {b.startYear}–{b.endYear}
                  </div>
                </div>
              </div>
              <Pill color="#3b82f6">BATCH</Pill>
            </div>
          ))}
          {matchedBatches.courses.slice(0, 2).map((c) => (
            <div
              key={c.id}
              onClick={() => {
                onNavigatePage("batches");
                onClearSearch();
              }}
              className="p-2.5 rounded-xl border hover:border-[var(--acc)] cursor-pointer flex items-center justify-between gap-3 transition group"
              style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="h-8 w-8 rounded-lg grid place-items-center flex-shrink-0"
                  style={{ background: "#8b5cf615", color: "#8b5cf6" }}
                >
                  <BookOpen size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold truncate group-hover:text-[var(--acc)] transition">
                    {c.title}
                  </div>
                  <div className="text-[10px] truncate" style={{ color: "var(--t2)" }}>
                    Code: {c.code} • {c.school || "Curriculum"}
                  </div>
                </div>
              </div>
              <Pill color="#8b5cf6">COURSE</Pill>
            </div>
          ))}
        </div>
      )}

      {/* ── MILESTONES RESULTS ──────────────────────────────────────────── */}
      {matchedMilestones.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider px-2" style={{ color: "var(--t2)" }}>
            Milestones ({matchedMilestones.length})
          </div>
          {matchedMilestones.slice(0, 3).map((m) => (
            <div
              key={m.id}
              onClick={() => {
                if (m.projectId) onSelectProject(m.projectId);
                else onNavigatePage("milestones");
                onClearSearch();
              }}
              className="p-2.5 rounded-xl border hover:border-[var(--acc)] cursor-pointer flex items-center justify-between gap-3 transition group"
              style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="h-8 w-8 rounded-lg grid place-items-center flex-shrink-0"
                  style={{ background: "#f59e0b15", color: "#f59e0b" }}
                >
                  <Clock size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold truncate group-hover:text-[var(--acc)] transition">
                    {m.title}
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--t2)" }}>
                    Due: {m.due || "TBD"}
                  </div>
                </div>
              </div>
              <Pill color={m.status === "APPROVED" ? "#22c55e" : m.status === "SUBMITTED" ? "#3b82f6" : "#f59e0b"}>
                {m.status}
              </Pill>
            </div>
          ))}
        </div>
      )}

      {/* ── USERS RESULTS ──────────────────────────────────────────────── */}
      {matchedUsers.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider px-2" style={{ color: "var(--t2)" }}>
            Users & Directory ({matchedUsers.length})
          </div>
          {matchedUsers.slice(0, 3).map((u) => (
            <div
              key={u.id}
              onClick={() => {
                if (currentRole === "ADMIN") onNavigatePage("users");
                else onNavigatePage("profile");
                onClearSearch();
              }}
              className="p-2 rounded-xl border hover:border-[var(--acc)] cursor-pointer flex items-center justify-between gap-3 transition group"
              style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={
                    u.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      u.name || u.email || "User"
                    )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`
                  }
                  className="h-7 w-7 rounded-full object-cover flex-shrink-0"
                  alt=""
                />
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold truncate group-hover:text-[var(--acc)] transition">
                    {u.name}
                  </div>
                  <div className="text-[10px] truncate" style={{ color: "var(--t2)" }}>
                    {u.email} • {u.idNo || u.universityId || "CSE"}
                  </div>
                </div>
              </div>
              <Pill color={u.role === "ADMIN" ? "#a855f7" : u.role === "SUPERVISOR" ? "#f59e0b" : "#06b6d4"}>
                {u.role}
              </Pill>
            </div>
          ))}
        </div>
      )}

      {/* ── NAVIGATION SHORTCUTS ────────────────────────────────────────── */}
      {matchedNav.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider px-2" style={{ color: "var(--t2)" }}>
            Quick Navigation ({matchedNav.length})
          </div>
          {matchedNav.slice(0, 3).map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.key}
                onClick={() => {
                  onNavigatePage(n.key);
                  onClearSearch();
                }}
                className="p-2.5 rounded-xl border hover:border-[var(--acc)] cursor-pointer flex items-center justify-between gap-3 transition group"
                style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="h-8 w-8 rounded-lg grid place-items-center flex-shrink-0"
                    style={{ background: "var(--srf)", color: "var(--acc)" }}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold group-hover:text-[var(--acc)] transition">
                      {n.label}
                    </div>
                    <div className="text-[10px] truncate" style={{ color: "var(--t2)" }}>
                      {n.desc}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] px-2 py-0.5 rounded-md border font-mono flex items-center gap-1" style={{ borderColor: "var(--bdr)", color: "var(--t3)" }}>
                  Jump <ArrowRight size={10} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GlobalSearchDropdown;
