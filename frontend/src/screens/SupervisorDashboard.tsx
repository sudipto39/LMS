// src/screens/SupervisorDashboard.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardCheck,
  CheckCircle2,
  Star,
  Activity,
  ArrowRight,
  RotateCcw,
  Clock,
  Paperclip,
  Sparkles,
} from "lucide-react";
import { Card, Card2, Btn, Pill } from "../components/common/UIPrimitives";
import { projectsApi, activitiesApi, milestonesApi } from "../api";
import { useToast } from "../context/ToastContext";
import type { Project, Milestone, ActivityItem } from "../types";

interface SupervisorDashboardProps {
  projects: Project[];
  milestones: Milestone[];
  activities: ActivityItem[];
  onApproveMilestone: (id: string) => void;
  onOpenGradeModal: (project: Project) => void;
  onOpenProposeModal?: () => void;
  onNavigate: (page: string) => void;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  projects,
  milestones,
  activities,
  onApproveMilestone,
  onOpenGradeModal,
  onOpenProposeModal,
  onNavigate,
}) => {
  const showToast = useToast();
  const [liveProjects, setLiveProjects] = useState<Project[]>(projects || []);
  const [liveActivities, setLiveActivities] = useState<ActivityItem[]>(activities || []);
  const [loading, setLoading] = useState(false);

  // Sync props to state if provided
  useEffect(() => {
    if (projects && projects.length > 0) {
      setLiveProjects(projects);
    }
  }, [projects]);

  useEffect(() => {
    if (activities && activities.length > 0) {
      setLiveActivities(activities);
    }
  }, [activities]);

  const fetchLiveDashboard = async (isManual = false) => {
    try {
      setLoading(true);
      const [projRes, actRes] = await Promise.allSettled([
        projectsApi.getSupervisedProjects(),
        activitiesApi.getSupervisorActivities(),
      ]);

      if (projRes.status === "fulfilled" && projRes.value?.data && Array.isArray(projRes.value.data)) {
        setLiveProjects(projRes.value.data);
      }
      if (actRes.status === "fulfilled" && actRes.value?.data && Array.isArray(actRes.value.data)) {
        setLiveActivities(actRes.value.data);
      }
      if (isManual) {
        showToast("Supervisor dashboard refreshed with live API data 🔄");
      }
    } catch {
      // Graceful fallback to initial props
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDashboard();
  }, []);

  const allMilestones = useMemo(() => {
    const list: (Milestone & { projectTitle?: string })[] = [];
    (liveProjects || []).forEach((p) => {
      const pMilestones = (p as any).milestones;
      if (Array.isArray(pMilestones)) {
        pMilestones.forEach((m: any, idx: number) => {
          list.push({
            id: m.id || `m-${p.id}-${idx}`,
            projectId: p.id,
            projectTitle: p.title,
            title: m.title,
            status: m.status || "PENDING",
            order: typeof m.order === "number" ? m.order : idx + 1,
            due: m.dueDate ? new Date(m.dueDate).toLocaleDateString() : m.due || "TBD",
            files: Array.isArray(m.attachments) ? m.attachments.length : m.files || 0,
            note: m.studentNotes || m.feedback || m.note || "Milestone deliverable",
            attachments: Array.isArray(m.attachments) ? m.attachments : [],
            submittedAt: m.submittedAt ? new Date(m.submittedAt).toLocaleDateString() : undefined,
          });
        });
      }
    });
    return list.length > 0 ? list : (milestones || []);
  }, [liveProjects, milestones]);

  const pendingMilestones = allMilestones.filter((m) => m.status === "SUBMITTED");
  const approvedMilestones = allMilestones.filter((m) => m.status === "APPROVED");
  const gradedProjects = liveProjects.filter((p) => p.grade || (p as any).evaluation);

  const handleApproveLocal = async (milestoneId: string) => {
    try {
      await milestonesApi.approveMilestone(milestoneId);
      showToast("Milestone approved successfully ✅");
      onApproveMilestone(milestoneId);
      // Refresh local state
      setLiveProjects((prev) =>
        prev.map((p) => ({
          ...p,
          milestones: ((p as any).milestones || []).map((m: any) =>
            m.id === milestoneId ? { ...m, status: "APPROVED" } : m
          ),
        }))
      );
    } catch {
      onApproveMilestone(milestoneId);
    }
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6 viewport-ambient-glow">
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h1 className="text-[24px] font-bold flex items-center gap-2">
            <LayoutDashboard size={22} style={{ color: "var(--acc)" }} />{" "}
            Supervisor Dashboard
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--t2)" }}>
            Review pending milestone submissions, evaluate capstones, and guide student repos
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenProposeModal && (
            <Btn onClick={onOpenProposeModal} className="!h-8 text-[11px]">
              <Sparkles size={13} /> Propose Problem Statement
            </Btn>
          )}

          <button
            type="button"
            onClick={() => fetchLiveDashboard(true)}
            disabled={loading}
            className="h-8 px-3 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-snappy hover:border-[var(--acc)] disabled:opacity-50 lum-border"
            style={{ borderColor: "var(--bdr)", color: "var(--t2)", background: "var(--srf)" }}
            title="Fetch latest data from server"
          >
            <RotateCcw size={12} className={loading ? "animate-spin text-[#06b6d4]" : ""} />
            {loading ? "Refreshing..." : "Refresh Live Data"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
        {[
          {
            k: "Assigned Projects",
            v: `${liveProjects.length}`,
            Icon: FolderKanban,
            c: "#0891b2",
            aura: "aura-cyan",
            glow: "glow-border-cyan",
          },
          {
            k: "Pending Reviews",
            v: `${pendingMilestones.length}`,
            Icon: ClipboardCheck,
            c: "#f59e0b",
            aura: "aura-amber",
            glow: "glow-border-amber",
          },
          {
            k: "Approved Milestones",
            v: `${approvedMilestones.length}`,
            Icon: CheckCircle2,
            c: "#22c55e",
            aura: "aura-emerald",
            glow: "glow-border-emerald",
          },
          {
            k: "Graded Projects",
            v: `${gradedProjects.length}`,
            Icon: Star,
            c: "#a855f7",
            aura: "aura-blue",
            glow: "glow-border-blue",
          },
        ].map((s) => (
          <Card key={s.k} className={`p-5 hover-lift aura-container ${s.aura} ${s.glow} cursor-default`}>
            <div
              className="h-10 w-10 rounded-xl grid place-items-center relative z-10 transition-snappy"
              style={{ background: `${s.c}15`, color: s.c, boxShadow: `0 0 14px -3px ${s.c}25` }}
            >
              <s.Icon size={18} />
            </div>
            <div
              className="text-[11px] uppercase tracking-widest font-bold mt-3 relative z-10"
              style={{ color: "var(--t2)" }}
            >
              {s.k}
            </div>
            <div className="text-[26px] font-bold mt-1 relative z-10">{s.v}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <Card className="overflow-hidden">
          <div
            className="h-12 px-5 flex items-center justify-between border-b"
            style={{ borderColor: "var(--bdr)", background: "var(--srf2)" }}
          >
            <span className="font-semibold text-[13px] flex items-center gap-2">
              <ClipboardCheck size={14} style={{ color: "var(--acc)" }} />{" "}
              Pending Submissions Queue ({pendingMilestones.length})
            </span>
            <Btn onClick={() => onNavigate("pending")}>
              Open Reviews <ArrowRight size={14} />
            </Btn>
          </div>
          <div className="p-4 space-y-3">
            {pendingMilestones.length === 0 ? (
              <div
                className="text-center py-8 text-[13px]"
                style={{ color: "var(--t2)" }}
              >
                No pending reviews right now 🎉
              </div>
            ) : (
              pendingMilestones.map((m) => {
                const targetProject = liveProjects.find((p) => p.id === m.projectId);
                return (
                  <Card2
                    key={m.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover-lift glow-border-cyan transition-snappy"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[13px]">{m.title}</span>
                        <Pill color="#f59e0b">
                          <Clock size={10} /> In Review
                        </Pill>
                      </div>
                      <div
                        className="text-[11px]"
                        style={{ color: "var(--t2)" }}
                      >
                        Project: <b>{(m as any).projectTitle || targetProject?.title || "Capstone Project"}</b> • Target Due: {m.due}
                      </div>
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {m.attachments.map((att, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border"
                              style={{ background: "var(--srf2)", borderColor: "var(--bdr)", color: "var(--acc)" }}
                            >
                              <Paperclip size={10} />
                              <span className="truncate max-w-[140px]">{att.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleApproveLocal(m.id)}
                        className="h-8 px-3.5 rounded-full bg-[#22c55e] hover:bg-[#16a34a] active:scale-[0.98] text-white text-[11px] font-bold cursor-pointer flex items-center gap-1 transition-snappy shadow-[0_2px_10px_rgba(34,197,94,0.3)]"
                      >
                        <CheckCircle2 size={12} /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (targetProject) onOpenGradeModal(targetProject);
                        }}
                        className="h-8 px-3.5 rounded-full bg-gradient-to-r from-[#06b6d4] to-[#2563eb] hover:opacity-95 active:scale-[0.98] text-white text-[11px] font-bold cursor-pointer flex items-center gap-1 transition-snappy shadow-[0_2px_10px_rgba(6,182,214,0.3)]"
                      >
                        <Star size={12} /> Grade
                      </button>
                    </div>
                  </Card2>
                );
              })
            )}
          </div>
        </Card>

        <Card className="p-4 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b mb-3" style={{ borderColor: "var(--bdr)" }}>
            <h4 className="font-semibold text-[12px] flex items-center gap-2">
              <Activity size={14} style={{ color: "var(--acc)" }} /> Activity Stream
            </h4>
            <span className="text-[10px] text-[var(--t3)] font-mono">Live Feed</span>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px]">
            {liveActivities.length === 0 ? (
              <div className="text-center py-8 text-[12px] text-[var(--t3)] space-y-1">
                <Activity size={20} className="mx-auto opacity-40 text-[var(--acc)] mb-1" />
                <div>No recent activities recorded.</div>
              </div>
            ) : (
              liveActivities.slice(0, 8).map((a) => {
                const timeAgo = (() => {
                  if (!a.time) return "Recent";
                  try {
                    const diffMs = Date.now() - new Date(a.time).getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    if (diffMins < 1) return "Just now";
                    if (diffMins < 60) return `${diffMins}m ago`;
                    const diffHours = Math.floor(diffMins / 60);
                    if (diffHours < 24) return `${diffHours}h ago`;
                    return new Date(a.time).toLocaleDateString();
                  } catch {
                    return "Recent";
                  }
                })();

                return (
                  <div
                    key={a.id}
                    className="p-2.5 rounded-xl border flex gap-2.5 text-[12px] items-start transition hover:shadow-sm"
                    style={{ borderColor: "var(--bdr)", background: "var(--srf2)" }}
                  >
                    <img
                      src={a.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(a.user || "User")}&backgroundColor=06b6d4,2563eb`}
                      className="h-7 w-7 rounded-full object-cover shrink-0 border"
                      style={{ borderColor: "var(--bdr)" }}
                      alt=""
                    />
                    <div className="flex-1 min-w-0">
                      <div className="leading-snug">
                        <b className="text-[var(--t1)]">{a.user}</b>{" "}
                        <span style={{ color: "var(--t2)" }}>{a.msg}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        {a.detail ? (
                          <span className="text-[10px] text-[var(--t3)] truncate font-mono">
                            {a.detail}
                          </span>
                        ) : <span />}
                        <span className="text-[9px] text-[var(--t3)] shrink-0 font-mono">
                          {timeAgo}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
