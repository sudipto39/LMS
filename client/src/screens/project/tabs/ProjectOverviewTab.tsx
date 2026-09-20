import React from "react";
import {
  Flag,
  CheckCircle2,
  MessageCircle,
  Users,
  GitBranch,
  FileText,
  GitCommit,
  Code2,
  Activity,
} from "lucide-react";
import { Card, Btn2, Pill } from "../../../components/common/UIPrimitives";
import type { Project, Milestone, Feedback } from "../../../types";
import type { ProjectTabKey } from "../types";

interface ProjectOverviewTabProps {
  project: Project;
  liveMilestones: Milestone[];
  feedbacks: Feedback[];
  onNavigateTab: (tab: ProjectTabKey) => void;
  onOpenTeamModal: () => void;
}

export const ProjectOverviewTab: React.FC<ProjectOverviewTabProps> = ({
  project,
  liveMilestones,
  feedbacks,
  onNavigateTab,
  onOpenTeamModal,
}) => {
  const approvedCount = liveMilestones.filter((m) => m.status === "APPROVED").length;
  const totalCount = liveMilestones.length;
  const dynamicProgress =
    totalCount > 0
      ? Math.round((approvedCount / totalCount) * 100)
      : project.progress || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
      <div className="space-y-4">
        {/* Milestone Timeline Card */}
        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[14px] flex items-center gap-2">
              <Flag size={16} style={{ color: "var(--acc)" }} /> Milestone Timeline
            </h3>
            <Btn2
              onClick={() => onNavigateTab("milestones")}
              className="text-[11px] !px-2.5 !h-7"
            >
              Manage
            </Btn2>
          </div>
          <div className="relative pl-6 space-y-4">
            <div
              className="absolute left-[9px] top-2 bottom-2 w-px"
              style={{ background: "var(--bdr)" }}
            />
            {liveMilestones.map((m) => (
              <div key={m.id} className="relative flex gap-3">
                <div
                  className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full grid place-items-center ${
                    m.status === "APPROVED"
                      ? "bg-[#22c55e] text-white"
                      : m.status === "SUBMITTED"
                      ? "bg-[#06b6d4] text-white"
                      : m.status === "IN_PROGRESS"
                      ? "bg-[#f59e0b] text-white"
                      : "border"
                  }`}
                  style={
                    m.status === "PENDING"
                      ? {
                          borderColor: "var(--bdr)",
                          background: "var(--srf2)",
                        }
                      : {}
                  }
                >
                  <CheckCircle2 size={11} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold">{m.title}</span>
                    <Pill
                      color={
                        m.status === "APPROVED"
                          ? "#22c55e"
                          : m.status === "SUBMITTED"
                          ? "#06b6d4"
                          : m.status === "IN_PROGRESS"
                          ? "#f59e0b"
                          : undefined
                      }
                    >
                      {m.status}
                    </Pill>
                  </div>
                  <div
                    className="text-[11px] mt-0.5"
                    style={{ color: "var(--t2)" }}
                  >
                    Due {m.due} • {m.files} attachments
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Feedback Card */}
        <Card className="p-5">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-[14px] flex items-center gap-2">
              <MessageCircle size={16} style={{ color: "var(--acc)" }} /> Recent Feedback
            </h4>
            <Btn2
              onClick={() => onNavigateTab("feedback")}
              className="text-[11px] !px-2.5 !h-7"
            >
              Open Board
            </Btn2>
          </div>
          <div className="space-y-3">
            {feedbacks.slice(0, 2).map((f) => (
              <div
                key={f.id}
                className="p-3.5 rounded-xl border space-y-1.5"
                style={{
                  background: "var(--srf2)",
                  borderColor: "var(--bdr)",
                }}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={
                      f.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        f.author || "User"
                      )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`
                    }
                    className="h-6 w-6 rounded-full object-cover"
                    alt=""
                  />
                  <span className="text-[12px] font-bold">{f.author}</span>
                  <Pill color="#06b6d4">{f.role}</Pill>
                  <span
                    className="text-[11px] ml-auto"
                    style={{ color: "var(--t3)" }}
                  >
                    {f.time}
                  </span>
                </div>
                <p
                  className="text-[12px] pl-8 leading-relaxed"
                  style={{ color: "var(--t1)" }}
                >
                  {f.content}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {/* Card 1: Team & Guidance */}
        <Card className="p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-[13px] flex items-center gap-2">
              <Users size={15} style={{ color: "var(--acc)" }} /> Team & Guidance
            </h3>
            <Btn2 onClick={onOpenTeamModal} className="text-[11px] !px-2.5 !h-7">
              Manage
            </Btn2>
          </div>
          <div className="space-y-3 text-[12px]">
            <div className="flex justify-between items-center">
              <span style={{ color: "var(--t3)" }}>Supervisor</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold" style={{ color: "var(--t1)" }}>
                  {project.supervisor || "Pending Admin Allocation"}
                </span>
                {project.supervisorRequestStatus === "PENDING" && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    Pending Allocation
                  </span>
                )}
              </div>
            </div>
            {project.problemStatement && (
              <div
                className="flex justify-between items-center pt-1 border-t"
                style={{ borderColor: "var(--bdr)" }}
              >
                <span style={{ color: "var(--t3)" }}>Challenge</span>
                <span
                  className="font-semibold text-cyan-400 truncate max-w-[160px]"
                  title={project.problemStatement.title}
                >
                  {project.problemStatement.title}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span style={{ color: "var(--t3)" }}>Team Members</span>
              <div className="flex items-center -space-x-2">
                {(project.team || []).map((m, idx) => {
                  const fallbackAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    m.name || m.email || `Member-${idx}`
                  )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`;
                  return (
                    <img
                      key={m.id || idx}
                      src={m.avatar || fallbackAvatar}
                      className="h-7 w-7 rounded-full border-2 object-cover shadow-sm transition hover:scale-110 hover:z-10 cursor-pointer"
                      style={{ borderColor: "var(--srf)" }}
                      alt={m.name || "Member"}
                      title={m.name ? `${m.name} (${m.email || ""})` : "Team Member"}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Gitea Repository */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-[13px]">
            <GitBranch size={15} className="text-[#22c55e]" /> Gitea Repository
          </div>
          <div
            className="p-2.5 rounded-full text-center font-mono text-[11px] text-[#5eead4] truncate select-all"
            style={{ background: "#0a2228" }}
          >
            {project.repoUrl}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onNavigateTab("files")}
              className="h-8 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{
                borderColor: "var(--bdr)",
                background: "var(--srf2)",
                color: "var(--t1)",
              }}
            >
              <FileText size={12} /> Files
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("code-review")}
              className="h-8 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{
                borderColor: "var(--bdr)",
                background: "var(--srf2)",
                color: "var(--t1)",
              }}
            >
              <GitCommit size={12} /> Commits
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("sandbox")}
              className="h-8 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{
                borderColor: "var(--bdr)",
                background: "var(--srf2)",
                color: "var(--t1)",
              }}
            >
              <Code2 size={12} /> Sandbox
            </button>
          </div>
        </Card>

        {/* Card 3: Milestone Progress */}
        <Card className="p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[13px] flex items-center gap-2">
              <Activity size={15} style={{ color: "var(--acc)" }} /> Milestone Progress
            </h3>
            <Pill color="#06b6d4">Phase {project.phase}</Pill>
          </div>

          <div className="flex items-center gap-5">
            {/* Circular Progress Ring */}
            <div className="relative h-[84px] w-[84px] shrink-0">
              <svg className="h-[84px] w-[84px] -rotate-90 absolute inset-0">
                <defs>
                  <linearGradient
                    id="progressRingGradientOverview"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>
                </defs>
                {/* Background Track */}
                <circle
                  cx="42"
                  cy="42"
                  r="34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="7.5"
                  className="opacity-15"
                />
                {/* Dynamic Progress Arc */}
                <circle
                  cx="42"
                  cy="42"
                  r="34"
                  fill="none"
                  stroke="url(#progressRingGradientOverview)"
                  strokeWidth="7.5"
                  strokeLinecap="round"
                  strokeDasharray={`${(dynamicProgress / 100) * 213.6} ${
                    213.6 - (dynamicProgress / 100) * 213.6
                  }`}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[18px] font-extrabold leading-none tracking-tight">
                  {dynamicProgress}%
                </span>
                <span
                  className="text-[9px] font-bold tracking-widest uppercase mt-0.5"
                  style={{ color: "var(--t3)" }}
                >
                  DONE
                </span>
              </div>
            </div>

            {/* Progress Stats Boxes */}
            <div className="flex-1 space-y-2">
              <div
                className="flex justify-between items-center px-3 py-1.5 rounded-lg border text-[11px]"
                style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
              >
                <span style={{ color: "var(--t2)" }}>Approved</span>
                <b className="font-mono text-[#22c55e]">
                  {approvedCount} / {totalCount}
                </b>
              </div>
              <div
                className="flex justify-between items-center px-3 py-1.5 rounded-lg border text-[11px]"
                style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
              >
                <span style={{ color: "var(--t2)" }}>Current Grade</span>
                <b className="text-[#06b6d4] font-bold">{project.grade || "A"}</b>
              </div>
            </div>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => onNavigateTab("progress")}
              className="text-[12px] font-medium text-[#06b6d4] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              View Progress Details →
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProjectOverviewTab;
