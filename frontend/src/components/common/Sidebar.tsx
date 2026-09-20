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
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = !collapsed || isHovered;

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
          if (collapsed) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (collapsed) setIsHovered(false);
        }}
        className={`fixed left-0 top-0 z-50 h-screen w-[80vw] max-w-[280px] bg-[#0f2a33] text-[#d0e8f0] border-r border-[#1a4454] flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isExpanded
            ? "lg:w-[260px] rounded-r-2xl lg:rounded-r-3xl border-t border-b overflow-hidden"
            : "lg:w-[72px] rounded-none border-t-0 border-b-0"
        } ${collapsed && isHovered ? "shadow-2xl ring-1 ring-cyan-500/20" : ""} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className={`h-[60px] flex items-center border-b border-[#1a4454] transition-all duration-200 ${
            !isExpanded ? "justify-center px-1.5" : "justify-between pl-3 pr-3.5 gap-2.5"
          }`}
        >
          {/* Collapsed Resting View (Desktop): Both Logo and Expand Button adjusted side-by-side */}
          {!isExpanded && (
            <div className="hidden lg:flex items-center justify-center gap-1.5 w-full">
              <div
                onClick={() => {
                  setIsHovered(false);
                  onToggleCollapse?.();
                }}
                className="cursor-pointer transition-transform hover:scale-105 flex-shrink-0"
                title="Expand sidebar menu"
              >
                <Logo size={28} className="shadow-md" />
              </div>
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={() => {
                    setIsHovered(false);
                    onToggleCollapse();
                  }}
                  className="grid place-items-center h-7 w-7 rounded-lg border border-white/15 bg-white/5 text-[#b0d4e0] hover:text-white hover:bg-white/15 hover:border-white/30 transition cursor-pointer flex-shrink-0"
                  title="Expand sidebar menu"
                >
                  <PanelLeftOpen size={14} />
                </button>
              )}
            </div>
          )}

          {/* Expanded View (Permanently open, or hovering to peek, or mobile drawer): Full Logo + Portal Title */}
          <div className={`items-center gap-2.5 min-w-0 ${!isExpanded ? "flex lg:hidden" : "flex"}`}>
            <Logo size={36} className="flex-shrink-0 shadow-lg" />
            <div className="min-w-0 truncate">
              <div className="font-bold text-[13px] text-white truncate">GiteaForge LMS</div>
              <div className="text-[10px] tracking-widest uppercase text-[#5eead4] font-bold truncate">
                {role} Portal
              </div>
            </div>
          </div>

          {/* Desktop Toggle Button (When Expanded or Peeking) */}
          {isExpanded && onToggleCollapse && (
            <button
              type="button"
              onClick={() => {
                setIsHovered(false);
                onToggleCollapse();
              }}
              className="hidden lg:grid place-items-center h-8 w-8 rounded-xl border border-white/15 bg-white/5 text-[#b0d4e0] hover:text-white hover:bg-white/15 hover:border-white/30 transition cursor-pointer flex-shrink-0 ml-auto"
              title={collapsed ? "Click to lock sidebar expanded" : "Collapse sidebar menu"}
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
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

        <div className="p-2 space-y-1 overflow-y-auto flex-1 overscroll-contain touch-pan-y custom-scrollbar">
          {nav.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setPage(item.id);
                  setMobileOpen(false);
                  setIsHovered(false);
                }}
                title={!isExpanded ? item.label : undefined}
                className={`w-full flex items-center rounded-xl text-[13px] text-left transition-snappy cursor-pointer relative group ${
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
            className="h-8 w-8 rounded-full border-2 border-white/20 object-cover flex-shrink-0"
            alt="User"
            title={!isExpanded ? `${userName} (${userDept})` : undefined}
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
    </>
  );
};

export default Sidebar;
