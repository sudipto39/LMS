// src/screens/project/tabs/ProjectProgressTab.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  BarChart3,
  GitCommit,
  CheckCircle2,
  FileCode,
  FolderGit2,
  Layers,
  CloudUpload,
  AlertCircle,
  Play,
  MessageSquare,
  Star,
  Activity,
  Search,
  User as UserIcon,
  Paperclip,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, Card2, Pill } from "../../../components/common/UIPrimitives";
import { activitiesApi } from "../../../api";
import type { Milestone, ProjectFile, ActivityItem, Feedback } from "../../../types";

export interface ProjectProgressTabProps {
  projectId?: string;
  totalMilestonesCount: number;
  approvedMilestonesCount: number;
  liveFilesCount: number;
  dynamicVelocity: number;
  liveMilestones?: Milestone[];
  liveFiles?: ProjectFile[];
  commitDiffData?: any;
  projectCreatedAt?: string;
  feedbacks?: Feedback[];
}

export interface UnifiedProjectActivity {
  id: string;
  category: "commit" | "milestone" | "feedback" | "file" | "project";
  type: string;
  title: string;
  description?: string;
  author: string;
  avatar?: string;
  date: string;
  badge?: string;
  badgeColor?: string;
  attachments?: any[];
  sha?: string;
}

const formatRelativeTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export const ProjectProgressTab: React.FC<ProjectProgressTabProps> = ({
  projectId,
  totalMilestonesCount,
  approvedMilestonesCount,
  liveFilesCount,
  dynamicVelocity,
  liveMilestones = [],
  liveFiles = [],
  commitDiffData,
  projectCreatedAt,
  feedbacks = [],
}) => {
  const [projectActivities, setProjectActivities] = useState<ActivityItem[]>([]);
  const [chartMetric, setChartMetric] = useState<"all" | "commits" | "milestones" | "feedback">("all");
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<"all" | "commit" | "milestone" | "feedback" | "file">("all");
  const [activitySearchQuery, setActivitySearchQuery] = useState<string>("");
  const [activityLimit, setActivityLimit] = useState<number>(8);

  // ── Fetch authoritative real project activities from server ───────────
  useEffect(() => {
    if (!projectId) return;
    let isMounted = true;

    activitiesApi
      .getProjectActivities(projectId)
      .then((res) => {
        if (isMounted && res?.data && Array.isArray(res.data)) {
          setProjectActivities(res.data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch project activities for progress tab:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // ── Compute Real Lines of Code from live files ──────────────────────────────
  const totalFileLines = useMemo(() => {
    if (!Array.isArray(liveFiles) || liveFiles.length === 0) return 0;
    return liveFiles.reduce((acc, f) => {
      if (f.content && typeof f.content === "string") {
        return acc + f.content.split("\n").length;
      }
      return acc;
    }, 0);
  }, [liveFiles]);

  const realAdditions = useMemo(() => {
    const diffAdditions = commitDiffData?.stats?.additions;
    if (typeof diffAdditions === "number" && diffAdditions > 0) return diffAdditions;
    if (totalFileLines > 0) return totalFileLines;
    return 0;
  }, [commitDiffData, totalFileLines]);

  const realDeletions = useMemo(() => {
    const diffDeletions = commitDiffData?.stats?.deletions;
    if (typeof diffDeletions === "number") return diffDeletions;
    return 0;
  }, [commitDiffData]);

  // ── Combine and Deduplicate ALL Real Project Activities ────────────────────
  const unifiedActivities = useMemo(() => {
    const list: UnifiedProjectActivity[] = [];
    const seenSignatures = new Set<string>();

    // 1. Authoritative activities from backend API
    projectActivities.forEach((act) => {
      const payload = (act.payload || {}) as any;
      const actType = act.type || "commit";
      const normalizedType = actType.toUpperCase();

      let category: UnifiedProjectActivity["category"] = "project";
      let badge = actType;
      let badgeColor = "#06b6d4";

      if (
        normalizedType === "PUSH" ||
        normalizedType === "COMMIT" ||
        normalizedType === "CODE_COMMITTED"
      ) {
        category = "commit";
        badge = payload.hash ? String(payload.hash).slice(0, 7) : "COMMIT";
        badgeColor = "#06b6d4";
      } else if (normalizedType.includes("MILESTONE")) {
        category = "milestone";
        if (normalizedType.includes("APPROVED")) {
          badge = "APPROVED";
          badgeColor = "#22c55e";
        } else if (normalizedType.includes("SUBMITTED")) {
          badge = "SUBMITTED";
          badgeColor = "#06b6d4";
        } else if (normalizedType.includes("REJECTED")) {
          badge = "CHANGES REQUESTED";
          badgeColor = "#ef4444";
        } else if (normalizedType.includes("STARTED")) {
          badge = "STARTED";
          badgeColor = "#f59e0b";
        } else {
          badge = "MILESTONE";
          badgeColor = "#a855f7";
        }
      } else if (normalizedType.includes("FEEDBACK")) {
        category = "feedback";
        badge = "FEEDBACK";
        badgeColor = "#6366f1";
      } else if (normalizedType.includes("FILE") || normalizedType === "REPO_SYNCED") {
        category = "file";
        badge = "SYNC";
        badgeColor = "#3b82f6";
      } else if (normalizedType === "PROJECT_CREATED") {
        category = "project";
        badge = "INITIALIZED";
        badgeColor = "#10b981";
      } else if (normalizedType === "PROJECT_GRADED") {
        category = "project";
        badge = "GRADED";
        badgeColor = "#eab308";
      }

      const dateStr = act.time || payload.timestamp || (act as any).createdAt || new Date().toISOString();
      const sig = `${category}_${payload.hash || act.msg || act.id}_${dateStr.slice(0, 10)}`;

      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        list.push({
          id: act.id,
          category,
          type: actType,
          title: act.msg || payload.message || "Project activity",
          description: act.detail || payload.detail || payload.feedback || payload.studentNotes || "",
          author: act.user || payload.author || "Team Member",
          avatar: act.avatar,
          date: dateStr,
          badge,
          badgeColor,
          attachments: payload.files || (payload.attachments ? payload.attachments : undefined),
          sha: payload.hash ? String(payload.hash).slice(0, 7) : undefined,
        });
      }
    });

    // 2. Gitea repository recentCommits (if not already recorded in activities)
    if (Array.isArray(commitDiffData?.recentCommits)) {
      commitDiffData.recentCommits.forEach((c: any) => {
        const rawSha = c.sha || c.fullSha;
        const shortSha = rawSha ? String(rawSha).slice(0, 7) : "";
        const dateStr = c.date || new Date().toISOString();
        const sig = `commit_${shortSha}_${dateStr.slice(0, 10)}`;

        if (shortSha && !seenSignatures.has(sig)) {
          seenSignatures.add(sig);
          list.push({
            id: `git-${shortSha}`,
            category: "commit",
            type: "commit",
            title: c.message || "Repository commit",
            description: `Commit ${shortSha} • ${c.filesCount || 1} file(s) updated in repository`,
            author: c.author || "Developer",
            date: dateStr,
            badge: shortSha,
            badgeColor: "#06b6d4",
            sha: shortSha,
          });
        }
      });
    }

    // 3. Live Project Milestones state events (ensure submissions/approvals are never missed)
    liveMilestones.forEach((m) => {
      // Milestone Approved
      if (m.status === "APPROVED" || m.reviewedAt) {
        const d = m.reviewedAt || (m as any).updatedAt || projectCreatedAt || new Date().toISOString();
        const sig = `milestone_approved_${m.id}_${d.slice(0, 10)}`;
        if (!seenSignatures.has(sig)) {
          seenSignatures.add(sig);
          list.push({
            id: `ms-appr-${m.id}`,
            category: "milestone",
            type: "MILESTONE_APPROVED",
            title: `Supervisor approved "${m.title}"`,
            description: m.feedback
              ? `Supervisor review remarks: "${m.feedback}"`
              : "Milestone deliverables evaluated and successfully accepted.",
            author: "Supervisor",
            date: d,
            badge: "APPROVED",
            badgeColor: "#22c55e",
          });
        }
      }

      // Milestone Submitted / Deliverables
      if (m.status === "SUBMITTED" || m.submittedAt || (m.attachments && m.attachments.length > 0)) {
        const d = m.submittedAt || (m as any).updatedAt || new Date().toISOString();
        const sig = `milestone_submitted_${m.id}_${d.slice(0, 10)}`;
        if (!seenSignatures.has(sig)) {
          seenSignatures.add(sig);
          list.push({
            id: `ms-sub-${m.id}`,
            category: "milestone",
            type: "MILESTONE_SUBMITTED",
            title: `Deliverables submitted for "${m.title}"`,
            description: m.studentNotes
              ? `Submission remarks: "${m.studentNotes}"`
              : m.attachments?.length
              ? `${m.attachments.length} deliverable attachment(s) uploaded to S3`
              : "Deliverables package submitted for academic review.",
            author: "Student Team",
            date: d,
            badge: "SUBMITTED",
            badgeColor: "#06b6d4",
            attachments: m.attachments,
          });
        }
      }

      // Milestone Changes Requested / Rejected
      if (m.status === "REJECTED") {
        const d = m.reviewedAt || (m as any).updatedAt || new Date().toISOString();
        const sig = `milestone_rejected_${m.id}_${d.slice(0, 10)}`;
        if (!seenSignatures.has(sig)) {
          seenSignatures.add(sig);
          list.push({
            id: `ms-rej-${m.id}`,
            category: "milestone",
            type: "MILESTONE_REJECTED",
            title: `Changes requested on "${m.title}"`,
            description: m.feedback
              ? `Required revisions: "${m.feedback}"`
              : "Supervisor requested revisions on milestone deliverables.",
            author: "Supervisor",
            date: d,
            badge: "CHANGES REQUESTED",
            badgeColor: "#ef4444",
          });
        }
      }

      // Milestone Started
      if (m.status === "IN_PROGRESS") {
        const d = (m as any).updatedAt || projectCreatedAt || new Date().toISOString();
        const sig = `milestone_started_${m.id}_${d.slice(0, 10)}`;
        if (!seenSignatures.has(sig)) {
          seenSignatures.add(sig);
          list.push({
            id: `ms-start-${m.id}`,
            category: "milestone",
            type: "MILESTONE_STARTED",
            title: `Started working on "${m.title}"`,
            description: m.note || "Phase execution is underway.",
            author: "Student Team",
            date: d,
            badge: "IN PROGRESS",
            badgeColor: "#f59e0b",
          });
        }
      }
    });

    // 4. Live Feedback items
    feedbacks.forEach((fb) => {
      const d = fb.createdAt || fb.time || new Date().toISOString();
      const sig = `feedback_${fb.id}_${d.slice(0, 10)}`;
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        list.push({
          id: `fb-${fb.id}`,
          category: "feedback",
          type: "FEEDBACK_POSTED",
          title: `Feedback from ${fb.author}`,
          description: fb.content,
          author: fb.author,
          avatar: fb.avatar,
          date: d,
          badge: fb.resolved ? "RESOLVED" : "FEEDBACK",
          badgeColor: fb.resolved ? "#22c55e" : "#6366f1",
        });
      }

      if (Array.isArray(fb.replies)) {
        fb.replies.forEach((rep) => {
          const repDate = rep.createdAt || rep.time || d;
          const repSig = `feedback_reply_${rep.id}_${repDate.slice(0, 10)}`;
          if (!seenSignatures.has(repSig)) {
            seenSignatures.add(repSig);
            list.push({
              id: `fb-rep-${rep.id}`,
              category: "feedback",
              type: "FEEDBACK_REPLY",
              title: `Reply from ${rep.author}`,
              description: rep.content,
              author: rep.author,
              avatar: rep.avatar,
              date: repDate,
              badge: "REPLY",
              badgeColor: "#3b82f6",
            });
          }
        });
      }
    });

    // 5. Project Initialization Event
    if (projectCreatedAt) {
      const sig = `project_created_${projectCreatedAt.slice(0, 10)}`;
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        list.push({
          id: "proj-init",
          category: "project",
          type: "PROJECT_CREATED",
          title: "Capstone Project Initialized",
          description: "Repository initialized, milestone roadmap mapped, and team workspace activated.",
          author: "System",
          date: projectCreatedAt,
          badge: "INITIALIZED",
          badgeColor: "#10b981",
        });
      }
    }

    // Sort chronologically descending
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [projectActivities, commitDiffData, liveMilestones, feedbacks, projectCreatedAt]);

  // ── Filtered Activities for the Feed ────────────────────────────────────────
  const filteredActivities = useMemo(() => {
    return unifiedActivities.filter((act) => {
      // Category filter
      if (activityCategoryFilter !== "all" && act.category !== activityCategoryFilter) {
        return false;
      }
      // Search query filter
      if (activitySearchQuery.trim()) {
        const q = activitySearchQuery.toLowerCase().trim();
        return (
          act.title.toLowerCase().includes(q) ||
          (act.description && act.description.toLowerCase().includes(q)) ||
          act.author.toLowerCase().includes(q) ||
          (act.badge && act.badge.toLowerCase().includes(q)) ||
          act.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [unifiedActivities, activityCategoryFilter, activitySearchQuery]);

  // ── Category Counts for Tabs ────────────────────────────────────────────────
  const counts = useMemo(() => {
    return {
      all: unifiedActivities.length,
      commit: unifiedActivities.filter((a) => a.category === "commit").length,
      milestone: unifiedActivities.filter((a) => a.category === "milestone").length,
      feedback: unifiedActivities.filter((a) => a.category === "feedback").length,
      file: unifiedActivities.filter((a) => a.category === "file").length,
    };
  }, [unifiedActivities]);

  // ── Generate Dynamic 12-Week Activity Window (Aggregates ALL Events) ───────
  const { weeklyActivity, totalActivitiesCount, activeWeeksCount, maxWeeklyCount } = useMemo(() => {
    const now = new Date();
    const weeks: Array<{
      w: string;
      dateRange: string;
      total: number;
      commits: number;
      milestones: number;
      feedback: number;
      other: number;
    }> = [];

    let total = 0;
    let activeWeeks = 0;

    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const label = `W${12 - i}`;
      const dateRange = `${weekStart.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })} - ${weekEnd.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })}`;

      const inWeek = unifiedActivities.filter((act) => {
        const d = new Date(act.date).getTime();
        return d >= weekStart.getTime() && d < weekEnd.getTime();
      });

      const commits = inWeek.filter((a) => a.category === "commit").length;
      const milestones = inWeek.filter((a) => a.category === "milestone").length;
      const feedback = inWeek.filter((a) => a.category === "feedback").length;
      const other = inWeek.length - commits - milestones - feedback;

      let selectedMetricCount = inWeek.length;
      if (chartMetric === "commits") selectedMetricCount = commits;
      else if (chartMetric === "milestones") selectedMetricCount = milestones;
      else if (chartMetric === "feedback") selectedMetricCount = feedback;

      if (selectedMetricCount > 0) activeWeeks++;
      total += selectedMetricCount;

      weeks.push({
        w: label,
        dateRange,
        total: inWeek.length,
        commits,
        milestones,
        feedback,
        other,
      });
    }

    const max = Math.max(
      ...weeks.map((w) => {
        if (chartMetric === "commits") return w.commits;
        if (chartMetric === "milestones") return w.milestones;
        if (chartMetric === "feedback") return w.feedback;
        return w.total;
      })
    );

    return {
      weeklyActivity: weeks,
      totalActivitiesCount: total,
      activeWeeksCount: activeWeeks,
      maxWeeklyCount: max > 0 ? max : 10,
    };
  }, [unifiedActivities, chartMetric]);

  // Milestone breakdown
  const inProgressMilestonesCount = useMemo(
    () => liveMilestones.filter((m) => m.status === "IN_PROGRESS").length,
    [liveMilestones]
  );
  const submittedMilestonesCount = useMemo(
    () => liveMilestones.filter((m) => m.status === "SUBMITTED").length,
    [liveMilestones]
  );
  const pendingMilestonesCount = useMemo(
    () => liveMilestones.filter((m) => m.status === "PENDING").length,
    [liveMilestones]
  );

  return (
    <div className="space-y-6">
      {/* ── Top 4 Dynamic KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Milestones */}
        <Card className="p-4">
          <div
            className="text-[11px] uppercase font-bold tracking-wider"
            style={{ color: "var(--t2)" }}
          >
            Total Milestones
          </div>
          <div className="text-[22px] font-bold mt-1 text-[#06b6d4]">
            {totalMilestonesCount}
          </div>
          <div className="text-[10px] text-[#22c55e] mt-1 flex items-center gap-1">
            <TrendingUp size={11} /> {approvedMilestonesCount} approved
            {inProgressMilestonesCount > 0 && ` • ${inProgressMilestonesCount} active`}
          </div>
        </Card>

        {/* Card 2: Lines Added / Codebase Scale */}
        <Card className="p-4">
          <div
            className="text-[11px] uppercase font-bold tracking-wider"
            style={{ color: "var(--t2)" }}
          >
            Lines Added
          </div>
          <div className="text-[22px] font-bold mt-1 text-[#22c55e]">
            {realAdditions > 0 ? `+${realAdditions.toLocaleString()}` : "0"}
          </div>
          <div className="text-[10px]" style={{ color: "var(--t3)" }}>
            Across {liveFilesCount} repository files
          </div>
        </Card>

        {/* Card 3: Lines Removed / Churn */}
        <Card className="p-4">
          <div
            className="text-[11px] uppercase font-bold tracking-wider"
            style={{ color: "var(--t2)" }}
          >
            Lines Removed
          </div>
          <div className="text-[22px] font-bold mt-1 text-[#ef4444]">
            {realDeletions > 0 ? `−${realDeletions.toLocaleString()}` : "0"}
          </div>
          <div className="text-[10px]" style={{ color: "var(--t3)" }}>
            {realDeletions > 0 ? "Refactoring churn" : "Clean repository tree"}
          </div>
        </Card>

        {/* Card 4: Milestone Velocity */}
        <Card className="p-4">
          <div
            className="text-[11px] uppercase font-bold tracking-wider"
            style={{ color: "var(--t2)" }}
          >
            Milestone Velocity
          </div>
          <div className="text-[22px] font-bold mt-1 text-[#a855f7]">
            {dynamicVelocity}%
          </div>
          <div className="text-[10px]" style={{ color: "var(--t3)" }}>
            {dynamicVelocity === 100
              ? "Project completed 🎉"
              : dynamicVelocity >= 70
              ? "On track for defense"
              : dynamicVelocity > 0
              ? "In active development"
              : "Pending milestone kickoff"}
          </div>
        </Card>
      </div>

      {/* ── Weekly Project Activity Chart (Aggregates All Project Events) ────── */}
      <Card className="p-5">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4">
          <div>
            <h4 className="font-semibold text-[13px] flex items-center gap-2">
              <BarChart3 size={15} style={{ color: "var(--acc)" }} /> Weekly Project Activity
            </h4>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--t2)" }}>
              Aggregated from live Gitea repository branch history, milestone deliverables, feedback, and project events
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Metric Selector Pills */}
            <div
              className="flex items-center p-0.5 rounded-lg border text-[11px]"
              style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
            >
              <button
                type="button"
                onClick={() => setChartMetric("all")}
                className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                  chartMetric === "all"
                    ? "bg-[#06b6d4] text-white shadow-xs font-semibold"
                    : "text-[var(--t2)] hover:text-[var(--t1)]"
                }`}
              >
                All Events
              </button>
              <button
                type="button"
                onClick={() => setChartMetric("commits")}
                className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                  chartMetric === "commits"
                    ? "bg-[#06b6d4] text-white shadow-xs font-semibold"
                    : "text-[var(--t2)] hover:text-[var(--t1)]"
                }`}
              >
                Commits
              </button>
              <button
                type="button"
                onClick={() => setChartMetric("milestones")}
                className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                  chartMetric === "milestones"
                    ? "bg-[#06b6d4] text-white shadow-xs font-semibold"
                    : "text-[var(--t2)] hover:text-[var(--t1)]"
                }`}
              >
                Milestones
              </button>
              <button
                type="button"
                onClick={() => setChartMetric("feedback")}
                className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                  chartMetric === "feedback"
                    ? "bg-[#06b6d4] text-white shadow-xs font-semibold"
                    : "text-[var(--t2)] hover:text-[var(--t1)]"
                }`}
              >
                Feedback
              </button>
            </div>

            <Pill color={totalActivitiesCount > 0 ? "#06b6d4" : undefined}>
              {totalActivitiesCount > 0
                ? `${activeWeeksCount} Active Weeks • ${totalActivitiesCount} ${
                    chartMetric === "all"
                      ? "Events"
                      : chartMetric === "commits"
                      ? "Commits"
                      : chartMetric === "milestones"
                      ? "Milestone Events"
                      : "Feedbacks"
                  }`
                : "0 Events Recorded"}
            </Pill>
          </div>
        </div>

        {totalActivitiesCount === 0 ? (
          <div
            className="rounded-xl border p-6 text-center space-y-2"
            style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
          >
            <Activity size={24} className="mx-auto opacity-40 text-[#06b6d4]" />
            <div className="text-[13px] font-semibold">No Activities Recorded Yet</div>
            <p className="text-[11px] max-w-[480px] mx-auto" style={{ color: "var(--t3)" }}>
              Push commits to the repository, submit milestone deliverables, or exchange feedback to see live weekly activity metrics.
            </p>
          </div>
        ) : (
          <div
            className="h-44 flex items-end justify-between gap-2 pt-6 px-2 border-b custom-scrollbar overflow-x-auto"
            style={{ borderColor: "var(--bdr)" }}
          >
            {weeklyActivity.map((bar) => {
              let barCount = bar.total;
              if (chartMetric === "commits") barCount = bar.commits;
              else if (chartMetric === "milestones") barCount = bar.milestones;
              else if (chartMetric === "feedback") barCount = bar.feedback;

              const heightPx =
                barCount > 0
                  ? Math.max(14, Math.round((barCount / maxWeeklyCount) * 110))
                  : 4;

              const tooltipText = `${bar.w} (${bar.dateRange}): ${bar.total} total (${bar.commits} commits, ${bar.milestones} milestone events, ${bar.feedback} feedback)`;

              return (
                <div
                  key={bar.w}
                  className="flex-1 min-w-[28px] flex flex-col items-center gap-2 group relative"
                  title={tooltipText}
                >
                  <div className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 whitespace-nowrap z-20 px-2 py-0.5 rounded-md bg-black/85 text-white dark:bg-white dark:text-black pointer-events-none shadow-md">
                    {barCount} {barCount === 1 ? "activity" : "activities"}
                  </div>
                  <div
                    className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                      barCount > 0
                        ? chartMetric === "milestones"
                          ? "bg-gradient-to-t from-[#059669] to-[#10b981] group-hover:scale-105"
                          : chartMetric === "feedback"
                          ? "bg-gradient-to-t from-[#4f46e5] to-[#818cf8] group-hover:scale-105"
                          : "bg-gradient-to-t from-[#0891b2] to-[#22d3ee] group-hover:scale-105"
                        : "bg-black/10 dark:bg-white/10"
                    }`}
                    style={{ height: `${heightPx}px` }}
                  />
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: "var(--t3)" }}
                  >
                    {bar.w}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Milestone Progress Pipeline ───────────────────────────────────── */}
      {liveMilestones.length > 0 && (
        <Card className="p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-[13px] flex items-center gap-2">
                <Layers size={15} style={{ color: "var(--acc)" }} /> Milestone Delivery Pipeline
              </h4>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--t2)" }}>
                {approvedMilestonesCount} of {totalMilestonesCount} phases approved by academic supervisor
              </p>
            </div>
            <div className="text-[11px] font-medium" style={{ color: "var(--t2)" }}>
              {submittedMilestonesCount} in review • {pendingMilestonesCount} pending
            </div>
          </div>

          <div className="space-y-2.5">
            {liveMilestones.map((m, idx) => {
              const isApproved = m.status === "APPROVED";
              const isSubmitted = m.status === "SUBMITTED";
              const isInProgress = m.status === "IN_PROGRESS";

              return (
                <Card2
                  key={m.id || idx}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${
                        isApproved
                          ? "bg-green-500/15 text-green-500 border border-green-500/30"
                          : isSubmitted
                          ? "bg-cyan-500/15 text-cyan-500 border border-cyan-500/30"
                          : isInProgress
                          ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                          : "bg-black/5 dark:bg-white/5 text-[var(--t3)]"
                      }`}
                    >
                      {isApproved ? <CheckCircle2 size={16} /> : m.order || idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-[13px]">{m.title}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--t3)" }}>
                        Due: {m.due || "TBD"} • {m.files || m.attachments?.length || 0} deliverable attachments
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Pill
                      color={
                        isApproved
                          ? "#22c55e"
                          : isSubmitted
                          ? "#06b6d4"
                          : isInProgress
                          ? "#f59e0b"
                          : undefined
                      }
                    >
                      {m.status}
                    </Pill>
                  </div>
                </Card2>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Comprehensive Project Activity Stream & Audit Log ─────────────── */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
          <div>
            <h4 className="font-semibold text-[13px] flex items-center gap-2">
              <Activity size={16} style={{ color: "var(--acc)" }} /> Project Activity Log & History
            </h4>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--t2)" }}>
              Chronological log of all commits, milestone submissions, supervisor reviews, feedback, and team events on this project
            </p>
          </div>

          <Pill color="#06b6d4">
            {counts.all} Total Recorded Activities
          </Pill>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-1 border-t" style={{ borderColor: "var(--bdr)" }}>
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActivityCategoryFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                activityCategoryFilter === "all"
                  ? "bg-[#06b6d4] text-white border-[#06b6d4] font-semibold"
                  : "hover:bg-[var(--srf2)]"
              }`}
              style={{
                borderColor: activityCategoryFilter === "all" ? undefined : "var(--bdr)",
                background: activityCategoryFilter === "all" ? undefined : "var(--srf)",
                color: activityCategoryFilter === "all" ? undefined : "var(--t2)",
              }}
            >
              All ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setActivityCategoryFilter("commit")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                activityCategoryFilter === "commit"
                  ? "bg-[#06b6d4] text-white border-[#06b6d4] font-semibold"
                  : "hover:bg-[var(--srf2)]"
              }`}
              style={{
                borderColor: activityCategoryFilter === "commit" ? undefined : "var(--bdr)",
                background: activityCategoryFilter === "commit" ? undefined : "var(--srf)",
                color: activityCategoryFilter === "commit" ? undefined : "var(--t2)",
              }}
            >
              <GitCommit size={12} /> Commits ({counts.commit})
            </button>
            <button
              type="button"
              onClick={() => setActivityCategoryFilter("milestone")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                activityCategoryFilter === "milestone"
                  ? "bg-[#06b6d4] text-white border-[#06b6d4] font-semibold"
                  : "hover:bg-[var(--srf2)]"
              }`}
              style={{
                borderColor: activityCategoryFilter === "milestone" ? undefined : "var(--bdr)",
                background: activityCategoryFilter === "milestone" ? undefined : "var(--srf)",
                color: activityCategoryFilter === "milestone" ? undefined : "var(--t2)",
              }}
            >
              <Layers size={12} /> Milestones ({counts.milestone})
            </button>
            <button
              type="button"
              onClick={() => setActivityCategoryFilter("feedback")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                activityCategoryFilter === "feedback"
                  ? "bg-[#06b6d4] text-white border-[#06b6d4] font-semibold"
                  : "hover:bg-[var(--srf2)]"
              }`}
              style={{
                borderColor: activityCategoryFilter === "feedback" ? undefined : "var(--bdr)",
                background: activityCategoryFilter === "feedback" ? undefined : "var(--srf)",
                color: activityCategoryFilter === "feedback" ? undefined : "var(--t2)",
              }}
            >
              <MessageSquare size={12} /> Feedback ({counts.feedback})
            </button>
            {counts.file > 0 && (
              <button
                type="button"
                onClick={() => setActivityCategoryFilter("file")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                  activityCategoryFilter === "file"
                    ? "bg-[#06b6d4] text-white border-[#06b6d4] font-semibold"
                    : "hover:bg-[var(--srf2)]"
                }`}
                style={{
                  borderColor: activityCategoryFilter === "file" ? undefined : "var(--bdr)",
                  background: activityCategoryFilter === "file" ? undefined : "var(--srf)",
                  color: activityCategoryFilter === "file" ? undefined : "var(--t2)",
                }}
              >
                <FileCode size={12} /> Files ({counts.file})
              </button>
            )}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-56">
            <Search size={13} className="absolute left-2.5 top-2.5 text-[var(--t3)]" />
            <input
              type="text"
              placeholder="Search project activity..."
              value={activitySearchQuery}
              onChange={(e) => setActivitySearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border focus:outline-none focus:border-[#06b6d4] transition"
              style={{
                background: "var(--srf)",
                borderColor: "var(--bdr)",
                color: "var(--t1)",
              }}
            />
          </div>
        </div>

        {/* Activity Items List */}
        {filteredActivities.length === 0 ? (
          <div
            className="p-8 text-center rounded-xl border space-y-2"
            style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
          >
            <Activity size={22} className="mx-auto opacity-30" style={{ color: "var(--t2)" }} />
            <div className="text-[13px] font-medium" style={{ color: "var(--t2)" }}>
              No activities match your current filter
            </div>
            {activitySearchQuery && (
              <button
                type="button"
                onClick={() => setActivitySearchQuery("")}
                className="text-xs text-[#06b6d4] underline cursor-pointer hover:opacity-80"
              >
                Clear search filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredActivities.slice(0, activityLimit).map((act) => {
              // Choose icon & style based on activity category and type
              let IconComponent = Activity;
              let iconColor = "#06b6d4";
              let iconBg = "#06b6d415";
              let iconBorder = "#06b6d430";

              if (act.category === "commit") {
                IconComponent = GitCommit;
                iconColor = "#06b6d4";
                iconBg = "#06b6d415";
                iconBorder = "#06b6d430";
              } else if (act.category === "milestone") {
                if (act.type.includes("APPROVED")) {
                  IconComponent = CheckCircle2;
                  iconColor = "#22c55e";
                  iconBg = "#22c55e15";
                  iconBorder = "#22c55e30";
                } else if (act.type.includes("SUBMITTED")) {
                  IconComponent = CloudUpload;
                  iconColor = "#06b6d4";
                  iconBg = "#06b6d415";
                  iconBorder = "#06b6d430";
                } else if (act.type.includes("REJECTED")) {
                  IconComponent = AlertCircle;
                  iconColor = "#ef4444";
                  iconBg = "#ef444415";
                  iconBorder = "#ef444430";
                } else if (act.type.includes("STARTED")) {
                  IconComponent = Play;
                  iconColor = "#f59e0b";
                  iconBg = "#f59e0b15";
                  iconBorder = "#f59e0b30";
                } else {
                  IconComponent = Layers;
                  iconColor = "#a855f7";
                  iconBg = "#a855f715";
                  iconBorder = "#a855f730";
                }
              } else if (act.category === "feedback") {
                IconComponent = MessageSquare;
                iconColor = "#6366f1";
                iconBg = "#6366f115";
                iconBorder = "#6366f130";
              } else if (act.category === "file") {
                IconComponent = FileCode;
                iconColor = "#3b82f6";
                iconBg = "#3b82f615";
                iconBorder = "#3b82f630";
              } else if (act.category === "project") {
                if (act.type === "PROJECT_CREATED") {
                  IconComponent = FolderGit2;
                  iconColor = "#10b981";
                  iconBg = "#10b98115";
                  iconBorder = "#10b98130";
                } else if (act.type === "PROJECT_GRADED") {
                  IconComponent = Star;
                  iconColor = "#eab308";
                  iconBg = "#eab30815";
                  iconBorder = "#eab30830";
                }
              }

              return (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-[12px] transition hover:border-[var(--acc)] group"
                  style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Activity Icon Box */}
                    <div
                      className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5"
                      style={{
                        background: iconBg,
                        borderColor: iconBorder,
                        color: iconColor,
                      }}
                    >
                      <IconComponent size={15} />
                    </div>

                    {/* Activity Text & Details */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {act.sha && (
                          <span className="font-mono px-1.5 py-0.5 rounded text-[10px] bg-black/10 dark:bg-white/10 shrink-0 text-[#06b6d4] font-bold">
                            {act.sha}
                          </span>
                        )}
                        <span className="font-semibold text-[13px] text-[var(--t1)]">
                          {act.title}
                        </span>
                        {act.badge && (
                          <Pill color={act.badgeColor} className="text-[10px] py-0 px-2">
                            {act.badge}
                          </Pill>
                        )}
                      </div>

                      {act.description && (
                        <div
                          className="text-[12px] rounded-lg p-2 mt-1 border"
                          style={{
                            background: "var(--srf)",
                            borderColor: "var(--bdr)",
                            color: "var(--t2)",
                          }}
                        >
                          {act.description}
                        </div>
                      )}

                      {/* Attachments Pills (if any) */}
                      {act.attachments && act.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {act.attachments.map((att: any, aIdx: number) => {
                            const name = typeof att === "string" ? att : att?.name || `File ${aIdx + 1}`;
                            return (
                              <span
                                key={aIdx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border"
                                style={{
                                  background: "var(--srf)",
                                  borderColor: "var(--bdr)",
                                  color: "var(--acc)",
                                }}
                              >
                                <Paperclip size={10} />
                                <span className="truncate max-w-[160px]">{name}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Meta Footer */}
                      <div
                        className="flex items-center gap-2 text-[11px] pt-1"
                        style={{ color: "var(--t3)" }}
                      >
                        <span className="flex items-center gap-1 font-medium text-[var(--t2)]">
                          {act.avatar ? (
                            <img
                              src={act.avatar}
                              alt={act.author}
                              className="h-4 w-4 rounded-full"
                            />
                          ) : (
                            <UserIcon size={11} />
                          )}
                          {act.author}
                        </span>
                        <span>•</span>
                        <span title={new Date(act.date).toLocaleString()}>
                          {formatRelativeTime(act.date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Relative / absolute date badge */}
                  <div
                    className="text-[11px] shrink-0 self-end sm:self-start opacity-70 font-mono"
                    style={{ color: "var(--t3)" }}
                  >
                    {new Date(act.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              );
            })}

            {/* Pagination / Expand Toggle */}
            {filteredActivities.length > activityLimit && (
              <button
                type="button"
                onClick={() => setActivityLimit((prev) => prev + 10)}
                className="w-full py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer hover:bg-[var(--srf2)] text-[#06b6d4]"
                style={{ borderColor: "var(--bdr)" }}
              >
                <ChevronDown size={14} /> Show {filteredActivities.length - activityLimit} More Activities
              </button>
            )}

            {activityLimit > 8 && filteredActivities.length <= activityLimit && (
              <button
                type="button"
                onClick={() => setActivityLimit(8)}
                className="w-full py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer hover:underline text-[var(--t3)]"
              >
                <ChevronUp size={14} /> Collapse Activity Log
              </button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProjectProgressTab;
