import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Clock,
  CheckCircle2,
  Flame,
  Activity,
  GitCommitHorizontal,
  MessageCircle,
  Server,
  Plus,
  Calendar,
  RotateCcw,
} from "lucide-react";
import { Card, Card2, Btn, Btn2, Pill } from "../components/common/UIPrimitives";
import { useTheme } from "../context/ThemeContext";
import { activitiesApi, type CommitHeatmapData } from "../api/activities";
import type { Project, Milestone, ActivityItem } from "../types";

interface StudentDashboardProps {
  projects: Project[];
  milestones: Milestone[];
  activities: ActivityItem[];
  onOpenCreateModal: () => void;
  onSelectProject: (projectId: string) => void;
  onNavigate: (page: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  projects,
  milestones,
  activities,
  onOpenCreateModal,
  onSelectProject,
  onNavigate,
}) => {
  const { dark } = useTheme();
  const [heatmap, setHeatmap] = useState<CommitHeatmapData | null>(null);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);

  const fetchHeatmap = () => {
    setLoadingHeatmap(true);
    activitiesApi
      .getCommitHeatmap()
      .then((res) => {
        if (res?.data) {
          setHeatmap(res.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoadingHeatmap(false);
      });
  };

  useEffect(() => {
    fetchHeatmap();
  }, [projects.length, activities.length]);

  // ── Calculate Upcoming Deadline ──────────────────────────────────────────
  const upcomingDeadlineInfo = useMemo(() => {
    const validCandidates = (milestones || [])
      .filter((m) => m && m.status !== "APPROVED")
      .map((m) => {
        const rawDate = m.dueDate || m.due;
        const parsed = rawDate ? new Date(rawDate) : null;
        const isValid = parsed && !isNaN(parsed.getTime());
        return {
          milestone: m,
          date: isValid ? parsed : null,
          time: isValid ? parsed!.getTime() : Infinity,
        };
      })
      .filter((item) => item.date !== null);

    if (validCandidates.length === 0) {
      return {
        dateText: "All Done",
        badgeText: "Completed",
        fullDate: "No pending milestone deadlines",
      };
    }

    const now = Date.now();
    const futureOrToday = validCandidates.filter((c) => c.time >= now - 86400000);
    const sorted = (futureOrToday.length > 0 ? futureOrToday : validCandidates).sort(
      (a, b) => a.time - b.time
    );

    const nearest = sorted[0];
    const d = nearest.date!;
    const formattedDate = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const badge = nearest.milestone.title
      ? nearest.milestone.title.length > 14
        ? nearest.milestone.title.slice(0, 12) + "…"
        : nearest.milestone.title
      : "Next Due";

    return {
      dateText: formattedDate,
      badgeText: badge,
      fullDate: d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
  }, [milestones]);

  // Commit Heatmap calculations (12 weeks)
  const weeks = 12;
  const fallbackDays: number[] = Array(weeks * 7).fill(0);

  const totalCommits = heatmap ? heatmap.totalCommits : 0;
  const currentStreak = heatmap ? heatmap.currentStreak : 0;
  const longestStreak = heatmap ? heatmap.longestStreak : 0;
  const bestDay = heatmap ? (heatmap.bestDay ?? 0) : 0;

  const cellColor = (val: number) =>
    val === 0
      ? dark
        ? "#152535"
        : "#e0f0f5"
      : val <= 2
      ? "#67e8f9"
      : val <= 4
      ? "#22d3ee"
      : val <= 6
      ? "#0891b2"
      : "#0e4a5e";

  const dayLabels = ["Mon", "", "Wed", "", "Fri", "", ""];

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-[20px] sm:text-[24px] font-bold flex items-center gap-2">
            <LayoutDashboard size={20} style={{ color: "var(--acc)" }} />{" "}
            Student Dashboard
          </h1>
          <p className="text-[12px] sm:text-[13px] mt-1" style={{ color: "var(--t2)" }}>
            Track Gitea commits, milestone submissions, and supervisor feedback
          </p>
        </div>
        <Btn onClick={onOpenCreateModal} className="w-full sm:w-auto justify-center">
          <Plus size={14} /> Create Project
        </Btn>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {[
          {
            k: "Active Projects",
            v: `${projects.length}`,
            d: "Phase 1 & 2",
            Icon: FolderKanban,
            color: "#0891b2",
          },
          {
            k: "In Progress",
            v: `${milestones.filter((m) => m.status === "IN_PROGRESS").length}`,
            d: "Milestones",
            Icon: Clock,
            color: "#f59e0b",
          },
          {
            k: "Upcoming Deadline",
            v: upcomingDeadlineInfo.dateText,
            d: upcomingDeadlineInfo.badgeText,
            Icon: Calendar,
            color: "#3b82f6",
          },
          {
            k: "Approved",
            v: `${milestones.filter((m) => m.status === "APPROVED").length}`,
            d: "Completed",
            Icon: CheckCircle2,
            color: "#22c55e",
          },
        ].map((s) => (
          <Card key={s.k} className="p-3.5 sm:p-5 hover:shadow-lg transition-all">
            <div className="flex justify-between items-start gap-2">
              <div
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl grid place-items-center flex-shrink-0"
                style={{ background: `${s.color}15`, color: s.color }}
              >
                <s.Icon size={16} />
              </div>
              <Pill>{s.d}</Pill>
            </div>
            <div
              className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold mt-3 sm:mt-4 truncate"
              style={{ color: "var(--t2)" }}
            >
              {s.k}
            </div>
            <div className="text-[20px] sm:text-[26px] font-bold leading-none mt-1 truncate">
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      {/* GIT COMMIT STREAK HEATMAP */}
      <Card className="p-4 sm:p-5 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div
              className="h-9 w-9 rounded-xl grid place-items-center"
              style={{ background: "#f9731615", color: "#f97316" }}
            >
              <Flame size={17} />
            </div>
            <div>
              <div className="font-semibold text-[13px] flex items-center gap-2">
                Git Commit Streak <Pill color="#f97316">🔥 {currentStreak} days</Pill>
                <button
                  type="button"
                  onClick={fetchHeatmap}
                  disabled={loadingHeatmap}
                  className="p-1 rounded-md text-[var(--t3)] hover:text-[#f97316] transition cursor-pointer disabled:opacity-50"
                  title="Refresh Git Commit Streak"
                >
                  <RotateCcw size={12} className={loadingHeatmap ? "animate-spin" : ""} />
                </button>
              </div>
              <div className="text-[11px]" style={{ color: "var(--t2)" }}>
                Synced via Gitea push webhooks • last 12 weeks
              </div>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div className="text-[16px] font-bold leading-none">{totalCommits}</div>
              <div
                className="text-[10px] uppercase font-bold mt-0.5"
                style={{ color: "var(--t3)" }}
              >
                Commits
              </div>
            </div>
            <div>
              <div className="text-[16px] font-bold leading-none" style={{ color: "#f97316" }}>
                {currentStreak}
              </div>
              <div
                className="text-[10px] uppercase font-bold mt-0.5"
                style={{ color: "var(--t3)" }}
              >
                Current
              </div>
            </div>
            <div>
              <div
                className="text-[16px] font-bold leading-none"
                style={{ color: "var(--acc)" }}
              >
                {longestStreak}
              </div>
              <div
                className="text-[10px] uppercase font-bold mt-0.5"
                style={{ color: "var(--t3)" }}
              >
                Longest
              </div>
            </div>
            <div>
              <div
                className="text-[16px] font-bold leading-none"
                style={{ color: "#22c55e" }}
              >
                {bestDay}
              </div>
              <div
                className="text-[10px] uppercase font-bold mt-0.5"
                style={{ color: "var(--t3)" }}
              >
                Best day
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <div className="flex flex-col gap-1 pr-1 flex-shrink-0">
            {dayLabels.map((d, i) => (
              <div
                key={i}
                className="h-3.5 flex items-center text-[8px] font-bold w-6"
                style={{ color: "var(--t3)" }}
              >
                {d}
              </div>
            ))}
          </div>
          {heatmap && Array.isArray(heatmap.weeks) && heatmap.weeks.length > 0 ? (
            heatmap.weeks.map((w, wIdx) => (
              <div key={w.weekIndex ?? wIdx} className="flex flex-col gap-1 flex-shrink-0">
                {w.days.map((d, dIdx) => (
                  <div
                    key={d.date || dIdx}
                    title={`${d.count} commit${d.count === 1 ? "" : "s"} on ${d.date}`}
                    className="h-3.5 w-3.5 rounded-[4px] transition-all hover:scale-125 cursor-pointer"
                    style={{
                      background: cellColor(d.count),
                      boxShadow: d.count >= 7 ? "0 0 6px rgba(8,145,178,0.5)" : "none",
                    }}
                  />
                ))}
              </div>
            ))
          ) : (
            Array.from({ length: weeks }, (_, w) => (
              <div key={w} className="flex flex-col gap-1 flex-shrink-0">
                {Array.from({ length: 7 }, (_, d) => {
                  const val = fallbackDays[w * 7 + d] || 0;
                  return (
                    <div
                      key={d}
                      title={`${val} commits`}
                      className="h-3.5 w-3.5 rounded-[4px] transition-all hover:scale-125 cursor-pointer"
                      style={{
                        background: cellColor(val),
                        boxShadow:
                          val >= 7 ? "0 0 6px rgba(8,145,178,0.5)" : "none",
                      }}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <Card className="overflow-hidden">
          <div
            className="h-12 px-5 flex items-center justify-between border-b"
            style={{ borderColor: "var(--bdr)", background: "var(--srf2)" }}
          >
            <span className="font-semibold text-[13px] flex items-center gap-2">
              <Activity size={14} style={{ color: "var(--acc)" }} /> Recent
              Activity
            </span>
            <Btn2 onClick={() => onNavigate("activity")}>View all</Btn2>
          </div>
          <div className="p-4 sm:p-5 space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-6 text-[12px]" style={{ color: "var(--t3)" }}>
                No recent activity recorded yet.
              </div>
            ) : (
              activities.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 sm:p-4 rounded-xl border flex gap-3 transition hover:shadow-sm"
                  style={{ borderColor: "var(--bdr)", background: "var(--srf2)" }}
                >
                  <img
                    src={a.avatar}
                    className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] truncate">
                      <b>{a.user}</b>{" "}
                      <span style={{ color: "var(--t2)" }}>{a.msg}</span>{" "}
                      <span
                        style={{ color: "var(--acc)" }}
                        className="font-medium"
                      >
                        {a.project}
                      </span>
                    </div>
                    <div
                      className="text-[11px] mt-1.5 flex items-center gap-2"
                      style={{ color: "var(--t3)" }}
                    >
                      <div
                        className="h-5 w-5 rounded-full grid place-items-center border"
                        style={{
                          borderColor: "var(--bdr)",
                          background: "var(--srf)",
                        }}
                      >
                        {a.type === "commit" ? (
                          <GitCommitHorizontal size={10} />
                        ) : a.type === "feedback" ? (
                          <MessageCircle size={10} />
                        ) : (
                          <CheckCircle2 size={10} />
                        )}
                      </div>
                      <span>{a.time}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-[12px] flex items-center gap-2">
                <FolderKanban size={14} style={{ color: "var(--acc)" }} /> My
                Projects
              </h4>
              <Btn2
                onClick={() => onNavigate("projects")}
                className="text-[11px] !px-2.5 !h-7"
              >
                All
              </Btn2>
            </div>
            <div className="mt-3 space-y-3">
              {projects.map((p) => (
                <Card2
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className="p-3 cursor-pointer hover:shadow-sm transition"
                >
                  <div className="flex justify-between">
                    <span className="font-medium text-[12px] truncate">
                      {p.title}
                    </span>
                    <Pill
                      color={
                        p.status === "APPROVED" ? "#22c55e" : "#0891b2"
                      }
                    >
                      {p.status}
                    </Pill>
                  </div>
                  <div className="text-[11px] mt-1.5 flex items-center justify-between" style={{ color: "var(--t3)" }}>
                    <span>Supervisor:</span>
                    <span className="font-semibold text-[11px] truncate max-w-[160px]" style={{ color: p.supervisorId ? "var(--acc)" : "#f59e0b" }}>
                      {p.supervisor || "Pending Allocation"}
                    </span>
                  </div>
                  <div
                    className="mt-2 h-1 rounded-full overflow-hidden"
                    style={{ background: "var(--bg2)" }}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-[#06b6d4] to-[#2563eb]"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </Card2>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold text-[12px] flex items-center gap-2">
              <Server size={14} style={{ color: "#22c55e" }} /> Gitea Server
              Status
            </h4>
            <div
              className="mt-3 space-y-2 text-[11px]"
              style={{ color: "var(--t2)" }}
            >
              <div className="flex justify-between">
                <span>Status</span>
                <span className="text-[#22c55e] flex items-center gap-1 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                  Online • GCP VM
                </span>
              </div>
              <div className="flex justify-between">
                <span>Active Webhooks</span>
                <b style={{ color: "var(--t1)" }}>Active (HMAC)</b>
              </div>
              <div className="flex justify-between">
                <span>Sandbox Engine</span>
                <b style={{ color: "var(--t1)" }}>Judge0 CE (v1.13)</b>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
