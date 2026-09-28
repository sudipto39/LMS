// src/components/common/NotificationDropdown.tsx
import React, { useState, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  X,
  CheckCircle2,
  AlertCircle,
  CloudUpload,
  MessageSquare,
  GitCommit,
  FlaskConical,
  ExternalLink,
  Trash2,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { ActivityItem, Project, Milestone } from "../../types";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  detail?: string;
  time: string;
  rawDate: string;
  isRead: boolean;
  projectId?: string;
  projectTitle?: string;
  actionUrl?: string;
  category: "milestone" | "feedback" | "commit" | "lab" | "system";
}

export interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  activities?: ActivityItem[];
  projects?: Project[];
  milestones?: Milestone[];
  onSelectProject?: (id: string) => void;
  onNavigatePage: (page: string) => void;
  readIds: Set<string>;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onClearAll?: () => void;
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
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  activities = [],
  projects = [],
  milestones = [],
  onSelectProject,
  onNavigatePage,
  readIds,
  onMarkAllRead,
  onMarkRead,
  onClearAll,
}) => {
  const { user, role } = useAuth();
  const [filter, setFilter] = useState<"all" | "unread" | "milestone" | "feedback">("all");

  // ── Strict RBAC Project Scope ──────────────────────────────────────────────
  const userProjects = useMemo(() => {
    if (role === "ADMIN") return projects;
    if (role === "SUPERVISOR") {
      return projects.filter(
        (p) =>
          p.supervisorId === user?.id ||
          p.requestedSupervisorId === user?.id ||
          (p as any).supervisor === user?.name ||
          (p as any).requestedSupervisor?.id === user?.id
      );
    }
    // STUDENT: strictly projects owned by this student or where this student is a team member
    return projects.filter(
      (p) =>
        p.ownerId === user?.id ||
        p.owner?.id === user?.id ||
        (Array.isArray(p.team) && p.team.some((tm: any) => tm?.id === user?.id || tm?.email === user?.email)) ||
        (Array.isArray(p.members) && p.members.some((m: any) => m?.userId === user?.id || m?.id === user?.id))
    );
  }, [projects, role, user?.id, user?.name, user?.email]);

  const userProjectIds = useMemo(() => new Set(userProjects.map((p) => p.id)), [userProjects]);
  const userProjectTitles = useMemo(
    () => new Set(userProjects.map((p) => (p.title || "").toLowerCase().trim()).filter(Boolean)),
    [userProjects]
  );

  // ── Construct Unified RBAC Notification List ───────────────────────────────
  const notifications = useMemo(() => {
    const list: NotificationItem[] = [];
    const seenIds = new Set<string>();

    // 1. Role-Specific Milestone and Advisory Alerts
    if (role === "STUDENT") {
      // Students only get notifications about their own project milestones
      milestones.forEach((m) => {
        if (!userProjectIds.has(m.projectId)) return;

        const project = userProjects.find((p) => p.id === m.projectId);
        if (m.status === "REJECTED") {
          const id = `notif-ms-rej-${m.id}`;
          seenIds.add(id);
          list.push({
            id,
            type: "MILESTONE_REJECTED",
            title: `Action Required: Revisions on ${m.title}`,
            detail: m.feedback || "Supervisor requested changes on your milestone deliverables.",
            time: formatRelativeTime((m as any).reviewedAt || (m as any).updatedAt || new Date().toISOString()),
            rawDate: (m as any).reviewedAt || (m as any).updatedAt || new Date().toISOString(),
            isRead: readIds.has(id),
            projectId: m.projectId,
            projectTitle: project?.title,
            category: "milestone",
          });
        } else if (m.status === "APPROVED") {
          const id = `notif-ms-appr-${m.id}`;
          seenIds.add(id);
          list.push({
            id,
            type: "MILESTONE_APPROVED",
            title: `Milestone Approved: ${m.title}`,
            detail: m.feedback || "Supervisor has approved your milestone deliverables! 🎉",
            time: formatRelativeTime((m as any).reviewedAt || (m as any).updatedAt || new Date().toISOString()),
            rawDate: (m as any).reviewedAt || (m as any).updatedAt || new Date().toISOString(),
            isRead: readIds.has(id),
            projectId: m.projectId,
            projectTitle: project?.title,
            category: "milestone",
          });
        }
      });
    } else if (role === "SUPERVISOR") {
      // Supervisors only get alerts for projects they supervise
      milestones.forEach((m) => {
        if (!userProjectIds.has(m.projectId)) return;
        if (m.status === "SUBMITTED") {
          const id = `notif-sup-review-${m.id}`;
          seenIds.add(id);
          const project = userProjects.find((p) => p.id === m.projectId);
          list.push({
            id,
            type: "MILESTONE_SUBMITTED",
            title: `Review Required: ${m.title}`,
            detail: `Student team submitted deliverables for "${m.title}" on ${project?.title || "your project"}`,
            time: formatRelativeTime((m as any).submittedAt || (m as any).updatedAt || new Date().toISOString()),
            rawDate: (m as any).submittedAt || (m as any).updatedAt || new Date().toISOString(),
            isRead: readIds.has(id),
            projectId: m.projectId,
            projectTitle: project?.title,
            category: "milestone",
          });
        }
      });

      // Supervisor advisory requests
      userProjects.forEach((p) => {
        if (p.requestedSupervisorId === user?.id && p.supervisorRequestStatus === "PENDING") {
          const id = `notif-sup-req-${p.id}`;
          seenIds.add(id);
          list.push({
            id,
            type: "SUPERVISOR_REQUESTED",
            title: `Supervision Request: ${p.title}`,
            detail: p.supervisorRequestReason || "A student team has requested you as their project supervisor.",
            time: formatRelativeTime((p as any).updatedAt || (p as any).createdAt || new Date().toISOString()),
            rawDate: (p as any).updatedAt || (p as any).createdAt || new Date().toISOString(),
            isRead: readIds.has(id),
            projectId: p.id,
            projectTitle: p.title,
            category: "system",
          });
        }
      });
    } else if (role === "ADMIN") {
      // Admin sees platform milestones & pending requests
      milestones.forEach((m) => {
        if (m.status === "SUBMITTED") {
          const id = `notif-adm-ms-${m.id}`;
          seenIds.add(id);
          const project = projects.find((p) => p.id === m.projectId);
          list.push({
            id,
            type: "MILESTONE_SUBMITTED",
            title: `Milestone Submitted: ${m.title}`,
            detail: `Submitted on ${project?.title || "capstone project"}`,
            time: formatRelativeTime((m as any).submittedAt || (m as any).updatedAt || new Date().toISOString()),
            rawDate: (m as any).submittedAt || (m as any).updatedAt || new Date().toISOString(),
            isRead: readIds.has(id),
            projectId: m.projectId,
            projectTitle: project?.title,
            category: "milestone",
          });
        }
      });
    }

    // 2. Real activities from API: Strictly RBAC-filtered
    activities.forEach((act) => {
      if (seenIds.has(act.id)) return;

      // Filter activity to ensure user only sees activities they own or their project owns
      if (role !== "ADMIN") {
        const actProjId = act.projectId || (act as any).payload?.projectId;
        const actProjTitle = (act.project || "").toLowerCase().trim();
        const isUserProject =
          (actProjId && userProjectIds.has(actProjId)) ||
          (actProjTitle && userProjectTitles.has(actProjTitle));

        const isUserActivity =
          (act as any).userId === user?.id ||
          (act as any).payload?.studentId === user?.id ||
          act.user === user?.name;

        // If not user's activity AND not on user's project, strictly exclude
        if (!isUserProject && !isUserActivity) {
          return;
        }
      }

      seenIds.add(act.id);

      const typeUpper = (act.type || "").toUpperCase();
      let category: NotificationItem["category"] = "system";
      if (typeUpper.includes("MILESTONE")) category = "milestone";
      else if (typeUpper.includes("FEEDBACK")) category = "feedback";
      else if (typeUpper.includes("COMMIT") || typeUpper === "PUSH") category = "commit";
      else if (typeUpper.includes("LAB")) category = "lab";

      const matchedProj = userProjects.find(
        (p) => p.title === act.project || p.id === (act as any).projectId
      );

      list.push({
        id: act.id,
        type: act.type,
        title: act.msg || "Project activity update",
        detail: act.detail || (act as any).payload?.message || (act as any).payload?.feedback || "",
        time: formatRelativeTime(act.time || (act as any).createdAt || new Date().toISOString()),
        rawDate: act.time || (act as any).createdAt || new Date().toISOString(),
        isRead: readIds.has(act.id),
        projectId: matchedProj?.id || (act as any).projectId,
        projectTitle: act.project || matchedProj?.title,
        category,
      });
    });

    // Sort descending by date
    return list.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
  }, [
    role,
    activities,
    milestones,
    projects,
    userProjects,
    userProjectIds,
    userProjectTitles,
    readIds,
    user?.id,
    user?.name,
  ]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === "unread") return !n.isRead;
      if (filter === "milestone") return n.category === "milestone";
      if (filter === "feedback") return n.category === "feedback";
      return true;
    });
  }, [notifications, filter]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const handleItemClick = (item: NotificationItem) => {
    onMarkRead(item.id);
    if (item.projectId && onSelectProject) {
      onSelectProject(item.projectId);
      onClose();
    } else if (item.category === "milestone") {
      onNavigatePage("milestones");
      onClose();
    } else if (item.category === "lab") {
      onNavigatePage("labs");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute right-0 top-full mt-2 w-[340px] sm:w-[410px] rounded-2xl border shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
      style={{
        background: "var(--srf)",
        borderColor: "var(--bdr)",
        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.3), 0 0 0 1px var(--bdr)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Dropdown Header ──────────────────────────────────────────────── */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between gap-2"
        style={{ borderColor: "var(--bdr)", background: "var(--srf2)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-lg grid place-items-center"
            style={{ background: "#06b6d418", color: "#06b6d4" }}
          >
            <Bell size={14} />
          </div>
          <span className="font-bold text-[13px] text-[var(--t1)]">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#06b6d4] text-white">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-[11px] font-medium text-[#06b6d4] hover:underline flex items-center gap-1 px-2 py-1 rounded cursor-pointer"
              title="Mark all as read"
            >
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-6 w-6 rounded-md hover:bg-black/10 dark:hover:bg-white/10 grid place-items-center text-[var(--t2)] cursor-pointer transition"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ──────────────────────────────────────────────────── */}
      <div
        className="px-3 py-1.5 border-b flex items-center gap-1 text-[11px] font-medium overflow-x-auto"
        style={{ borderColor: "var(--bdr)", background: "var(--srf)" }}
      >
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-2 py-0.8 rounded-md transition cursor-pointer ${
            filter === "all"
              ? "bg-[#06b6d4] text-white font-semibold"
              : "text-[var(--t2)] hover:text-[var(--t1)]"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`px-2 py-0.8 rounded-md transition cursor-pointer ${
            filter === "unread"
              ? "bg-[#06b6d4] text-white font-semibold"
              : "text-[var(--t2)] hover:text-[var(--t1)]"
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("milestone")}
          className={`px-2 py-0.8 rounded-md transition cursor-pointer ${
            filter === "milestone"
              ? "bg-[#06b6d4] text-white font-semibold"
              : "text-[var(--t2)] hover:text-[var(--t1)]"
          }`}
        >
          Milestones
        </button>
        <button
          type="button"
          onClick={() => setFilter("feedback")}
          className={`px-2 py-0.8 rounded-md transition cursor-pointer ${
            filter === "feedback"
              ? "bg-[#06b6d4] text-white font-semibold"
              : "text-[var(--t2)] hover:text-[var(--t1)]"
          }`}
        >
          Feedback
        </button>
      </div>

      {/* ── Notification Items List ──────────────────────────────────────── */}
      <div className="max-h-[360px] overflow-y-auto divide-y custom-scrollbar" style={{ borderColor: "var(--bdr)" }}>
        {filteredNotifications.length === 0 ? (
          <div className="py-10 text-center space-y-2 px-4">
            <div className="h-10 w-10 rounded-full mx-auto grid place-items-center bg-black/5 dark:bg-white/5 text-[var(--t3)]">
              <Sparkles size={18} />
            </div>
            <div className="text-[13px] font-semibold text-[var(--t1)]">
              {filter === "unread" ? "No unread notifications" : "All caught up!"}
            </div>
            <p className="text-[11px] text-[var(--t3)] max-w-[240px] mx-auto">
              {filter === "unread"
                ? "You have reviewed all pending notifications."
                : "New updates about your projects, reviews, and milestones will appear here."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const isUnread = !item.isRead;

            // Choose icon and color scheme based on notification type
            let IconComponent = Bell;
            let iconColor = "#06b6d4";
            let iconBg = "#06b6d415";

            if (item.type.includes("APPROVED")) {
              IconComponent = CheckCircle2;
              iconColor = "#22c55e";
              iconBg = "#22c55e15";
            } else if (item.type.includes("REJECTED")) {
              IconComponent = AlertCircle;
              iconColor = "#ef4444";
              iconBg = "#ef444415";
            } else if (item.type.includes("SUBMITTED")) {
              IconComponent = CloudUpload;
              iconColor = "#06b6d4";
              iconBg = "#06b6d415";
            } else if (item.type.includes("SUPERVISOR_REQUESTED")) {
              IconComponent = UserCheck;
              iconColor = "#f59e0b";
              iconBg = "#f59e0b15";
            } else if (item.category === "feedback") {
              IconComponent = MessageSquare;
              iconColor = "#6366f1";
              iconBg = "#6366f115";
            } else if (item.category === "commit") {
              IconComponent = GitCommit;
              iconColor = "#a855f7";
              iconBg = "#a855f715";
            } else if (item.category === "lab") {
              IconComponent = FlaskConical;
              iconColor = "#f59e0b";
              iconBg = "#f59e0b15";
            }

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-3.5 flex items-start gap-3 transition cursor-pointer relative group ${
                  isUnread
                    ? "bg-[#06b6d4]/5 hover:bg-[#06b6d4]/10"
                    : "hover:bg-[var(--srf2)]"
                }`}
              >
                {/* Unread indicator bar */}
                {isUnread && (
                  <span className="absolute left-1 top-4 bottom-4 w-1 rounded-full bg-[#06b6d4]" />
                )}

                {/* Icon box */}
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5"
                  style={{
                    background: iconBg,
                    color: iconColor,
                    borderColor: `${iconColor}35`,
                  }}
                >
                  <IconComponent size={15} />
                </div>

                {/* Body */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[12px] truncate ${
                        isUnread ? "font-bold text-[var(--t1)]" : "font-medium text-[var(--t1)]"
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className="text-[10px] text-[var(--t3)] shrink-0 font-mono">
                      {item.time}
                    </span>
                  </div>

                  {item.detail && (
                    <p className="text-[11px] text-[var(--t2)] line-clamp-2 leading-relaxed">
                      {item.detail}
                    </p>
                  )}

                  {item.projectTitle && (
                    <div className="pt-0.5">
                      <span className="inline-block text-[10px] font-medium text-[#06b6d4] bg-[#06b6d4]/10 px-1.5 py-0.2 rounded">
                        {item.projectTitle}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Dropdown Footer ──────────────────────────────────────────────── */}
      <div
        className="px-4 py-2.5 border-t flex items-center justify-between text-[11px] font-medium"
        style={{ borderColor: "var(--bdr)", background: "var(--srf2)" }}
      >
        <button
          type="button"
          onClick={() => {
            onNavigatePage("activity");
            onClose();
          }}
          className="text-[#06b6d4] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
        >
          View all activity stream <ExternalLink size={11} />
        </button>

        {onClearAll && notifications.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[var(--t3)] hover:text-red-400 flex items-center gap-1 cursor-pointer transition"
          >
            <Trash2 size={11} /> Clear all
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
