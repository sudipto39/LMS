// src/components/common/Navbar.tsx
import React, { useRef, useEffect, useState, useMemo } from "react";
import Logo from "../landing/Logo";
import { Search, Sun, Moon, Bell, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { GlobalSearchDropdown } from "./GlobalSearchDropdown";
import { NotificationDropdown } from "./NotificationDropdown";
import { activitiesApi } from "../../api";
import type {
  Project,
  Milestone,
  User,
  ProblemStatement,
  LabAssignment,
  Batch,
  Course,
  ActivityItem,
} from "../../types";

interface NavbarProps {
  page: string;
  setPage: (p: string) => void;
  search: string;
  setSearch: (s: string) => void;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  setMobileOpen: (open: boolean) => void;
  projects?: Project[];
  milestones?: Milestone[];
  users?: User[];
  problemStatements?: ProblemStatement[];
  labAssignments?: LabAssignment[];
  batches?: Batch[];
  courses?: Course[];
  activities?: ActivityItem[];
  onSelectProject?: (id: string) => void;
  onSelectLab?: (lab: LabAssignment) => void;
  onSelectProblemStatement?: (statement: ProblemStatement) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  page,
  setPage,
  search,
  setSearch,
  showSearch,
  setShowSearch,
  setMobileOpen,
  projects = [],
  milestones = [],
  users = [],
  problemStatements = [],
  labAssignments = [],
  batches = [],
  courses = [],
  activities = [],
  onSelectProject = () => {},
  onSelectLab,
  onSelectProblemStatement,
}) => {
  const { user, role } = useAuth();
  const { dark, toggleDark } = useTheme();
  const showToast = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notificationContainerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [internalActivities, setInternalActivities] = useState<ActivityItem[]>(activities || []);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`lms_read_notifs_${user?.id || "guest"}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Sync internal activities when activities prop updates
  useEffect(() => {
    if (activities && activities.length > 0) {
      setInternalActivities(activities);
    }
  }, [activities]);

  // Fetch activities if not provided or empty using role-specific API
  useEffect(() => {
    if (!activities || activities.length === 0) {
      const fetcher =
        role === "ADMIN"
          ? activitiesApi.getAdminActivities
          : role === "SUPERVISOR"
          ? activitiesApi.getSupervisorActivities
          : activitiesApi.getMyActivities;

      fetcher()
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) {
            setInternalActivities(res.data);
          }
        })
        .catch(() => {});
    }
  }, [activities, role]);

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        notificationContainerRef.current &&
        !notificationContainerRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showNotifications]);

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

  // Calculate unread count strictly within user's RBAC scope
  const unreadCount = useMemo(() => {
    let count = 0;
    const seen = new Set<string>();

    if (role === "STUDENT") {
      milestones.forEach((m) => {
        if (!userProjectIds.has(m.projectId)) return;
        if (m.status === "REJECTED" && !readNotificationIds.has(`notif-ms-rej-${m.id}`)) {
          seen.add(`notif-ms-rej-${m.id}`);
          count++;
        }
        if (m.status === "APPROVED" && !readNotificationIds.has(`notif-ms-appr-${m.id}`)) {
          seen.add(`notif-ms-appr-${m.id}`);
          count++;
        }
      });
    } else if (role === "SUPERVISOR") {
      milestones.forEach((m) => {
        if (!userProjectIds.has(m.projectId)) return;
        if (m.status === "SUBMITTED" && !readNotificationIds.has(`notif-sup-review-${m.id}`)) {
          seen.add(`notif-sup-review-${m.id}`);
          count++;
        }
      });
      userProjects.forEach((p) => {
        if (
          p.requestedSupervisorId === user?.id &&
          p.supervisorRequestStatus === "PENDING" &&
          !readNotificationIds.has(`notif-sup-req-${p.id}`)
        ) {
          seen.add(`notif-sup-req-${p.id}`);
          count++;
        }
      });
    } else if (role === "ADMIN") {
      milestones.forEach((m) => {
        if (m.status === "SUBMITTED" && !readNotificationIds.has(`notif-adm-ms-${m.id}`)) {
          seen.add(`notif-adm-ms-${m.id}`);
          count++;
        }
      });
    }

    internalActivities.forEach((act) => {
      if (seen.has(act.id)) return;
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

        if (!isUserProject && !isUserActivity) return;
      }
      if (!readNotificationIds.has(act.id)) {
        count++;
      }
    });

    return count;
  }, [
    role,
    milestones,
    userProjects,
    userProjectIds,
    userProjectTitles,
    internalActivities,
    readNotificationIds,
    user?.id,
    user?.name,
  ]);

  const handleMarkRead = (id: string) => {
    setReadNotificationIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(`lms_read_notifs_${user?.id || "guest"}`, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  const handleMarkAllRead = () => {
    const next = new Set<string>();
    if (role === "STUDENT") {
      milestones.forEach((m) => {
        if (!userProjectIds.has(m.projectId)) return;
        next.add(`notif-ms-rej-${m.id}`);
        next.add(`notif-ms-appr-${m.id}`);
      });
    } else if (role === "SUPERVISOR") {
      milestones.forEach((m) => {
        if (!userProjectIds.has(m.projectId)) return;
        next.add(`notif-sup-review-${m.id}`);
      });
      userProjects.forEach((p) => {
        if (p.requestedSupervisorId === user?.id) {
          next.add(`notif-sup-req-${p.id}`);
        }
      });
    }
    internalActivities.forEach((act) => next.add(act.id));
    setReadNotificationIds(next);
    try {
      localStorage.setItem(`lms_read_notifs_${user?.id || "guest"}`, JSON.stringify([...next]));
    } catch {}
    showToast("All notifications marked as read ✓");
  };

  const handleClearAll = () => {
    handleMarkAllRead();
    setShowNotifications(false);
  };

  // ── Typewriter Greeting Effect ───────────────────────────────────────────
  const [typedCount, setTypedCount] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const firstName = user?.name ? user.name.split(" ")[0] : "User";
  const fullWelcomeText = `Welcome back, ${firstName}`;
  const prefix = "Welcome back, ";

  useEffect(() => {
    setTypedCount(0);
    setIsTypingComplete(false);
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setTypedCount(index);
      if (index >= fullWelcomeText.length) {
        clearInterval(interval);
        setIsTypingComplete(true);
      }
    }, 85);

    return () => clearInterval(interval);
  }, [user?.name, firstName]);

  const userAvatar =
    user?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      user?.name || user?.email || "User"
    )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`;

  // ── Global Hotkey Listener: Ctrl+K / Cmd+K / Esc ─────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsFocused(true);
      } else if (e.key === "Escape") {
        setSearch("");
        setIsFocused(false);
        setShowSearch(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSearch, setShowSearch]);

  // ── Click Outside Listener ───────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = () => {
    setSearch("");
    setIsFocused(false);
    setShowSearch(false);
  };

  const showDropdown = typeof search === "string" && search.trim().length > 0;

  return (
    <>
      <header
        className="sticky top-0 z-30 h-[56px] sm:h-[60px] border-b backdrop-blur-xl flex items-center gap-2 sm:gap-3 px-3 sm:px-4 transition-colors"
        style={{
          background: dark ? "rgba(15,26,36,0.88)" : "rgba(255,255,255,0.88)",
          borderColor: "var(--bdr)",
          boxShadow: dark ? "0 1px 0 0 rgba(255,255,255,0.04)" : "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden h-9 w-9 grid place-items-center rounded-xl border flex-shrink-0 cursor-pointer transition-snappy hover:border-[var(--acc)]"
          style={{ borderColor: "var(--bdr)", background: "var(--srf)" }}
        >
          <Menu size={16} />
        </button>


        <div
          className="hidden md:flex items-center gap-2 text-[12px] min-w-0"
          style={{ color: "var(--t2)" }}
        >
          <span className="capitalize font-medium">{role.toLowerCase()}</span>
          <span style={{ color: "var(--bdr)" }}>/</span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0e4a5e] text-white capitalize truncate shadow-sm">
            {page}
          </span>

          <span className="hidden lg:inline-block h-3.5 w-px mx-1" style={{ background: "var(--bdr)" }} />

          <span className="hidden lg:flex items-center gap-1 text-[12px] font-medium text-[var(--t1)] truncate select-none">
            <span style={{ color: "var(--t2)" }}>
              {fullWelcomeText.slice(0, Math.min(typedCount, prefix.length))}
            </span>
            {typedCount > prefix.length && (
              <span className="font-bold tracking-tight bg-gradient-to-r from-[var(--acc)] to-[#2563eb] bg-clip-text text-transparent">
                {fullWelcomeText.slice(prefix.length, typedCount)}
              </span>
            )}
            {!isTypingComplete ? (
              <span className="inline-block w-1.5 h-3.5 bg-[var(--acc)] rounded-sm animate-pulse ml-0.5" />
            ) : (
              <span className="animate-wave-hand text-[14px] ml-0.5">👋</span>
            )}
          </span>
        </div>

        <div className="lg:hidden flex items-center gap-1.5 font-bold text-[14px] truncate">
          <Logo size={22} /> GiteaForge
        </div>

        <div className="flex-1" />

        {/* ── DESKTOP GLOBAL SEARCH BAR ──────────────────────────────────── */}
        <div ref={searchContainerRef} className="relative hidden xl:block">
          <div
            className={`flex h-8 px-3 rounded-xl items-center gap-2 text-[12px] border transition-all duration-200 lum-border ${
              isFocused
                ? "ring-2 ring-cyan-500/20 border-[var(--acc)] shadow-[0_2px_14px_rgba(6,182,214,0.15)]"
                : "hover:border-[var(--acc)]/60"
            }`}
            style={{
              borderColor: isFocused ? "var(--acc)" : "var(--bdr)",
              background: "var(--srf2)",
              color: "var(--t2)",
              width: isFocused || search ? "280px" : "210px",
            }}
          >
            <Search size={13} className="flex-shrink-0" style={{ color: isFocused ? "var(--acc)" : "inherit" }} />
            <input
              ref={searchInputRef}
              value={search}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search (Ctrl+K)..."
              className="bg-transparent focus:outline-none flex-1 min-w-0 text-[12px]"
              style={{ color: "var(--t1)" }}
            />
            {search ? (
              <button
                type="button"
                onClick={handleClear}
                className="hover:opacity-70 cursor-pointer flex-shrink-0"
              >
                <X size={12} />
              </button>
            ) : (
              <span
                className="text-[10px] mono border px-1.5 py-0.5 rounded font-semibold opacity-60 flex-shrink-0 select-none"
                style={{ borderColor: "var(--bdr)" }}
              >
                ⌘K
              </span>
            )}
          </div>

          {/* Desktop Dropdown */}
          {showDropdown && (
            <GlobalSearchDropdown
              searchQuery={search}
              onClearSearch={handleClear}
              projects={projects || []}
              milestones={milestones || []}
              users={users || []}
              problemStatements={problemStatements || []}
              labAssignments={labAssignments || []}
              batches={batches || []}
              courses={courses || []}
              currentRole={role || "STUDENT"}
              onNavigatePage={(p) => {
                setPage(p);
                handleClear();
              }}
              onSelectProject={(id) => {
                onSelectProject(id);
                handleClear();
              }}
              onSelectLab={(lab) => {
                if (onSelectLab) onSelectLab(lab);
                handleClear();
              }}
              onSelectProblemStatement={(ps) => {
                if (onSelectProblemStatement) onSelectProblemStatement(ps);
                handleClear();
              }}
            />
          )}
        </div>

        {/* Mobile Search Toggle */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="xl:hidden h-9 w-9 rounded-full border grid place-items-center flex-shrink-0 cursor-pointer"
          style={{ borderColor: "var(--bdr)", background: "var(--srf)" }}
        >
          <Search size={14} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleDark}
          className="h-9 w-9 rounded-full border grid place-items-center transition flex-shrink-0 cursor-pointer"
          style={{
            borderColor: "var(--bdr)",
            background: dark ? "#22d3ee" : "#0f2a33",
            color: dark ? "#0f2a33" : "#fff",
          }}
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Verified Account Role Badge */}
        <div
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold tracking-wide flex-shrink-0 select-none"
          style={{
            borderColor:
              role === "ADMIN"
                ? "#a855f750"
                : role === "SUPERVISOR"
                ? "#f59e0b50"
                : "#06b6d450",
            background:
              role === "ADMIN"
                ? "#a855f715"
                : role === "SUPERVISOR"
                ? "#f59e0b15"
                : "#06b6d415",
            color:
              role === "ADMIN"
                ? "#c084fc"
                : role === "SUPERVISOR"
                ? "#fbbf24"
                : "#22d3ee",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background:
                role === "ADMIN"
                  ? "#c084fc"
                  : role === "SUPERVISOR"
                  ? "#fbbf24"
                  : "#22d3ee",
            }}
          />
          {role}
        </div>

        {/* ── Notification Bell with Badge & Interactive Center ────── */}
        <div className="relative" ref={notificationContainerRef}>
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            aria-label="Notifications"
            className="grid h-9 w-9 rounded-full border place-items-center flex-shrink-0 cursor-pointer transition hover:border-[var(--acc)] relative"
            style={{
              borderColor: showNotifications ? "var(--acc)" : "var(--bdr)",
              background: showNotifications ? "var(--srf2)" : "var(--srf)",
            }}
          >
            <Bell size={14} className={unreadCount > 0 ? "text-[var(--acc)]" : "text-[var(--t2)]"} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-red-500 text-white rounded-full text-[9px] font-bold grid place-items-center shadow-xs animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            activities={internalActivities}
            projects={projects}
            milestones={milestones}
            onSelectProject={onSelectProject}
            onNavigatePage={(p) => setPage(p)}
            readIds={readNotificationIds}
            onMarkAllRead={handleMarkAllRead}
            onMarkRead={handleMarkRead}
            onClearAll={handleClearAll}
          />
        </div>

        <img
          src={userAvatar}
          className="h-9 w-9 rounded-full border-2 cursor-pointer flex-shrink-0 object-cover"
          style={{ borderColor: "var(--bdr)" }}
          onClick={() => setPage("profile")}
          alt="Profile"
        />
      </header>

      {/* ── MOBILE SEARCH BAR & DROPDOWN ───────────────────────────────── */}
      {showSearch && (
        <div
          className="xl:hidden sticky top-[56px] sm:top-[60px] z-40 px-3 py-2 border-b backdrop-blur-xl relative"
          style={{
            background: dark ? "rgba(15,26,36,0.95)" : "rgba(255,255,255,0.95)",
            borderColor: "var(--bdr)",
          }}
        >
          <div
            className="flex h-10 px-3 rounded-xl items-center gap-2 text-[13px] border"
            style={{ borderColor: "var(--bdr)", background: "var(--srf2)" }}
          >
            <Search size={14} style={{ color: "var(--t2)" }} />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search (Ctrl+K)..."
              className="bg-transparent focus:outline-none flex-1"
              style={{ color: "var(--t1)" }}
            />
            <button
              onClick={handleClear}
              className="cursor-pointer"
            >
              <X size={14} style={{ color: "var(--t2)" }} />
            </button>
          </div>

          <div className="relative mt-2">
            <GlobalSearchDropdown
              searchQuery={search}
              onClearSearch={handleClear}
              projects={projects || []}
              milestones={milestones || []}
              users={users || []}
              problemStatements={problemStatements || []}
              labAssignments={labAssignments || []}
              batches={batches || []}
              courses={courses || []}
              currentRole={role || "STUDENT"}
              onNavigatePage={(p) => {
                setPage(p);
                handleClear();
              }}
              onSelectProject={(id) => {
                onSelectProject(id);
                handleClear();
              }}
              onSelectLab={(lab) => {
                if (onSelectLab) onSelectLab(lab);
                handleClear();
              }}
              onSelectProblemStatement={(ps) => {
                if (onSelectProblemStatement) onSelectProblemStatement(ps);
                handleClear();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
