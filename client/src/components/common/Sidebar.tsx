// src/components/common/Sidebar.tsx
import React, { useState } from "react";
import Logo from "../landing/Logo";
import {
  LayoutDashboard,
  FolderKanban,
  Flag,
  Upload,
  Code2,
  Activity,
  User,
  ClipboardCheck,
  Star,
  Users,
  Layers,
  FileText,
  Settings,
  X,
  LogOut,
  FlaskConical,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

interface SidebarProps {
  page: string;
  setPage: (p: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  projectCount: number;
  inProgressMilestoneCount: number;
  pendingReviewCount: number;
  userCount: number;
  batchCount: number;
  onSignOut: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  page,
  setPage,
  mobileOpen,
  setMobileOpen,
  projectCount,
  inProgressMilestoneCount,
  pendingReviewCount,
  userCount,
  batchCount,
  onSignOut,
  collapsed = false,
  onToggleCollapse,
}) => {
  const { user, role } = useAuth();
  const showToast = useToast();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [tooltip, setTooltip] = useState<{
    top: number;
    label: string;
    count?: number;
  } | null>(null);

  const isExpanded = !collapsed;

  const navStudent = [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "ideas", label: "Idea Bank", Icon: Sparkles },
    { id: "projects", label: "My Projects", Icon: FolderKanban, count: projectCount },
    { id: "labs", label: "Lab Experiments", Icon: FlaskConical },
    {
      id: "milestones",
      label: "Milestones",
      Icon: Flag,
      count: inProgressMilestoneCount,
    },
    { id: "submissions", label: "Submissions", Icon: Upload },
    { id: "sandbox", label: "Code Sandbox", Icon: Code2 },
    { id: "activity", label: "Activity", Icon: Activity },
    { id: "profile", label: "Profile", Icon: User },
  ];

  const navSup = [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "ideas", label: "Problem Statements", Icon: Sparkles },
    { id: "projects", label: "Supervised", Icon: FolderKanban, count: projectCount },
    { id: "labs", label: "Lab Experiments", Icon: FlaskConical },
    {
      id: "pending",
      label: "Pending Reviews",
      Icon: ClipboardCheck,
      count: pendingReviewCount,
    },
    { id: "grades", label: "Grades & Evaluation", Icon: Star },
    { id: "activity", label: "Activity", Icon: Activity },
    { id: "profile", label: "Profile", Icon: User },
  ];

  const navAdmin = [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "ideas", label: "Idea Bank & Reviews", Icon: Sparkles },
    { id: "users", label: "Users & Roles", Icon: Users, count: userCount },
    { id: "projects", label: "All Projects", Icon: FolderKanban, count: projectCount },
    { id: "batches", label: "Batches & Courses", Icon: Layers, count: batchCount },
    { id: "labs", label: "Lab Experiments", Icon: FlaskConical },
    { id: "gitea", label: "Gitea Config", Icon: Settings },
    { id: "audit", label: "Audit Logs", Icon: FileText },
    { id: "activity", label: "Activity", Icon: Activity },
    { id: "profile", label: "Profile", Icon: User },
  ];

  const nav =
    role === "STUDENT" ? navStudent : role === "SUPERVISOR" ? navSup : navAdmin;

  const userName = user?.name || (role === "ADMIN" ? "Admin User" : role === "SUPERVISOR" ? "Faculty Advisor" : "Student");
  const userAvatar =
    user?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      userName || "User"
    )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`;
  const userDept = user?.dept || (user as any)?.department || (role === "ADMIN" ? "Administration" : "Computer Science");

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        onMouseEnter={() => {
          if (collapsed) setIsSidebarHovered(true);
        }}
        onMouseLeave={() => {
          if (collapsed) {
            setIsSidebarHovered(false);
            setTooltip(null);
          }
        }}
        className={`fixed left-0 top-0 z-50 h-screen w-[80vw] max-w-[280px] bg-[#0f2a33] text-[#d0e8f0] border-r border-[#1a4454] flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isExpanded
            ? "lg:w-[260px] rounded-r-2xl lg:rounded-r-3xl border-t border-b overflow-hidden"
            : "lg:w-[72px] rounded-none border-t-0 border-b-0"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className={`h-[60px] flex items-center border-b border-[#1a4454] transition-all duration-200 ${
            !isExpanded ? "justify-center px-1.5" : "justify-between pl-3 pr-3.5 gap-2.5"
          }`}
        >
          {/* Collapsed Resting View (Desktop): Only logo shown initially; on hover over collapsed sidebar, logo is replaced by the expand button */}
          {!isExpanded && (
            <div className="hidden lg:flex items-center justify-center w-full">
              <button
                type="button"
                onClick={() => {
                  setTooltip(null);
                  onToggleCollapse?.();
                }}
                className="group/toggle relative h-11 w-11 rounded-xl grid place-items-center transition-all duration-200 cursor-pointer hover:bg-white/10"
                title={isSidebarHovered ? "Expand sidebar menu" : undefined}
                aria-label="Expand sidebar menu"
              >
                {/* Logo - visible when cursor is NOT on collapsed menu bar */}
                <div
                  className={`transition-all duration-200 flex-shrink-0 ${
                    isSidebarHovered
                      ? "opacity-0 scale-75 pointer-events-none"
                      : "opacity-100 scale-100"
                  }`}
                >
                  <Logo size={38} className="shadow-lg" />
                </div>

                {/* Expand button - replaces logo when cursor is on the collapsed menu bar */}
                <div
                  className={`absolute inset-0 grid place-items-center rounded-xl border border-white/15 bg-white/5 text-[#b0d4e0] group-hover/toggle:text-white group-hover/toggle:bg-white/15 group-hover/toggle:border-cyan-400/50 transition-all duration-200 ${
                    isSidebarHovered
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-75 pointer-events-none"
                  }`}
                >
                  <PanelLeftOpen size={20} />
                </div>
              </button>
            </div>
          )}

          {/* Expanded View (Desktop expanded or Mobile drawer): Full Logo + Portal Title */}
          <div className={`items-center gap-2.5 min-w-0 ${!isExpanded ? "flex lg:hidden" : "flex"}`}>
            <Logo size={36} className="flex-shrink-0 shadow-lg" />
            <div className="min-w-0 truncate">
              <div className="font-bold text-[13px] text-white truncate">GiteaForge LMS</div>
              <div className="text-[10px] tracking-widest uppercase text-[#5eead4] font-bold truncate">
                {role} Portal
              </div>
            </div>
          </div>

          {/* Desktop Collapse Button (When Expanded) */}
          {isExpanded && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:grid place-items-center h-8 w-8 rounded-xl border border-white/15 bg-white/5 text-[#b0d4e0] hover:text-white hover:bg-white/15 hover:border-white/30 transition cursor-pointer flex-shrink-0 ml-auto"
              title="Collapse sidebar menu"
              aria-label="Collapse sidebar menu"
            >
              <PanelLeftClose size={16} />
            </button>
          )}

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div
          onScroll={() => setTooltip(null)}
          className="p-2 space-y-1 overflow-y-auto flex-1 overscroll-contain touch-pan-y custom-scrollbar"
        >
          {nav.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setPage(item.id);
                  setMobileOpen(false);
                  setTooltip(null);
                }}
                onMouseEnter={(e) => {
                  if (collapsed) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({
                      top: rect.top + rect.height / 2,
                      label: item.label,
                      count: (item as any).count,
                    });
                  }
                }}
                onMouseLeave={() => {
                  if (collapsed) {
                    setTooltip(null);
                  }
                }}
                className={`w-full flex items-center rounded-xl text-[13px] text-left transition-snappy cursor-pointer relative ${
                  !isExpanded ? "justify-start lg:justify-center px-3 lg:px-0 py-2.5" : "gap-2.5 px-3 py-2.5"
                } ${
                  active
                    ? "bg-white text-[#0f2a33] font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
                    : "text-[#b0d4e0] hover:text-white hover:bg-white/[0.08] hover:translate-x-0.5"
                }`}
              >
                <item.Icon size={18} className={active ? "text-[#0891b2]" : ""} />
                <span className={`flex-1 truncate ${!isExpanded ? "lg:hidden" : ""}`}>{item.label}</span>
                {(item as any).count > 0 && (
                  <span
                    className={`font-bold ${
                      !isExpanded
                        ? "absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#22d3ee] p-0 lg:block hidden"
                        : "text-[10px] px-1.5 py-0.5 rounded-full"
                    } ${
                      isExpanded && (active ? "bg-[#0891b2] text-white" : "bg-[#06b6d4] text-[#042027]")
                    }`}
                  >
                    <span className={!isExpanded ? "lg:hidden" : ""}>{(item as any).count}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className={`p-3 pr-3.5 border-t border-[#1a4454] flex items-center ${!isExpanded ? "justify-start lg:justify-center gap-2.5 lg:gap-0" : "gap-2.5"}`}>
          <img
            src={userAvatar}
            className="h-8 w-8 rounded-full border-2 border-white/20 object-cover flex-shrink-0 cursor-pointer"
            alt="User"
            onMouseEnter={(e) => {
              if (collapsed) {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({
                  top: rect.top + rect.height / 2,
                  label: `${userName} (${userDept})`,
                });
              }
            }}
            onMouseLeave={() => {
              if (collapsed) setTooltip(null);
            }}
          />
          <div className={`min-w-0 flex-1 ${!isExpanded ? "lg:hidden" : ""}`}>
            <div className="text-[12px] font-semibold text-white truncate">
              {userName}
            </div>
            <div className="text-[11px] text-[#5eead4] flex items-center gap-1 truncate">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22d3ee] animate-pulse flex-shrink-0" />
              <span className="truncate">{userDept}</span>
            </div>
          </div>
          <button
            onClick={() => {
              onSignOut();
              showToast("Signed out");
            }}
            title="Sign out"
            className={`h-8 w-8 rounded-lg grid place-items-center text-[#b0d4e0] hover:text-white hover:bg-white/10 transition cursor-pointer flex-shrink-0 ${
              !isExpanded ? "lg:hidden" : ""
            }`}
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Floating Tooltip showing menu name when collapsed */}
      {collapsed && tooltip && (
        <div
          style={{ top: tooltip.top }}
          className="hidden lg:flex fixed left-[78px] -translate-y-1/2 z-[70] pointer-events-none items-center gap-2 px-3 py-1.5 rounded-lg bg-[#071920]/95 backdrop-blur-md border border-[#1a4454] shadow-2xl text-white text-[12px] font-semibold whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
        >
          <span>{tooltip.label}</span>
          {tooltip.count !== undefined && tooltip.count > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#06b6d4] text-[#042027]">
              {tooltip.count}
            </span>
          )}
          {/* Arrow pointer */}
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#071920] border-l border-b border-[#1a4454] rotate-45" />
        </div>
      )}
    </>
  );
};

export default Sidebar;
